import {
  UserRole,
  Gender,
  VendorTier,
  BusinessType,
  PaymentModel,
  PrimaryContactMethod,
  VerificationType,
  VerificationStatus,
} from '../generated/prisma/client.js';
import { prisma } from './prisma.js';

/**
 * Seeds the database with initial data required for development and testing.
 * Creates 8 business categories, an admin user, and two test vendor accounts
 * (one at TIER_0 with an incomplete profile, one at TIER_3 with full verifications).
 *
 * Run via: `npm run seed`
 *
 * @throws Exits the process with code 1 if seeding fails
 */
async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // 1. SEED BUSINESS CATEGORIES
  // ============================================

  const categories = [
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, footwear, and accessories',
      subcategories: ['Clothing', 'Footwear', 'Accessories', 'Bags', 'Jewelry', 'Watches'],
      display_order: 1,
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Phones, computers, and gadgets',
      subcategories: ['Phones', 'Laptops', 'Accessories', 'Gaming', 'Audio', 'Smart Devices'],
      display_order: 2,
    },
    {
      name: 'Beauty & Personal Care',
      slug: 'beauty-personal-care',
      description: 'Cosmetics, skincare, and haircare',
      subcategories: ['Makeup', 'Skincare', 'Haircare', 'Fragrances', 'Bath & Body', 'Tools'],
      display_order: 3,
    },
    {
      name: 'Food & Beverages',
      slug: 'food-beverages',
      description: 'Groceries, snacks, and drinks',
      subcategories: [
        'Groceries',
        'Snacks',
        'Beverages',
        'Fresh Produce',
        'Frozen Foods',
        'Condiments',
      ],
      display_order: 4,
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Furniture, decor, and appliances',
      subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bedding', 'Storage', 'Appliances'],
      display_order: 5,
    },
    {
      name: 'Health & Fitness',
      slug: 'health-fitness',
      description: 'Supplements, equipment, and wellness',
      subcategories: [
        'Supplements',
        'Equipment',
        'Sportswear',
        'Yoga & Meditation',
        'Fitness Trackers',
      ],
      display_order: 6,
    },
    {
      name: 'Baby & Kids',
      slug: 'baby-kids',
      description: "Baby products, toys, and children's items",
      subcategories: ['Baby Care', 'Toys', 'Children Clothing', 'Feeding', 'Nursery', 'Books'],
      display_order: 7,
    },
    {
      name: 'Services',
      slug: 'services',
      description: 'Professional and personal services',
      subcategories: [
        'Photography',
        'Event Planning',
        'Cleaning',
        'Tutoring',
        'Beauty Services',
        'Consulting',
      ],
      display_order: 8,
    },
  ];

  for (const category of categories) {
    await prisma.businessCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  console.log('✅ Business categories seeded');

  // ============================================
  // 2. CREATE ADMIN USER
  // ============================================

  // const adminPassword = await bcrypt.hash('admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@novahq.co' },
    update: {},
    create: {
      email: 'workspace.shopcop@gmail.com',
      role: UserRole.ADMIN,
      email_verified: true,
      is_active: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ============================================
  // 3. CREATE TEST VENDOR (TIER 0 - Incomplete Profile)
  // ============================================

  // const vendorPassword = await bcrypt.hash('vendor123!', 10);
  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@test.com',
      role: UserRole.VENDOR,
      email_verified: true,
      is_active: true,
      vendor_profile: {
        create: {
          current_tier: VendorTier.TIER_0,
          verification_points: 0,
          personal_info_complete: false,
          business_info_complete: false,
          profile_completeness: 0,

          refund_policy_type: 'NO_REFUNDS',
          refund_duration_days: null,
          refund_conditions: [],
          refund_custom_notes: 'All sales are final. Please inspect items before purchase.',
        },
      },
    },
    include: {
      vendor_profile: true,
    },
  });
  console.log('✅ Test vendor created (TIER 0):', vendorUser.email);

  // ============================================
  // 4. CREATE VERIFIED VENDOR (TIER 3 - Elite)
  // ============================================

  const verifiedVendorUser = await prisma.user.create({
    data: {
      email: 'verified.vendor@test.com',
      role: UserRole.VENDOR,
      email_verified: true,
      is_active: true,
      vendor_profile: {
        create: {
          // Personal Info
          first_name: 'Chike',
          middle_name: 'Emeka',
          last_name: 'Okafor',
          gender: Gender.MALE,
          date_of_birth: new Date('1990-05-15'),
          phone_number: '+2348012345678',

          // Business Info
          business_name: 'ChiStyle Fashion Hub',
          slug: 'chistyle-fashion-hub',
          business_description:
            'Premium fashion retailer specializing in contemporary African wear and modern streetwear. We deliver quality across Lagos and beyond.',
          profile_photo_url: 'https://res.cloudinary.com/demo/image/upload/v1/vendors/profile.jpg',

          // Location
          state: 'Lagos',
          city: 'Lagos',
          street_address: '15 Admiralty Way, Lekki Phase 1',
          landmark: 'Opposite Circle Mall',
          latitude: 6.4474,
          longitude: 3.47,

          // Categories
          primary_category: 'fashion',
          subcategories: ['Clothing', 'Footwear', 'Accessories'],

          // Payment
          bank_name: 'Access Bank',
          account_number: '0123456789',
          account_name: 'Chike Okafor',
          payment_models: [PaymentModel.FULL_PAYMENT, PaymentModel.PART_PAYMENT],

          // Refund policy
          refund_policy_type: 'FULL_REFUND',
          refund_duration_days: 14,
          refund_conditions: [
            'Item must be unused with original tags',
            'Original packaging required',
            'Receipt or proof of purchase needed',
            'Buyer covers return shipping',
          ],
          refund_custom_notes:
            'Refund processed within 5-7 business days after we receive the item.',

          // Social
          instagram_handle: '@chistylehub',
          whatsapp_number: '+2348012345678',
          primary_contact: PrimaryContactMethod.WHATSAPP,

          // Tier Status
          current_tier: VendorTier.TIER_3,
          verification_points: 25, // NIN (10) + CAC (15)
          personal_info_complete: true,
          business_info_complete: true,
          profile_completeness: 100,

          // Verifications
          verifications: {
            create: [
              {
                type: VerificationType.NIN,
                status: VerificationStatus.APPROVED,
                points_value: 10,
                nin_number: '12345678901',
                nin_full_name: 'Chike Emeka Okafor',
                govt_id_front_url: 's3://govt-ids/nin-front.jpg',
                reviewed_by: admin.id,
                reviewed_at: new Date(),
                approved_at: new Date(),
              },
              {
                type: VerificationType.CAC,
                status: VerificationStatus.APPROVED,
                points_value: 15,
                cac_rc_number: 'RC123456',
                cac_company_type: BusinessType.BUSINESS_NAME,
                cac_certificate_url: 's3://business-docs/cac-cert.pdf',
                reviewed_by: admin.id,
                reviewed_at: new Date(),
                approved_at: new Date(),
              },
            ],
          },
        },
      },
    },
    include: {
      vendor_profile: {
        include: {
          verifications: true,
        },
      },
    },
  });
  console.log('✅ Verified vendor created (TIER 3):', verifiedVendorUser.email);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
