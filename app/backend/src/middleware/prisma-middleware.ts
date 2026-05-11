import { Prisma } from 'generated/prisma/client.js';
import {prisma} from '@config/prisma.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ============================================
// PASSWORD HASHING MIDDLEWARE
// ============================================
prisma.$use(async (params, next) => {
  // Hash password before creating/updating user
  if (params.model === 'User') {
    if (params.action === 'create' || params.action === 'update') {
      if (params.args.data.password_hash) {
        const password = params.args.data.password_hash;
        
        // Only hash if it's not already hashed (doesn't start with $2)
        if (!password.startsWith('$2')) {
          params.args.data.password_hash = await bcrypt.hash(password, 10);
        }
      }
    }
  }
  
  return next(params);
});

// ============================================
// VENDOR SLUG GENERATION MIDDLEWARE
// ============================================
prisma.$use(async (params, next) => {
  if (params.model === 'VendorProfile' && params.action === 'create') {
    const businessName = params.args.data.business_name;
    
    if (businessName && !params.args.data.slug) {
      // Generate slug from business name
      let slug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Ensure uniqueness
      let isUnique = false;
      let attempts = 0;
      let finalSlug = slug;
      
      while (!isUnique && attempts < 10) {
        const existing = await prisma.vendorProfile.findUnique({
          where: { slug: finalSlug },
        });
        
        if (!existing) {
          isUnique = true;
        } else {
          // Append random 4-digit number
          const suffix = Math.floor(1000 + Math.random() * 9000);
          finalSlug = `${slug}-${suffix}`;
          attempts++;
        }
      }
      
      params.args.data.slug = finalSlug;
    }
  }
  
  return next(params);
});

// ============================================
// TRANSACTION TRACKING SLUG GENERATION
// ============================================
prisma.$use(async (params, next) => {
  if (params.model === 'Transaction' && params.action === 'create') {
    if (!params.args.data.tracking_slug) {
      // Generate unique 8-character alphanumeric tracking slug
      let trackingSlug = '';
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        trackingSlug = crypto.randomBytes(4).toString('hex'); // 8 characters
        
        const existing = await prisma.transaction.findUnique({
          where: { tracking_slug: trackingSlug },
        });
        
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      params.args.data.tracking_slug = trackingSlug;
    }
  }
  
  return next(params);
});

// ============================================
// REVIEW CATEGORIZATION MIDDLEWARE
// ============================================
prisma.$use(async (params, next) => {
  if (params.model === 'Review' && (params.action === 'create' || params.action === 'update')) {
    const rating = params.args.data.rating;
    
    if (rating !== undefined) {
      // Auto-categorize as positive (4-5) or negative (1-3)
      params.args.data.review_type = rating >= 4 ? 'positive' : 'negative';
    }
  }
  
  return next(params);
});

// ============================================
// SOFT DELETE MIDDLEWARE (for Products)
// ============================================
prisma.$use(async (params, next) => {
  if (params.model === 'Product') {
    if (params.action === 'delete') {
      // Convert delete to soft delete (set deleted_at)
      params.action = 'update';
      params.args.data = { deleted_at: new Date() };
    }
    
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      // Exclude soft-deleted products
      params.action = 'findFirst';
      params.args.where = {
        ...params.args.where,
        deleted_at: null,
      };
    }
    
    if (params.action === 'findMany') {
      // Exclude soft-deleted products from lists
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }
      params.args.where.deleted_at = null;
    }
  }
  
  return next(params);
});

// ============================================
// UPDATED_AT AUTO-UPDATE
// ============================================
// (Prisma handles this automatically with @updatedAt, no middleware needed)