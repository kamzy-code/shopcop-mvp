![][image1]

**Functional Requirements**

Founder Dōjō Imo

**Team / Company Name:**  COPTECH SOLUTIONS

**Product / Solution Name:**  Shopcop

**Team Members:** Evarist Philips, Udochukwu Chikezie, Obi Divine.

**Mentor: ** Bob Upham.

**Date:**  30/04/2026 

**Version:**  0.1

**One-line solution hypothesis:**  Nova enables vendors to prove their legitimacy at scale and gives buyers the confidence to buy in social commerce.

**Document Structure**

FR-XXX: Functional Requirement ID

Priority: P0 (must-have MVP) or P1 (post-MVP)

Maps to: Base Functionality reference

Format: GIVEN \[initial state\] WHEN \[user action\] THEN \[system response\]

**Key Requirements Summary**

The following table provides a high-level overview of all functional requirement sections:

| Section | Description | FR Range | Total FR |
| :---- | :---- | :---- | :---- |
| Section 1 | User Management & Authentication | FR-001 to FR-019 | 19 |
| Section 2 | Vendor Profile Creation & Management | FR-020 to FR-035 | 16 |
| Section 3 | Product Listing & Management | FR-036 to FR-042 | 7 |
| Section 4 | Transaction & Order Tracking | FR-043 to FR-050 | 8 |
| Section 5 | Review System | FR-051 to FR-059 | 9 |
| Section 6 | File Uploads & Cloud Storage | FR-060 to FR-064 | 5 |
| Section 7 | Content Moderation | FR-065 to FR-069 | 5 |
| Section 8 | Vendor Profile Public View | FR-070 to FR-080 | 11 |
| Section 9 | Profile Sharing & Discoverability | FR-081 to FR-085 | 5 |
| Section 10 | Directory & Search | FR-086 to FR-097 | 12 |
| Section 11 | Caching & Performance | FR-098 to FR-100 | 3 |
| Section 12 | Admin Panel & Operations | FR-101 to FR-111 | 11 |
| Section 13 | Analytics & Tracking | FR-112 to FR-115 | 4 |
| Section 14 | Notifications | FR-116 to FR-120 | 5 |
| Section 15 | Security & Error Handling | FR-121 to FR-128 | 8 |
| **TOTAL** | **15 Sections** | **FR-001 to FR-128** | **128 Requirements** |

---

1. **USER MANAGEMENT & AUTHENTICATION**

**FR-001: Vendor Account Registration**  
**Priority: P0**  
**Maps to: 1.1 User Registration, 1.2 Phone Number Verification**

GIVEN: User is on NOVA homepage  
WHEN: User clicks "Create Vendor Profile" button  
THEN: 

* System navigates to registration page  
* System displays form with fields:  
* Email   
* Password (minimum 8 characters)  
* Confirm Password  
* System displays "Create Account" button (disabled until all fields valid)  
* System displays "Already have an account? Log in" link

---

**FR-002: Phone Number Format Validation**  
**Priority: P0**  
**Maps to: 1.1 User Registration**

GIVEN: User is on registration page  
WHEN: User enters phone number  
THEN:

* System validates input is numeric only  
* System auto-formats to Nigerian format (0801234567 → \+234-801-234-5678)  
* If invalid format: Display inline error "Please enter a valid Nigerian phone number"  
* If valid: Remove error message, enable "Send OTP" button

---

**FR-003: Password Strength Validation**  
**Priority: P0**  
**Maps to: 11.1 Password Security**

GIVEN: User is on registration page  
WHEN: User types in password field  
THEN:

* System validates in real-time:  
  * Minimum 8 characters  
  * At least 1 number  
  * At least 1 special character (\!@\#$%^&\*)  
*  System displays strength indicator:  
  * Red \= Weak (missing requirements)  
  * Yellow \= Medium (meets minimum)  
  * Green \= Strong (exceeds minimum)  
*   If password doesn't meet requirements: Display inline error listing missing criteria  
*   If "Confirm Password" doesn't match: Display error "Passwords must match"

---

**FR-004: Email Uniqueness Check**  
**Priority: P0**  
**Maps to: 1.2 Email/Phone Number Verification, 6.6 Duplicate Detection**

GIVEN: User has entered valid email and password  
WHEN: User clicks "Send OTP" button  
THEN:

* System checks if email already exists in database  
* If email exists: Display error "This email is already registered. Log in instead."  
* If email unique: Proceed to FR-005

---

**FR-005: OTP Generation and Delivery**  
**Priority: P0**  
**Maps to: 1.2 Email/Phone Number Verification, 3.1 SMS Gateway Integration**

GIVEN: User's email/phone number is unique and valid  
WHEN: User clicks "Send OTP" button  
THEN:

* System generates random 6-digit numeric OTP  
* System stores OTP in database/Redis with:  
  * Email/Phone number  
  * OTP code  
  * Expiry timestamp (5 minutes from now)  
  * Attempt count (initialized to 0\)  
* System sends SMS via SMS gateway or Email via provider:  
  * Message: "Your NOVA verification code is \[123456\]. Valid for 5 minutes."  
* If delivery succeeds:  
  * Display success message "OTP sent to \+234-XXX-XXX-5678 or user@email.com"  
  * Navigate to OTP verification page  
  * Start 5-minute countdown timer  
* If delivery fails:  
  * Display error "Failed to send OTP. Please try again."  
  * Log error to system ***(FR-XXX)***

---

**FR-006: OTP Verification**  
**Priority: P0**  
**Maps to: 1.2 Phone Number Verification**

GIVEN: User is on OTP verification page with active OTP  
WHEN: User enters 6-digit code and clicks "Verify"  
THEN:

* System validates OTP:  
  * Check if OTP matches stored code for this phone number  
  * Check if OTP has not expired (within 5 minutes)  
  * Check if attempt count \< 5  
* If OTP correct and valid:  
  * Create user account in database with status "phone\_verified"  
  * Generate JWT authentication token  
  * Store session (FR-013)  
  * Navigate to "Basic Business Info" page (FR-030)  
* If OTP incorrect:  
  * Increment attempt count  
  * Display error "Invalid code. \[X\] attempts remaining."  
  * If attempt count \= 5: Lock OTP, display "Too many failed attempts. Request new OTP."  
* If OTP expired:  
  * Display error "Code expired. Request new OTP."

---

**FR-007: Resend OTP**  
**Priority: P0**  
**Maps to: 1.2 Phone Number Verification, 8.2 Spam Prevention**

GIVEN: User is on OTP verification page  
WHEN: User clicks "Resend OTP" link  
THEN:

* System checks resend attempt count for this phone number  
* If resend count \< 3:  
  * Invalidate previous OTP  
  * Generate new 6-digit OTP (FR-005)  
  * Reset 5-minute timer  
  * Increment resend count  
  * Display success "New code sent"  
* If resend count ≥ 3:  
  * Display error "Maximum resend attempts reached. Try again in 15 minutes."  
  * Implement 15-minute cooldown per phone number

---

**FR-008: Buyer Account Registration (Optional)**  
**Priority: P1 (Buyers can browse without account for MVP)**  
**Maps to: 1.1 User Registration**

GIVEN: User wants to create buyer account  
WHEN: User selects "I'm a Buyer" during signup  
THEN:

* System follows same flow as FR-001 to FR-006  
* System creates account with role \= "buyer"  
* System redirects to directory homepage (no profile creation required)

---

**FR-009: User Login**  
**Priority: P0**  
**Maps to: 1.3 Authentication System**

GIVEN: User has existing verified account  
WHEN: User enters phone number \+ password and clicks "Log In"  
THEN:

* System validates credentials:  
  * Check if email exists in database  
  * Sends a magic link to email t continue signin  
* If credentials valid:  
  * Generate JWT token with user\_id, role, expiry (30 days)  
  * Store session (FR-013)  
  * If vendor: Redirect to vendor dashboard  
  * If buyer: Redirect to directory homepage  
  * If admin: Redirect to admin panel  
* If credentials invalid:  
  * Increment failed login attempt count for this email  
  * Display error "Invalid credential"  
  * If attempt count \= 5: Lock account for 15 minutes (FR-010)  
* If account locked:  
  * \`Display error "Account locked due to multiple failed attempts. Try again in \[X\] minutes."

---

**FR-010: Failed Login Attempt Lockout**  
**Priority: P0**  
**Maps to: 11.3 Rate Limiting & Anti-Abuse**

GIVEN: User has failed login 5 times  
WHEN: User attempts to log in again  
THEN:

* System checks lockout timestamp  
* If current time \< lockout expiry (15 minutes):  
  * Display error "Account temporarily locked. Try again at \[HH:MM\]."  
  * Do not validate credentials (prevent brute force)  
* If current time ≥ lockout expiry:  
  * Reset failed attempt count to 0  
  * Proceed with normal login validation (FR-009)

---

**FR-011: "Remember Me" Functionality**  
**Priority: P1**  
**Maps to: 1.4 Session Management**

GIVEN: User is logging in  
WHEN: User checks "Remember Me" checkbox before clicking "Log In"  
THEN:

* System generates JWT token with extended expiry (90 days instead of 30\)  
* System stores token in browser localStorage (not sessionStorage)  
* System keeps user logged in across browser sessions

---

**FR-012: User Logout**  
**Priority: P0**  
**Maps to: 1.3 Authentication System**

GIVEN: User is logged in  
WHEN: User clicks "Log Out" button  
THEN:

* System invalidates JWT token (add to blacklist or remove from database)  
* System clears browser session/localStorage  
* System redirects to homepage  
* System displays success message "Logged out successfully"

---

**FR-013: Session Management**  
**Priority: P0**  
**Maps to: 1.4 Session Management**

GIVEN: User has logged in successfully  
WHEN: User navigates to any protected page  
THEN:

* System checks for valid JWT token in request headers  
* If token valid and not expired:  
  * Allow access to requested page  
  * Refresh token expiry on activity (sliding session)  
* If token expired:  
  * Redirect to login page  
  * Display message "Your session has expired. Please log in again.”  
* If token invalid/missing:  
  * Redirect to login page

---

**FR-014: Password Reset Request**  
**Priority: P0**  
**Maps to: 1.5 Password Reset/Recovery**

GIVEN: User has forgotten password  
WHEN: User clicks "Forgot Password?" link on login page  
THEN:

* System displays password reset form with phone number field  
* User enters phone number and clicks "Send Reset Code"  
* System validates phone number exists in database  
* If phone exists:  
  * Generate 6-digit OTP (same as FR-005)  
  * Send SMS: "Your NOVA password reset code is \[123456\]. Valid for 5 minutes."  
  * Navigate to "Enter Reset Code" page  
* If phone doesn't exist:  
  * Display error "No account found with this phone number"

---

**FR-015: Password Reset Verification**  
**Priority: P0**  
**Maps to: 1.5 Password Reset/Recovery**

GIVEN: User has received password reset OTP  
WHEN: User enters OTP and clicks "Verify Code"  
THEN:

* System validates OTP (same logic as FR-006)  
* If OTP valid:  
  * Generate temporary reset token (valid 10 minutes)  
  * Navigate to "Create New Password" page  
* If OTP invalid:  
  * Display error "Invalid or expired code"

---

**FR-016: New Password Creation**  
**Priority: P0**  
**Maps to: 1.5 Password Reset/Recovery, 11.1 Password Security**

GIVEN: User has verified reset OTP  
WHEN: User enters new password and confirmation, then clicks "Reset Password"  
THEN:

* System validates new password meets requirements (FR-003)  
* System checks new password \!= old password (prevent reuse)  
* If validation passes:  
  * Hash new password with bcrypt  
  * Update password\_hash in database  
  * Invalidate all existing sessions for this user  
  * Display success "Password reset successful. Please log in."  
  * Redirect to login page  
* If validation fails:  
  * Display appropriate error message

---

**FR-017: Role-Based Access Control (Vendor)**  
**Priority: P0**  
**Maps to: 1.6 Role-Based Access Control**

GIVEN: User is logged in with role \= "vendor"  
WHEN: User attempts to access any page  
THEN:

* System checks user role from JWT token  
* If accessing vendor-only pages (profile editor, analytics):  
  * Allow access  
* If accessing admin-only pages:  
  * Display 403 error "You don't have permission to view this page"  
  * Redirect to vendor dashboard  
* If accessing public pages (directory, vendor profiles):  
  * Allow access

---

**FR-018: Role-Based Access Control (Buyer)**  
**Priority: P1**  
**Maps to: 1.6 Role-Based Access Control**

GIVEN: User is logged in with role \= "buyer"  
WHEN: User attempts to access any page  
THEN:

* If accessing buyer-allowed pages (directory, order tracking, reviews):  
  * Allow access  
* If accessing vendor-only pages (profile editor):  
  * Display error "Only vendors can access this page"  
* If accessing admin-only pages:  
  * Display 403 error

---

**FR-019: Role-Based Access Control (Admin)**  
**Priority: P0**  
**Maps to: 1.6 Role-Based Access Control**

GIVEN: User is logged in with role \= "admin"  
WHEN: User attempts to access admin panel  
THEN:

* System verifies role \= "admin" from JWT token  
*  If admin: Allow access to all admin functions (moderation, verification, user management)  
*  If not admin: Display 403 error

---

2. **VENDOR PROFILE CREATION & MANAGEMENT**

**FR-020: Basic Business Info Input**  
**Priority: P0**  
**Maps to: 2.2 Vendor Profile Database**

GIVEN: Vendor has completed phone verification (FR-006)  
WHEN: Vendor lands on "Basic Business Info" page  
THEN:

* System displays form with fields:  
  * Business Name (required, 2-100 characters)  
  * Product Category (required, dropdown \- predefined taxonomy)  
  * Business Address (required, autocomplete via Google Places API)  
  * Business Description (optional, max 500 characters, character counter)  
* All fields have inline validation  
* "Next" button disabled until required fields valid

---

**FR-021: Product Category Selection**  
**Priority: P0**  
**Maps to: 5.3 Category Filtering, 2.3 Products Database**

GIVEN: Vendor is filling basic business info  
WHEN: Vendor clicks "Product Category" dropdown  
THEN:

* System displays predefined category hierarchy:  
  * Level 1: Fashion, Electronics, Food & Groceries, Health & Beauty, Home & Garden, Automobiles, Services  
  * Level 2 (subcategories): E.g., Fashion → Clothing, Footwear, Accessories  
  * Level 3 (sub-subcategories): E.g., Footwear → Sneakers, Sandals, Boots  
* Vendor selects up to 3 categories  
* System stores selected categories with vendor profile

---

**FR-022: Business Address Autocomplete**  
**Priority: P0**  
**Maps to: 3.5 Location API Layer, 2.2 Vendor Profile Database**

GIVEN: Vendor is entering business address  
WHEN: Vendor types in address field  
THEN:

* System calls Google Places Autocomplete API  
* System displays dropdown of matching Nigerian addresses as vendor types  
* When vendor selects address:  
  * System fetches full address details (street, city, state)  
  * System calls Google Geocoding API to get latitude/longitude  
  * System stores: full\_address, city, state, latitude, longitude  
* If API call fails:  
  * Allow manual address entry (fallback)  
  * Display warning "We couldn't verify this address. Please ensure it's correct.”

---

**FR-023: Business Info Submission**  
**Priority: P0**  
**Maps to: 2.2 Vendor Profile Database**

GIVEN: Vendor has completed all required fields in basic business info  
WHEN: Vendor clicks "Next" button  
THEN:

* System validates all fields one final time  
* System saves data to vendor\_profiles table:  
  * user\_id (foreign key)  
  * business\_name  
  * categories (JSON array or separate table)  
  * full\_address, city, state, latitude, longitude  
  * business\_description  
  * profile\_status \= "incomplete" (not yet verified)  
* System navigates to "Identity Verification" page (FR-024)

---

**FR-024: NIN Input and Submission**  
**Priority: P0**  
**Maps to: 2.2 Vendor Profile Database, Component 1.1 Identity Verification**

GIVEN: Vendor is on "Identity Verification" page  
WHEN: Vendor enters NIN and uploads government ID photo  
THEN:

* System displays form:  
  * Full Legal Name (required, must match NIN record)  
  * NIN (required, exactly 11 numeric digits)  
  * Government ID Photo (required, JPG/PNG, max 2MB)  
*  System validates:  
  *  NIN format (11 digits)  
  *  Image file size ≤ 2MB  
  *  Image file type (JPEG/PNG only)  
* "Verify Identity" button disabled until all valid

---

**FR-025: NIN Verification via API**  
**Priority: P0**  
**Maps to: 3.3 Identity Verification API, 12.1 API Error Handling**

GIVEN: Vendor has entered valid NIN and uploaded ID  
WHEN: Vendor clicks "Verify Identity" button  
THEN:

* System displays loading spinner "Verifying your identity..."  
* System uploads government ID photo to cloud storage (FR-060)  
* System calls NIN verification API (Prembly/Youverify):  
  * Payload: { nin: "12345678901", full\_name: "Chimere Owunna" }  
* If API returns success (200):  
  * System compares API returned name with vendor-entered name  
  * If names match (fuzzy match, allow minor spelling differences):  
    * Update vendor profile: nin\_verified \= true, verified\_name \= \[API name\]  
    * Display success "Identity verified successfully ✓"  
    * Navigate to "Profile Setup" page (FR-028)  
  * If names don't match:  
    * Display error "The name you entered doesn't match NIN records. Please check and try again."  
* If API returns error (NIN not found, invalid):  
  * Display error "NIN verification failed. Please check your NIN and try again."  
  * Allow retry (max 3 attempts per session)  
* If API timeout (\>30 seconds):  
  * Display message "Verification is taking lon ger than usual. We'll notify you when it's complete."  
  * Save NIN as "pending\_verification"  
  * Allow vendor to proceed (manual admin review \- FR-200)

---

**FR-026: Government ID Photo Upload**  
**Priority: P0**  
**Maps to: 4.1 File Upload System, 4.2 Cloud Storage**

GIVEN: Vendor is uploading government ID photo  
WHEN: Vendor selects image file  
THEN:

* System validates file before upload:  
  * File type: JPEG, PNG only (reject GIF, WEBP, PDF)  
  * File size: ≤ 2MB  
* If validation fails:  
  * Display error "Please upload a JPG or PNG image under 2MB"  
* If validation passes:  
  * Display preview thumbnail  
  * Display upload progress bar (0-100%)  
* System uploads to cloud storage (AWS S3 private bucket)  
* System generates signed URL (valid 1 hour for admin review)  
* System stores URL in database: government\_id\_url  
* If upload fails:  
  * Display error "Upload failed. Please try again."  
  * Allow retry

---

**FR-027: NIN Verification Manual Fallback**  
**Priority: P0**  
**Maps to: 9.2 Manual Verification Workflow**

GIVEN: NIN API verification failed or timed out  
WHEN: Vendor's profile is marked "pending\_verification"  
THEN:

* System adds vendor to admin verification queue  
* Admin sees vendor in "Pending NIN Verification" tab (FR-200)  
* Admin manually reviews:  
  * Government ID photo  
  * Vendor-entered name and NIN  
* Admin approves or rejects:  
  * If approved: nin\_verified \= true  
  * If rejected: Send notification to vendor with reason  
* Vendor receives SMS/email notification of decision

---

**FR-028: Profile Photo Upload**  
**Priority: P0**  
**Maps to: 4.1 File Upload System, 4.3 Image Compression**

GIVEN: Vendor has completed identity verification  
WHEN: Vendor uploads profile photo on "Profile Setup" page  
THEN:

* System validates file (same as FR-026):  
  * JPG/PNG only  
  * Max 2MB  
* System compresses image to 500x500px (maintain aspect ratio)  
* System uploads to cloud storage (public bucket)  
* System stores public URL: profile\_photo\_url  
* System displays preview

---

**FR-029: Vendor Categorization Selection**  
**Priority: P1**  
**Maps to: Component 1.5 Vendor Categorization**

GIVEN: Vendor is on "Profile Setup" page  
WHEN: Vendor selects vendor type (for relevant categories like Automobiles)  
THEN:

* System displays radio options:  
  * "Direct Dealer" (I own the products I sell)  
  * "Broker/Agent" (I connect buyers with sellers)  
* System stores selection: vendor\_type  
* This field only appears for specific categories (Automobiles, Real Estate)

---

**FR-030: Vendor Operation Details Input**  
**Priority: P0**  
**Maps to: Component 1.6 Vendor Operation Details**

GIVEN: Vendor is on "Profile Setup" page  
WHEN: Vendor fills operation details  
THEN:

* System displays fields:  
  * Delivery Areas (multi-select checkboxes: Lagos, Abuja, Port Harcourt, Nationwide, etc.)  
  * Payment Methods (checkboxes: Full Upfront, Cash on Delivery, Part Payment, etc.)  
  * Refund Policy (dropdown: No Refunds, 7-Day Return, 14-Day Return, Custom)  
  * Custom Refund Policy (text area, max 200 chars, appears if "Custom" selected)  
* System stores selections in vendor\_profiles table  
* All fields optional for MVP (can be added later)

---

**FR-031: Social Media Linking**  
**Priority: P1**  
**Maps to: 3.6 Social Linking API Layer (DEFERRED \- manual for MVP)**

GIVEN: Vendor wants to link social media accounts  
WHEN: Vendor enters Instagram/TikTok/Facebook handles  
THEN:

* System displays input fields:  
  * Instagram Profile URL   
  * TikTok Profile URL  
  * Facebook Page URL (optional, full URL)  
*   \- System validates format (no spaces, valid characters)  
*   \- System stores URLs in vendor\_profiles table  
*   \- For MVP: Just store URLs, no API verification  
*   \- Post-MVP: Verify account exists via API (FR-032)

---

**FR-032: Social Media Verification (P1 \- Post-MVP)**  
**Priority: P1**  
**Maps to: 3.6 Social Linking API Layer**

GIVEN: Vendor has entered social media handles  
WHEN: System attempts to verify accounts (post-MVP feature)  
THEN:

* System calls Instagram Graph API to verify handle exists  
* If verified:  
  * Fetch follower count, post count  
  * Display "Verified ✓" badge next to handle on profile  
* If not found:  
  * Display warning "We couldn't verify this account. Check the handle."

---

**FR-033: Profile Slug Generation**  
**Priority: P0**  
**Maps to: 6.4 Slug Generation Engine**

GIVEN: Vendor has completed profile setup  
WHEN: Vendor clicks "Create Profile" button  
THEN:

* System generates URL slug from business\_name:  
  * Convert to lowercase  
  * Replace spaces with hyphens  
  * Remove special characters  
  * Example: "Chimere Auto's" → "chimere-autos”  
*  System checks if slug exists in database  
*  If slug exists:  
  * Append random 4-digit number: "chimere-autos-4829"  
  * Retry uniqueness check  
* System stores final slug in vendor\_profiles table  
* System generates full profile URL: https://novahq.co/v/chimere-autos-4829

---

**FR-034: Profile Creation Completion**  
**Priority: P0**  
**Maps to: 2.2 Vendor Profile Database**

GIVEN: Vendor has completed all profile setup steps  
WHEN: Vendor clicks "Create Profile" button  
THEN:

* System performs final validation (all required fields present)  
* System updates vendor profile:  
  * profile\_status \= "active"  
  * created\_at \= current timestamp  
  * Calculate initial profile\_completeness score (FR-070)  
* System displays success page:  
  * Message: "Profile created successfully\! ✓"  
  * Display profile URL with "Copy Link" button  
  * Display "Share on WhatsApp" button  
  * Display "View Profile" button (opens public profile in new tab)  
* System sends welcome SMS/Email (optional):  
  * Welcome to NOVA\! Your profile is live: \[URL\]"

---

**FR-035: Profile Editing**  
**Priority: P0**  
**Maps to: 2.2 Vendor Profile Database**

GIVEN: Vendor has active profile  
WHEN: Vendor navigates to "Edit Profile" page from dashboard  
THEN:

* System displays pre-filled form with all current data  
* Vendor can edit:  
  * Business description  
  * Profile photo  
  * Categories (add/remove)  
  * Delivery areas  
  * Payment methods  
  * Refund policy  
  * Social media links  
* Vendor CANNOT edit (require re-verification):  
  * Business name (contact support to change)  
  * NIN (locked after verification)  
  * Phone number (locked)  
* "Save Changes" button updates vendor\_profiles table  
* System displays success "Profile updated successfully"

---

3.  **PRODUCT LISTING AND MANAGEMENT**

**FR-036: Add New Product**  
**Priority: P0**  
**Maps to: 2.3 Products Database, 4.1 File Upload System**

GIVEN: Vendor is on "My Products" page  
WHEN: Vendor clicks "Add Product" button  
THEN:

* System displays product creation form:  
  * Product Name (required, max 100 chars)  
  * Description (optional, max 500 chars)  
  * Price (required, numeric, ₦)  
  * Category (dropdown, limited to vendor's selected categories)  
  * Stock Status (radio: In Stock / Out of Stock)  
  * Product Images (upload up to 5 images, min 1 required)  
* "Add Product" button disabled until required fields valid

---

**FR-037: Product Image Upload**  
**Priority: P0**  
**Maps to: 4.1 File Upload System, 4.3 Image Compression**

GIVEN: Vendor is adding/editing product  
WHEN: Vendor uploads product images  
THEN:

* System allows up to 5 images per product  
* System validates each image:  
  * File type: JPG/PNG only  
  * File size: ≤ 2MB each  
* System compresses images to max 1200x1200px (maintain aspect ratio)  
* System uploads to cloud storage (public bucket)  
* System displays thumbnail grid with delete option  
* First uploaded image \= primary image (drag to reorder)  
* System stores URLs in product\_images table (foreign key to product\_id)

---

**FR-038: Product Creation**  
**Priority: P0**  
**Maps to: 2.3 Products Database**

GIVEN: Vendor has filled all required product fields  
WHEN: Vendor clicks "Add Product" button  
THEN:

* System validates all fields  
* System creates record in products table:  
  * vendor\_id (foreign key)  
  * name, description, price, category  
  * stock\_status  
  * created\_at, updated\_at  
* System creates records in product\_images table (URLs)  
* System displays success "Product added successfully"  
* System redirects to "My Products" page showing new product

---

**FR-039: Product Listing Display (Vendor View)**  
**Priority: P0**  
**Maps to: 2.3 Products Database, 5.5 Pagination**

GIVEN: Vendor is on "My Products" page  
WHEN: Page loads  
THEN:

* System fetches all products for this vendor\_id  
* System displays products in grid layout (4 per row desktop, 2 per row mobile)  
* Each product card shows:  
  * Primary image (thumbnail)  
  * Product name  
  * Price (formatted: ₦10,000)  
  * Stock status badge (green "In Stock" / red "Out of Stock")  
  * Edit button  
  * Delete button  
* If vendor has 0 products:  
  * Display empty state: "You haven't added any products yet"  
  * Display "Add Product" button  
* If vendor has \>12 products:  
  * Implement pagination (12 per page) or infinite scroll

---

**FR-040: Edit Product**  
**Priority: P0**  
**Maps to: 2.3 Products Database**

GIVEN: Vendor is viewing their product list  
WHEN: Vendor clicks "Edit" button on a product  
THEN:

* System displays pre-filled product form (same as FR-036)  
* Vendor can edit any field  
* Vendor can add/remove images (maintain 1-5 limit)  
* "Save Changes" button updates products table  
* System displays success "Product updated"

---

**FR-041: Delete Product**  
**Priority: P0**  
**Maps to: 2.3 Products Database**

GIVEN: Vendor is viewing their product list  
WHEN: Vendor clicks "Delete" button on a product  
THEN:

* System displays confirmation modal:  
  * "Are you sure you want to delete \[Product Name\]? This cannot be undone."  
  * "Cancel" button (closes modal, no action)  
  * "Delete" button (red, destructive)  
* If vendor confirms:  
  * System soft-deletes product (set deleted\_at timestamp)  
  * System removes product from vendor profile display  
  * System displays success "Product deleted”  
* Product images remain in cloud storage (for admin audit trail)

---

**FR-042: Product Visibility on Public Profile**  
**Priority: P0**  
**Maps to: Component 1.7 Authentic Product Display**

GIVEN: Vendor has added products  
WHEN: Buyer views vendor's public profile  
THEN:

* System displays "Products" section showing:  
  * Grid of product cards (same layout as FR-039)  
  * Each card shows: image, name, price, stock status  
  * Click on product card opens product detail modal/page  
* Only products with stock\_status \= "In Stock" are shown  
* Products sorted by: most recently added first

---

4.  **TRANSACTION  AND ORDER TRACKING**

**FR-043: Manual Transaction Creation (Vendor)**  
**Priority: P0**  
**Maps to: 2.4 Transactions Database, 6.2 Transaction Validation Engine**

GIVEN: Vendor has sold product outside NOVA (via WhatsApp/Instagram)  
WHEN: Vendor wants to record transaction for metrics  
THEN:

* System displays "Add Transaction" form:  
  * Buyer Phone Number (optional for MVP)  
  * Product Sold (dropdown from vendor's products)  
  * Sale Amount (₦, numeric)  
  * Payment Proof (upload receipt image, optional)  
  * Delivery Status (dropdown: Pending, In Transit, Delivered)  
* Vendor clicks "Create Transaction"  
* System creates record in transactions table:  
  * vendor\_id, product\_id, amount, status \= "pending\_verification"  
  * payment\_proof\_url (if uploaded)  
* If payment proof uploaded:  
  * Admin verifies receipt (FR-201)  
* If no payment proof:  
  * Transaction marked "unverified" (doesn't count toward metrics until verified)

---

**FR-044: Transaction Status Updates**  
**Priority: P0**  
**Maps to: 2.4 Transactions Database, Component 3.1 Status Updates**

GIVEN: Vendor has active transaction  
WHEN: Vendor updates delivery status  
THEN:

* System displays status dropdown:  
  * Pending → Confirmed → Sent Out → In Transit → Delivered  
* Vendor selects new status and clicks "Update"  
* System validates status progression (can't skip steps, can't go backwards)  
* System updates transaction:  
  * status \= new\_status  
  * updated\_at \= current timestamp  
* System creates entry in order\_status\_history table (audit trail)  
* System sends notification to buyer (if phone number exists):  
  * SMS: "Your order from \[Vendor\] is now \[Status\]"  
* If status \= "Delivered":  
  * Trigger metric recalculation (FR-050)  
  * Enable buyer review prompt (FR-055)

---

**FR-045: Order Tracking Link Generation**  
**Priority: P0**  
**Maps to: 6.4 Slug Generation Engine, Component 3.2 Shared Tracking Link**

GIVEN: Transaction has been created  
WHEN: Transaction record is saved  
THEN:

* System generates unique tracking slug:  
  * Format: 8-character alphanumeric (e.g., "a3f7k9m2")  
  * Ensure uniqueness in transactions table  
* System creates public tracking URL:  
  * https://novahq.co/track/a3f7k9m2  
* System stores tracking\_slug in transactions table  
* Vendor can share this link with buyer

FR-046: Public Order Tracking Page  
Priority: P0  
Maps to: Component 3.1 Status Updates, Component 3.2 Shared Tracking Link

GIVEN: Anyone (buyer, vendor, third party) has tracking link  
WHEN: User visits tracking URL (e.g., novahq.co/track/a3f7k9m2)  
THEN:

* System fetches transaction by tracking\_slug  
* If transaction found:  
  * Display public tracking page (no login required):  
    * Vendor business name  
    * Product name (if not sensitive)  
    * Current status with progress bar:  
  * Pending (gray) → Confirmed (blue) → Sent Out (blue) → In Transit (blue) → Delivered (green)  
  * Status timeline (each status with timestamp):  
    * "Order Confirmed \- Jan 15, 2026 10:30 AM"  
    * "Sent Out \- Jan 16, 2026 2:15 PM”  
  * Estimated delivery date (if vendor provided)  
* If transaction not found:  
  * Display 404 error "Order not found"  
* No sensitive information shown (buyer details, payment amount)

---

**FR-047: Tracking Link Shareability**  
**Priority: P0**  
**Maps to: Component 3.2 Shared Tracking Link**

GIVEN: Buyer is viewing order tracking page  
WHEN: Buyer wants to share tracking link  
THEN:

* System displays "Share" button on tracking page  
* Clicking "Share" shows options:  
  * Copy Link (clipboard API)  
  * Share on WhatsApp (pre-filled message: "Track your order: \[URL\]")  
* Use case: Buyer shares with person receiving delivery  
* Tracking link is public, no authentication required

---

**FR-048: Transaction List (Vendor Dashboard)**  
**Priority: P0**  
**Maps to: 2.4 Transactions Database, 5.5 Pagination**

GIVEN: Vendor is on dashboard  
WHEN: Vendor navigates to "My Transactions" tab  
THEN:

* System displays table of all transactions:  
  * Columns: Date, Product, Buyer (if known), Amount, Status, Actions  
  * Sortable by: Date (newest first default), Amount, Status  
  * Filterable by: Status (All, Pending, Delivered, etc.)  
* Each row has actions:  
  * "Update Status" button  
  * "View Tracking Link" button  
* Pagination: 20 transactions per page  
* Display summary stats at top:  
  * Total Transactions: \[X\]  
  * Pending: \[X\]  
  * Delivered: \[X\]

---

**FR-049: Transaction Verification (Admin)**  
**Priority: P0**  
**Maps to: 6.2 Transaction Validation Engine, 9.1 Admin Dashboard**

GIVEN: Vendor uploaded payment proof for transaction  
WHEN: Admin reviews transaction in admin panel  
THEN:

* Admin sees pending transactions in queue  
* Admin views:  
  * Vendor name  
  * Product, amount  
  * Payment proof image  
* Admin clicks "Approve" or "Reject"  
* If approved:  
  * Update transaction: verification\_status \= "verified"  
  * Transaction now counts toward vendor metrics (FR-050)  
* If rejected:  
  * Update transaction: verification\_status \= "rejected"  
  * Send notification to vendor with reason  
  * Transaction doesn't count toward metrics

---

**FR-050: Automated Transaction Metrics Calculation**  
**Priority: P0**  
**Maps to: 6.1 Automated Calculation Engine, Component 1.3 Transaction Metrics**

GIVEN: Transaction status changed to "Delivered" and verification\_status \= "verified"  
WHEN: System saves transaction update  
THEN:

* System triggers background job to recalculate vendor metrics:  
  * Total Transactions \= COUNT(transactions WHERE vendor\_id \= X AND verification\_status \= "verified")  
  * Delivered Transactions \= COUNT(transactions WHERE vendor\_id \= X AND status \= "delivered" AND verification\_status \= "verified")  
  * Fulfillment Rate \= (Delivered / Total) × 100  
* System updates vendor\_profiles table:  
  * total\_transactions  
  * fulfillment\_rate  
  * last\_transaction\_date  
* Metrics update in real-time on vendor's public profile

---

5.  **REVIEW SYSTEM**

**FR-051: Review Eligibility Check**  
**Priority: P0**  
**Maps to: 6.3 Review Authenticity Checker, Component 1.4 Review System**

GIVEN: Buyer wants to leave review for vendor  
WHEN: Buyer clicks "Leave Review" button  
THEN:

* System checks if buyer has completed transaction with vendor:  
  * Query: transactions WHERE buyer\_phone \= \[X\] AND vendor\_id \= \[Y\] AND status \= "delivered"  
* If transaction exists:  
  * Check if buyer has already reviewed this transaction  
  * If not reviewed: Allow review (proceed to FR-052)  
  * If already reviewed: Display "You've already reviewed this order”  
* If no transaction exists:  
  * Display error "You must complete a purchase before reviewing this vendor"

---

**FR-052: Review Submission**  
**Priority: P0**  
**Maps to: 2.5 Reviews Database**

GIVEN: Buyer is eligible to review vendor  
WHEN: Buyer fills review form and submits  
THEN:

* System displays review form:  
  * Star Rating (required, 1-5 stars, interactive)  
  * Written Review (optional, max 500 chars, character counter)  
  * Review Categories (checkboxes \- optional):  
    * Product Quality  
    * Delivery Speed  
    * Vendor Communication  
    * Value for Money  
* Buyer clicks "Submit Review"  
* System validates:  
  * Rating between 1-5  
  * Review text ≤ 500 chars  
  * No profanity (basic keyword filter \- FR-065)  
* If validation passes:  
  * Create record in reviews table:  
    * transaction\_id (foreign key, ensures 1 review per transaction)  
    * vendor\_id, buyer\_id (or buyer\_phone if no account)  
    * rating, review\_text  
    * review\_categories (JSON array)  
    * created\_at  
    * moderation\_status \= "pending" (requires admin approval \- FR-067)  
  * Display success "Review submitted\! It will appear after moderation."  
* If validation fails:  
  * Display inline errors

---

**FR-053: Review Display on Vendor Profile**  
**Priority: P0**  
**Maps to: Component 1.4 Review System, 5.5 Pagination**

GIVEN: Vendor has approved reviews  
WHEN: Anyone views vendor's public profile  
THEN:

* System displays "Reviews" section:  
  * Overall rating (average of all ratings, e.g., 4.7 ★)  
  * Total review count (e.g., "Based on 87 reviews")  
  * Star distribution chart:  
    * 5 stars: \[progress bar\] (65)  
    * 4 stars: \[progress bar\] (15)  
    * 3 stars: \[progress bar\] (5)  
    * 2 stars: \[progress bar\] (2)  
    * 1 star: \[progress bar\] (0)  
  * Review list (newest first):  
    * Each review shows: stars, review text, buyer name (anonymized: "Blessing O."), date  
    * Categories mentioned (badges: "Great Product Quality")  
* Implement tabs:  
  * All Reviews (default)  
  * Positive (4-5 stars)  
  * Negative (1-3 stars)  
* Pagination: 10 reviews per page

---

**FR-054: Review Categorization (Positive/Negative)**  
**Priority: P0**  
**Maps to: Component 1.4 Review System**

GIVEN: Review has been submitted  
WHEN: System stores review in database  
THEN:

* System auto-categorizes based on rating:  
  * rating \>= 4: category \= "positive"  
  * rating \<= 3: category \= "negative”  
* System stores category field in reviews table  
* This enables filtering on profile (Show Positive / Show Negative tabs)

---

**FR-055: Post-Delivery Review Prompt**  
**Priority: P0**  
**Maps to: 7.1 In-App Notifications, 7.2 SMS Notifications**

GIVEN: Transaction status changed to "Delivered"  
WHEN: 24 hours have passed since delivery  
THEN:

* System sends SMS to buyer (if phone number exists):  
  * "How was your order from \[Vendor\]? Leave a review: \[URL\]"  
  * URL \= direct link to review form for this transaction  
* OR if buyer has app account:  
  * Show in-app notification: "Rate your recent order from \[Vendor\]"  
* Buyer clicks link → lands on pre-filled review form (FR-052)

---

**FR-056: Review Edit Window**  
**Priority: P1**  
**Maps to: 2.5 Reviews Database**

GIVEN: Buyer has submitted review  
WHEN: Buyer wants to edit review  
THEN:

* System checks if created\_at \< 7 days ago  
* If within 7 days:  
  * Allow edit (same form as FR-052)  
  * Update review in database  
  * Reset moderation\_status \= "pending”  
* If \> 7 days:  
  * Display error "Reviews can only be edited within 7 days"

---

**FR-057: Buyer Name Anonymization**  
**Priority: P0**  
**Maps to: 11.4 Data Privacy**

GIVEN: Review is displayed on vendor profile  
WHEN: System renders review  
THEN:

* System anonymizes buyer name:  
  * Full name "Blessing Okonkwo" → "Blessing O."  
  * Only first name \+ last initial shown  
* System NEVER displays buyer phone number publicly  
* Protects buyer privacy while maintaining review authenticity

---

**FR-058: Vendor Response to Reviews (P1)**  
**Priority: P1**  
**Maps to: 2.5 Reviews Database**

GIVEN: Vendor sees review on their profile  
WHEN: Vendor clicks "Respond" button (post-MVP feature)  
THEN:

* System displays response textarea (max 300 chars)  
* Vendor submits response  
* Response displayed below review:  
  * "Response from \[Vendor\]: \[Text\]"  
* Only 1 response per review allowed

---

**FR-059: Review Helpfulness Voting (P1)**  
**Priority: P1**  
**Maps to: 2.5 Reviews Database**

GIVEN: Buyer is viewing reviews on vendor profile  
WHEN: Buyer finds review helpful/unhelpful (post-MVP)  
THEN:

* System displays "Helpful? Yes / No" buttons  
* Clicking increments helpful\_count or unhelpful\_count  
* Reviews with high helpful\_count float to top  
* Prevents spam reviews from being buried

---

6.  **FILE UPLOAD**

**FR-060: Image File Upload (General)**  
**Priority: P0**  
**Maps to: 4.1 File Upload System, 4.2 Cloud Storage**

GIVEN: User is uploading any image (profile photo, product, ID, receipt)  
WHEN: User selects file from device  
THEN:

* System validates file client-side (before upload):  
  * File type: image/jpeg, image/png only (check MIME type)  
  * File size: ≤ 2MB (display error if exceeded)  
* If validation passes:  
  * Display upload progress bar (0-100%)  
  * Upload file to cloud storage via multipart upload  
  * Generate public or private URL depending on file type:  
    * Public: Product images, profile photos  
    * Private (signed URL): Government IDs, receipts  
* If upload succeeds:  
  * Return URL to frontend  
  * Store URL in appropriate database table  
  * Display success checkmark  
* If upload fails:  
  * Display error "Upload failed. Please try again."  
  * Allow retry (max 3 attempts)  
  * Log error to system (FR-235)

---

**FR-061: Image Compression**  
**Priority: P0**  
**Maps to: 4.3 Image Compression/Optimization**

GIVEN: User uploads image larger than optimal size  
WHEN: Image is uploaded to cloud storage  
THEN:

* System checks image dimensions  
* If width or height \> 1200px:  
  * Resize to max 1200x1200px (maintain aspect ratio)  
  * Compress to 80% JPEG quality  
* If product thumbnail:  
  * Generate 300x300px thumbnail  
  * Store both original and thumbnail URLs  
* Use Cloudinary auto-optimization or Sharp.js (server-side)

---

**FR-062: Image Format Handling**  
**Priority: P1**  
**Maps to: 4.3 Image Compression/Optimization**

GIVEN: User uploads image  
WHEN: Image is displayed on web page  
THEN:

* System serves optimized format:  
  * WebP for modern browsers (Chrome, Firefox, Edge)  
  * JPEG fallback for older browsers (Safari \< 14\)  
* Use \<picture\> tag with multiple sources:

  \`\`\`html

      \<picture\>

        \<source srcset="image.webp" type="image/webp"\>

        \<img src="image.jpg" alt="Product"\>

      \</picture\>

  \`\`\`

* Reduces bandwidth, faster page loads

---

**FR-063: Private File Access (Government IDs, Receipts)**  
**Priority: P0**  
**Maps to: 4.2 Cloud Storage, 11.2 Data Encryption**

GIVEN: Admin needs to view vendor's government ID  
WHEN: Admin clicks "View ID" in admin panel  
THEN:

* System generates signed URL (S3 presigned URL):  
  * Valid for 1 hour  
  * Requires authentication (admin only)  
* Admin can view file in browser  
* URL expires after 1 hour (cannot be shared)  
* Prevents unauthorized access to sensitive documents

---

**FR-064: File Deletion**  
**Priority: P0**  
**Maps to: 4.2 Cloud Storage**

GIVEN: User deletes product or profile  
WHEN: Delete action is confirmed  
THEN:

* System does NOT immediately delete files from cloud storage  
* System soft-deletes:  
  * Mark file URL as deleted in database  
  * Remove from public display  
* Files remain in cloud storage for 90 days (audit trail, dispute resolution)  
* After 90 days: Background job permanently deletes files

---

7.  **CONTENT MODERATION**

**FR-065: Profanity Filter (Basic)**  
**Priority: P0**  
**Maps to: 8.3 Abusive Content Detection**

GIVEN: User submits review text or product description  
WHEN: Form is submitted  
THEN:

* System checks text against profanity keyword blacklist:  
  * Common English profanity  
  * Common Nigerian Pidgin offensive terms  
* If profanity detected:  
  * Display error "Your review contains inappropriate language. Please revise."  
  * Highlight offensive words  
  * Prevent submission  
* If clean:  
  * Allow submission  
* Use library: bad-words (npm) or custom Nigerian-specific list

---

**FR-066: Manual Review Moderation Queue**  
**Priority: P0**  
**Maps to: 8.1 Review Moderation System, 9.1 Admin Dashboard**

GIVEN: Buyer submits review  
WHEN: Review is saved to database  
THEN:

* System sets moderation\_status \= "pending"  
* Review appears in admin moderation queue  
* Admin sees:  
  * Vendor name  
  * Buyer name (anonymized)  
  * Rating, review text  
  * Transaction ID (verify legitimacy)  
* Admin can:  
  * Approve → moderation\_status \= "approved" (displays on profile)  
  * Reject → moderation\_status \= "rejected" (doesn't display, notify buyer)  
  * Flag for investigation (suspected fake review)

---

**FR-067: Review Approval**  
**Priority: P0**  
**Maps to: 8.1 Review Moderation System**

GIVEN: Admin is reviewing pending review  
WHEN: Admin clicks "Approve" button  
THEN:

* System updates review:  
  * moderation\_status \= "approved"  
  * approved\_at \= current timestamp  
  * approved\_by \= admin\_id  
* Review now displays on vendor's public profile  
* Vendor receives notification: "You have a new review"  
* Metrics recalculate (average rating \- FR-050)

---

**FR-068: Review Rejection**  
**Priority: P0**  
**Maps to: 8.1 Review Moderation System**

GIVEN: Admin determines review violates guidelines  
WHEN: Admin clicks "Reject" button and provides reason  
THEN:

* System updates review:  
  * moderation\_status \= "rejected"  
  * rejection\_reason \= admin's note  
* Review does NOT display on vendor profile  
* System sends notification to buyer (SMS/email):  
  * "Your review for \[Vendor\] was not approved. Reason: \[X\]"  
* Buyer can edit and resubmit (FR-056)

---

**FR-069: User Report System (Reviews)**  
**Priority: P1**  
**Maps to: 8.1 Review Moderation System**

GIVEN: Buyer/vendor sees inappropriate review  
WHEN: User clicks "Report" button next to review  
THEN:

* System displays report form:  
  * Reason (dropdown: Fake Review, Offensive Language, Spam, Other)  
  * Additional Details (textarea, optional)  
* User submits report  
* System creates record in reports table  
* Admin sees flagged review in moderation queue  
* Admin investigates and takes action (approve, reject, ban user)

---

8. **VENDOR PROFILE PUBLIC VIEW**

**FR-070: Public Profile Page Load**  
**Priority: P0**  
**Maps to: 2.2 Vendor Profile Database, Component 1.8 Shareability**

GIVEN: Anyone (logged in or not) has vendor profile URL  
WHEN: User visits https://novahq.co/v/chimere-autos  
THEN:

* System fetches vendor by profile\_slug  
* If vendor found AND profile\_status \= "active":  
  * Render public profile page (FR-071 to FR-080)  
* If vendor not found OR profile\_status \= "inactive":  
  * Display 404 error "Vendor not found"  
* Page loads in \<3 seconds on 3G network (NFR-001)  
* No login required to view profile

---

**FR-071: Profile Header Display**  
**Priority: P0**  
**Maps to: Component 1.1 Identity Verification, Component 1.2 Location Specificity**

GIVEN: Public profile page is loading  
WHEN: Page renders header section  
THEN:

* System displays:  
  * Vendor profile photo (300x300px)  
  * Business name (large, bold)  
  * Verified badges:  
    * "Verified ID ✓" (green badge if nin\_verified \= true)  
    * "Verified Business ✓" (if business\_verified \= true)  
  * Location: City, State (e.g., "Port Harcourt, Rivers")  
  * Member since: \[Month Year\] (e.g., "Member since January 2026")  
  * Contact button: "Message on WhatsApp" (opens WhatsApp with vendor's phone)

---

**FR-072: Transaction Metrics Display**  
**Priority: P0**  
**Maps to: Component 1.3 Transaction Metrics**

GIVEN: Public profile page is loading  
WHEN: Page renders metrics section  
THEN:

* System displays in prominent card:  
  * Total Transactions: \[X\] (e.g., "150 completed transactions")  
  * Fulfillment Rate: \[X\]% (e.g., "98% fulfillment rate")  
  * Time Context: "In last 6 months"  
  * Average Rating: \[X\] ★ (e.g., "4.7 ★")  
* Metrics update in real-time (cached for 15 min \- FR-086)

---

**FR-073: Reviews Section Display**  
**Priority: P0**  
**Maps to: Component 1.4 Review System, FR-053**

GIVEN: Public profile page is loading  
WHEN: Page renders reviews section  
THEN:

* System displays reviews as specified in FR-053  
* Include segmentation tabs (All / Positive / Negative)  
* Show behavioral insights (e.g., "Fast Delivery" mentioned in 45 reviews)

---

**FR-074: Location Map Display**  
**Priority: P0**  
**Maps to: Component 1.2 Location Specificity, 3.5 Location API Layer**

GIVEN: Public profile page is loading  
WHEN: Page renders location section  
THEN:

* System displays:  
  * Full address (street, city, state)  
  * Google Maps static image (400x300px):  
    * URL: [https://maps.googleapis.com/maps/api/staticmap?center=\[lat\],\[lng\]\&zoom=15\&size=400x300\&markers=\[lat\],\[lng\]\&key=\[API\_KEY](https://maps.googleapis.com/maps/api/staticmap?center=[lat],[lng]&zoom=15&size=400x300&markers=[lat],[lng]&key=[API_KEY)\]  
  * "Open in Google Maps" button (links to full interactive map)  
*   Clicking map opens Google Maps app/web with directions

---

**FR-075: Vendor Categorization Badge**  
**Priority: P1**  
**Maps to: Component 1.5 Vendor Categorization**

GIVEN: Vendor has vendor\_type set (e.g., "Direct Dealer")  
WHEN: Public profile page loads  
THEN:

* System displays badge in header:  
  * "Direct Dealer" (blue badge)  
  * OR "Broker/Agent" (gray badge)  
* Only shown for relevant categories (Automobiles, Real Estate)

---

**FR-076: Operation Details Display**  
**Priority: P0**  
**Maps to: Component 1.6 Vendor Operation Details**

GIVEN: Public profile page is loading  
WHEN: Page renders operation details section  
THEN:

* System displays:  
  * Delivery Areas: (badges) "Lagos" "Abuja" "Nationwide"  
  * Payment Methods: (icons) Bank Transfer, POS, Cash on Delivery, Part Payment  
  * Refund Policy: \[Text\] (e.g., "7-Day Return Policy")  
* Makes it easy for buyer to assess compatibility before contacting

---

**FR-077: Product Grid Display**  
**Priority: P0**  
**Maps to: Component 1.7 Authentic Product Display, FR-042**

GIVEN: Public profile page is loading  
WHEN: Page renders products section  
THEN:

* System displays products as specified in FR-042  
* Only "In Stock" products shown  
* Grid layout responsive (4 cols desktop, 2 cols mobile)

---

**FR-078: Social Media Links Display**  
**Priority: P1**  
**Maps to: Component 1.6 (implicit), 3.6 Social Linking API**

GIVEN: Vendor has added social media links  
WHEN: Public profile page loads  
THEN:

* System displays social icons:  
  * Instagram: @chimere\_autos (clickable, opens in new tab)  
  * TikTok: @chimere\_autos  
  * Facebook: \[Page Name\]  
* Icons displayed in header or sidebar  
* If not verified (MVP), just display links  
* If verified (post-MVP), show follower count

---

**FR-079: Profile Completeness Indicator (Vendor View Only)**  
**Priority: P1**  
**Maps to: 6.5 Profile Completeness Checker**

GIVEN: Vendor is viewing their own profile  
WHEN: Vendor is logged in and viewing public profile  
THEN:

* System displays completeness banner (only visible to owner):  
  * "Your profile is 75% complete"  
  * Progress bar  
  * Suggestions: "Add 3 more products to improve visibility”  
* Not shown to public viewers

---

**FR-080: WhatsApp Contact Button**  
**Priority: P0**  
**Maps to: 3.8 WhatsApp Share Integration, Component 1.8 Shareability**

GIVEN: Buyer is viewing vendor profile  
WHEN: Buyer clicks "Message on WhatsApp" button  
THEN:

* System opens WhatsApp Web/App with pre-filled message:  
  * \`URL: wa.me/+234\[vendor\_phone\]?text=Hi, I found you on NOVA. I'm interested in \[Product Name\].  
* Message includes:  
  * Vendor's phone (from user table)  
  * Optional: Product name (if clicked from product card)  
  * Optional: Profile URL reference  
* Buyer can edit message before sending

---

9. **PROFILE SHARING & DISCOVERABILITY** 

**FR-081: Copy Profile Link**  
**Priority: P0**  
**Maps to: Component 1.8 Shareability, 3.8 Clipboard API**

GIVEN: Vendor/buyer is viewing vendor profile  
WHEN: User clicks "Copy Link" button  
THEN:

* System copies profile URL to clipboard:  
  * URL: https://novahq.co/v/chimere-autos  
* System displays toast notification: "Link copied\! ✓"  
* User can paste link in WhatsApp, Instagram DM, etc.

---

**FR-082: Share on WhatsApp Button**  
**Priority: P0**  
**Maps to: Component 1.8 Shareability, 3.8 WhatsApp Share Integration**

GIVEN: Vendor wants to share their profile  
WHEN: Vendor clicks "Share on WhatsApp" button  
THEN:

* System opens WhatsApp Web/App with pre-filled message:  
  * URL: wa.me/?text=Check out my NOVA profile: https://novahq.co/v/chimere-autos  
* Vendor can select contact/group to share with  
* Message can be edited before sending

---

**FR-083: Profile View Tracking**  
**Priority: P1**  
**Maps to: 10.1 App Usage Tracking**

GIVEN: Someone views vendor profile  
WHEN: Public profile page loads  
THEN:

* System increments profile\_views counter in vendor\_profiles table  
* System logs event to analytics:  
  * Event: "profile\_view"  
  * Properties: vendor\_id, timestamp, referrer (if available)  
* Vendor can see view count in dashboard (post-MVP \- FR-230)

---

**FR-084: Link Click Tracking**  
**Priority: P1**  
**Maps to: 10.1 App Usage Tracking**

GIVEN: Buyer clicks "Message on WhatsApp" button on profile  
WHEN: Button is clicked  
THEN:

* System logs event to analytics:  
  * Event: "whatsapp\_contact\_click"  
  * Properties: vendor\_id, timestamp  
* System increments contact\_clicks counter  
* Vendor can see contact rate in analytics (post-MVP)

---

**FR-085: Social Sharing Meta Tags (Open Graph)**  
**Priority: P1**  
**Maps to: Component 1.8 Shareability**

GIVEN: Vendor profile URL is shared on social media  
WHEN: Platform (WhatsApp, Facebook, Twitter) fetches URL metadata  
THEN:

* System serves Open Graph meta tags:  
  * \`\`\`html  
        \<meta property="og:title" content="\[Business Name\] on NOVA"\>  
        \<meta property="og:description" content="\[Business Description\]"\>  
        \<meta property="og:image" content="\[Profile Photo URL\]"\>  
        \<meta property="og:url" content="https://novahq.co/v/chimere-autos"\>  
    \`\`\`  
* Creates rich preview card when link is shared  
* Increases click-through rate

---

10. **DIRECTORY & SEARCH**

**FR-086: Directory Homepage**  
**Priority: P0**  
**Maps to: Component 2.1 Search & Filter, 5.1 Search Technology**

GIVEN: User navigates to NOVA directory (novahq.co/directory)  
WHEN: Page loads  
THEN:

* System displays:  
  * Search bar (placeholder: "Search vendors or products...")  
  * Filter sidebar:  
    * Category dropdown (Fashion, Electronics, etc.)  
    * Location dropdown (Lagos, Abuja, Port Harcourt, etc.)  
    * Sort by dropdown (Transaction Volume, Fulfillment Rate, Newest)  
  * Vendor grid (default: all active vendors, sorted by transaction volume)  
* Default view: 20 vendors per page  
* No login required to browse directory

---

**FR-087: Vendor Search (Text Query)**  
**Priority: P0**  
**Maps to: 5.1 Search Technology, 2.8 Database Indexing**

GIVEN: User is on directory page  
WHEN: User types in search bar and presses Enter  
THEN:

* System performs full-text search on:  
  * Vendor business\_name (weighted 3x)  
  * Product name (weighted 2x)  
  * Product description (weighted 1x)  
* System returns matching vendors ranked by relevance  
* If using PostgreSQL:  
* \`\`\`sql

      SELECT \* FROM vendor\_profiles

      WHERE to\_tsvector('english', business\_name || ' ' || products) 

      @@ to\_tsquery('user\_query')

      ORDER BY ts\_rank(...) DESC

  \`\`\`

* Display results in grid (same layout as FR-086)  
* If 0 results:  
  * Display "No vendors found. Try different keywords."

---

**FR-088: Category Filter**  
**Priority: P0**  
**Maps to: 5.3 Category Filtering**

GIVEN: User is on directory page  
WHEN: User selects category from dropdown (e.g., "Fashion → Footwear → Sneakers")  
THEN:

* System filters vendors to only those with matching product categories  
* System updates vendor grid with filtered results  
* System displays active filter tag: "Sneakers ✕" (click to remove)  
* URL updates with query param: ?category=sneakers (shareable link)

**FR-089: Location Filter**  
**Priority: P0**  
**Maps to: 5.2 Location Filtering Engine**

GIVEN: User is on directory page  
WHEN: User selects location from dropdown (e.g., "Lagos")  
THEN:

* System filters vendors to only those with:  
  * city \= "Lagos" OR state \= "Lagos" OR "Nationwide" in delivery\_areas  
* System updates vendor grid with filtered results  
* System displays active filter tag: "Lagos ✕"  
* URL updates: ?location=lagos

---

**FR-090: Sort by Transaction Volume**  
**Priority: P0**  
**Maps to: 5.4 Sorting Algorithms, Component 2.2 Trust-First Display**

GIVEN: User is viewing directory results  
WHEN: User selects "Sort by: Transaction Volume" from dropdown  
THEN:

* System re-sorts vendors:  
  * ORDER BY total\_transactions DESC  
* Vendors with most transactions appear first  
* This is the default sort (prioritizes proven vendors)

---

**FR-091: Sort by Fulfillment Rate**  
**Priority: P0**  
**Maps to: 5.4 Sorting Algorithms, Component 2.2 Trust-First Display**

GIVEN: User is viewing directory results  
WHEN: User selects "Sort by: Fulfillment Rate"  
THEN:

* System re-sorts vendors:  
* ORDER BY fulfillment\_rate DESC  
* Vendors with highest fulfillment rate (e.g., 99%) appear first  
* Tie-breaker: transaction volume (higher first)

---

**FR-092: Sort by Newest**  
**Priority: P0**  
**Maps to: 5.4 Sorting Algorithms**

GIVEN: User is viewing directory results  
WHEN: User selects "Sort by: Newest"  
THEN:

* System re-sorts vendors:  
  * ORDER BY created\_at DESC  
* Newly registered vendors appear first  
* Helps new vendors get initial visibility

---

**FR-093: Vendor Card Display (Directory)**  
**Priority: P0**  
**Maps to: Component 2.2 Trust-First Display**

GIVEN: Directory is displaying vendor results  
WHEN: Vendor card is rendered  
THEN:

* Each card shows:  
  * Profile photo (circular, 80x80px)  
  * Business name (truncated if \>30 chars)  
  * Category badges (e.g., "Footwear")  
  * Location (city, state)  
  * Trust metrics (prominent):  
    * Total Transactions: \[X\]  
    * Fulfillment Rate: \[X\]%  
    * Average Rating: \[X\] ★  
  * "Verified ID ✓" badge (if verified)  
* Clicking card opens vendor's public profile (FR-070)  
* Hover effect: slight elevation, border highlight

---

**FR-094: Pagination (Directory)**  
**Priority: P0**  
**Maps to: 5.5 Pagination/Infinite Scroll**

GIVEN: Directory has \>20 vendor results  
WHEN: User scrolls to bottom of page (mobile) OR clicks "Next" button (desktop)  
THEN:

* System loads next 20 vendors  
* Mobile: Infinite scroll (auto-load on scroll)  
* Desktop: Pagination buttons (1, 2, 3... Next)  
* URL updates with page param: ?page=2 (shareable, bookmarkable)

---

**FR-095: Empty State (No Results)**  
**Priority: P0**  
**Maps to: Component 2.1 Search & Filter**

GIVEN: User's search/filter returns 0 results  
WHEN: Query completes  
THEN:

* System displays empty state:  
  * Message: "No vendors found matching your criteria"  
  * Suggestions:  
    * "Try different keywords"  
    * "Remove some filters”  
    * "Browse all vendors" button (clears filters)  
* Does NOT leave user stuck with blank page

---

**FR-096: Geolocation "Near Me" Filter (P1)**  
**Priority: P1**  
**Maps to: 5.2 Location Filtering Engine**

GIVEN: User is on directory page (mobile)  
WHEN: User clicks "Near Me" button  
THEN:

* System requests browser geolocation permission  
* If granted:  
  * Get user's lat/lng  
  * Calculate distance to each vendor using Haversine formula:  
    \`\`\`sql  
          SELECT \*, (6371 \* acos(cos(radians(user\_lat)) \* cos(radians(vendor\_lat))   
          \* cos(radians(vendor\_lng) \- radians(user\_lng)) \+ sin(radians(user\_lat))   
          \* sin(radians(vendor\_lat)))) AS distance  
          ORDER BY distance ASC  
    \`\`\`  
  * Filter vendors within 50km radius  
  * Sort by distance (closest first)  
* If denied:  
  * Display "Please enable location access to use this feature"

---

**FR-097: Vendor Comparison View (P1)**  
**Priority: P1**  
**Maps to: Component 2.3 Vendor Comparison View**

GIVEN: User is viewing directory  
WHEN: User selects 2-3 vendors to compare (checkbox on cards)  
THEN:

* System displays comparison table:  
  * Rows: Transaction Volume, Fulfillment Rate, Avg Rating, Location, Delivery Areas, Payment Methods  
  * Columns: Vendor A, Vendor B, Vendor C  
* Highlights best value in each row (e.g., highest fulfillment rate in green)  
* "View Profile" button for each vendor  
* Helps buyer make informed decision

---

11. **CACHING & PERFROMANCE**

**FR-098: Redis Caching for Vendor Profiles**  
**Priority: P0**  
**Maps to: 5.6 Caching Layer**

GIVEN: Vendor profile is frequently accessed  
WHEN: Public profile page is requested  
THEN:

* System checks Redis cache:  
  * Key: \`profile:\[vendor\_slug\]\`  
  * TTL: 15 minutes  
* If cache hit:  
  * Return cached profile data (HTML or JSON)  
  * Response time: \<500ms  
* If cache miss:  
  * Fetch from database  
  * Store in Redis with 15-minute TTL  
  * Return to user  
* Cache invalidation:  
  * Vendor updates profile → clear cache for that vendor

---

**FR-099: Redis Caching for Directory Listings**  
**Priority: P0**  
**Maps to: 5.6 Caching Layer**

GIVEN: Directory query is common (e.g., "Lagos \+ Footwear")  
WHEN: User searches directory  
THEN:

* System generates cache key from query params:  
  * Key: \`directory:category=footwear:location=lagos:sort=volume:page=1\`  
  * TTL: 10 minutes (shorter than profile, data changes more frequently)  
*   
* If cache hit:  
  * Return cached vendor list  
* If cache miss:  
  * Query database  
  * Cache results  
* Cache invalidation:  
  * New vendor added → clear all directory caches (or specific category/location)  
  * Vendor metrics updated → clear specific vendor's cache

---

**FR-100: Client-Side Caching (Tanstack Query)**  
**Priority: P0**  
**Maps to: 5.6 Caching Layer**

GIVEN: User is browsing directory on web app  
WHEN: User navigates between pages (directory → profile → back to directory)  
THEN:

* Tanstack Query caches API responses client-side:  
  * Cache key: query params \+ endpoint  
  * Stale time: 5 minutes (data considered fresh)  
  * Cache time: 30 minutes (data kept in memory)  
* User navigates back to directory → loads from cache (instant)  
* After 5 minutes → background refetch (keep UI responsive)  
* Improves perceived performance, reduces server load

---

 

12. **ADMIN PANEL & OPERATIONS**

**FR-101: Admin Dashboard Overview**  
**Priority: P0**  
**Maps to: 9.1 Admin Dashboard**

GIVEN: Admin is logged in  
WHEN: Admin navigates to admin panel (novahq.co/admin)  
THEN:

* System verifies role \= "admin" (FR-019)  
* System displays dashboard with cards:  
  * Total Vendors: \[X\] (active)  
  * Total Buyers: \[X\] (if buyer accounts implemented)  
  * Total Transactions: \[X\]  
  * Pending Verifications: \[X\] (NIN, business docs)  
  * Pending Reviews: \[X\] (moderation queue)  
  * Flagged Content: \[X\] (reports)  
* Each card clickable → navigates to detail view

---

**FR-102: NIN Verification Queue (Admin)**  
**Priority: P0**  
**Maps to: 9.2 Manual Verification Workflow, FR-027**

GIVEN: Admin is on "Pending NIN Verifications" page  
WHEN: Page loads  
THEN:

* System displays table of vendors with nin\_verified \= "pending\_verification"  
* Each row shows:  
  * Vendor name  
  * Phone number  
  * NIN entered  
  * Government ID photo (thumbnail, click to enlarge)  
  * Submission date  
  * Actions: "Approve" / "Reject”  
* Sorted by: oldest first (FIFO)

---

**FR-103: NIN Manual Approval (Admin)**  
**Priority: P0**  
**Maps to: 9.2 Manual Verification Workflow**

GIVEN: Admin is reviewing NIN verification  
WHEN: Admin clicks "Approve" button  
THEN:

* System updates vendor profile:  
  * nin\_verified \= true  
  * verified\_by \= admin\_id  
  * verified\_at \= current timestamp  
* System removes vendor from pending queue  
* System sends SMS to vendor:  
  * "Your NOVA profile has been verified\! Start sharing: \[Profile URL\]"  
* Vendor can now fully use platform

---

**FR-104: NIN Manual Rejection (Admin)**  
**Priority: P0**  
**Maps to: 9.2 Manual Verification Workflow**

GIVEN: Admin determines NIN verification should be rejected  
WHEN: Admin clicks "Reject" button and provides reason  
THEN:

* System displays rejection reason form (textarea)  
* Admin enters reason (e.g., "Government ID photo is blurry. Please re-upload.")  
* System updates vendor profile:  
  * nin\_verified \= false  
  * rejection\_reason \= admin's note  
* System sends SMS to vendor:  
  * "Your NIN verification was not approved. Reason: \[X\]. Please update and resubmit."  
* Vendor can edit NIN info and resubmit (FR-024)

---

**FR-105: Business Document Verification Queue (Admin)**  
**Priority: P1**  
**Maps to: 9.2 Manual Verification Workflow, 3.4 Business Verification Layer**

GIVEN: Vendor uploaded CAC/SMEDAN certificate  
WHEN: Admin navigates to "Business Verification" queue  
THEN:

* System displays vendors with uploaded business docs  
* Each row shows:  
  * Vendor name  
  * Business name (claimed)  
  * Document type (CAC / SMEDAN)  
  * Document file (PDF viewer)  
  * Actions: "Approve" / "Reject”  
* Admin manually verifies:  
  * Document appears authentic  
  * Business name matches vendor's claimed name  
  * Registration number valid (can cross-check with CAC API if available)

---

**FR-106: Business Document Approval (Admin)**  
**Priority: P1**  
**Maps to: 9.2 Manual Verification Workflow**

GIVEN: Admin approves business document  
WHEN: Admin clicks "Approve"  
THEN:

* System updates vendor profile:  
  * business\_verified \= true  
  * Adds "Verified Business ✓" badge to public profile  
* System sends notification to vendor  
* Increases vendor trust score (appears higher in directory)

---

**FR-107: Review Moderation Queue (Admin)**  
**Priority: P0**  
**Maps to: FR-066**

GIVEN: Admin is on "Review Moderation" page  
WHEN: Page loads  
THEN:

* System displays pending reviews (moderation\_status \= "pending")  
* Each row shows review details (as in FR-066)  
* Admin can approve/reject (FR-067, FR-068)

---

**FR-108: Flagged Content Queue (Admin)**  
**Priority: P1**  
**Maps to: FR-069**

GIVEN: User reported review/vendor/product  
WHEN: Admin navigates to "Flagged Content" page  
THEN:

* System displays reported items:  
  * Report type (review, vendor profile, product)  
  * Reason (fake, offensive, spam)  
  * Reporter details (anonymized)  
  * Reported content (full view)  
* Admin investigates and takes action:  
  * Dismiss report (no action)  
  * Remove content  
  * Ban user (if severe violation)

---

**FR-109: User Suspension (Admin)**  
**Priority: P1**  
**Maps to: 9.3 User Management**

GIVEN: Admin determines user violated terms  
WHEN: Admin clicks "Suspend User" in admin panel  
THEN:

* System displays suspension form:  
  * Duration (7 days, 30 days, permanent)  
  * Reason (required, will be shown to user)  
* System updates user account:  
  * account\_status \= "suspended"  
    * suspended\_until \= \[date\] (or NULL if permanent)  
* User cannot log in during suspension:  
  * Login attempt shows: "Your account has been suspended. Reason: \[X\]. Contact support."  
* If vendor: Profile hidden from directory during suspension

---

**FR-110: Transaction Manual Approval (Admin)**  
**Priority: P0**  
**Maps to: FR-049**

GIVEN: Vendor uploaded payment receipt for transaction  
WHEN: Admin reviews in "Transaction Verification" queue  
THEN:

* Admin sees transaction details \+ receipt image  
* Admin approves/rejects (as in FR-049)

---

**FR-111: Admin Activity Log**  
**Priority: P1**  
**Maps to: 2.7 Admin Activity Logs**

GIVEN: Admin performs any action (approve, reject, suspend, etc.)  
WHEN: Action is completed  
THEN:

* System logs to admin\_activity\_logs table:  
  * admin\_id  
  * action\_type (e.g., "nin\_verification\_approved")  
  * target\_id (vendor\_id, review\_id, etc.)  
  * timestamp  
  * notes (if provided)  
* Provides audit trail for compliance  
* Can be reviewed by senior admins

---

13.  **ANALYTICS AND TRACKING**

**FR-112: Google Analytics Integration**  
**Priority: P1**  
**Maps to: 10.1 App Usage Tracking**

GIVEN: User performs any action on platform  
WHEN: Action occurs (page view, button click, form submit)  
THEN:

* System sends event to Google Analytics:

  \`\`\`javascript

      gtag('event', 'event\_name', {

        'event\_category': 'category',

        'event\_label': 'label',

        'value': value

      });

  \`\`\`

* Track events:  
  * page\_view (all pages)  
  * vendor\_signup\_start  
  * vendor\_signup\_complete  
  * profile\_view  
  * directory\_search  
  * whatsapp\_contact\_click  
  * review\_submit  
* Enables conversion funnel analysis

**FR-113: Conversion Funnel Tracking**  
**Priority: P1**  
**Maps to: 10.1 App Usage Tracking**

GIVEN: User starts vendor signup  
WHEN: User progresses through signup steps  
THEN:

* System tracks funnel stages:  
  * Signup Start (phone entry)  
  * OTP Verified  
  * Business Info Completed  
  * NIN Verified  
  * Profile Created  
* Track drop-off rate at each step  
* Helps identify friction points

---

**FR-114: Vendor Analytics Dashboard (P1)**  
**Priority: P1**  
**Maps to: 10.2 Vendor Analytics**

GIVEN: Vendor is logged in  
WHEN: Vendor navigates to "Analytics" tab in dashboard  
THEN:

* System displays vendor's performance metrics:  
  * Profile views (last 7 days, last 30 days)  
  * WhatsApp contact clicks (conversion rate: clicks/views)  
  * Review trend (chart: new reviews over time)  
  * Top products (most viewed)  
* Helps vendor optimize profile

---

**FR-115: Error Tracking (Sentry)**  
**Priority: P0**  
**Maps to: 10.3 System Performance Monitoring, 12.3 System Error Logging**

GIVEN: Application encounters JavaScript error or API failure  
WHEN: Error occurs  
THEN:

* System sends error report to Sentry:  
  * Error message, stack trace  
  * User context (user\_id, role \- no PII)  
  * Browser/device info  
  * URL, timestamp  
* Alerts dev team if error rate spikes  
* Enables quick bug fixes

---

**FR-115: API Performance Monitoring**  
**Priority: P1**  
**Maps to: 10.3 System Performance Monitoring**

GIVEN: API endpoint is called  
WHEN: Request is processed  
THEN:

* System logs performance metrics:  
  * Endpoint path  
  * Response time (ms)  
  * Status code  
  * User\_id (if authenticated)  
* Track slow queries (\>2 seconds)  
* Set up alerts if average response time \> 3 seconds  
* Tools: New Relic, DataDog, or custom logging

---

14.  **NOTIFICATION**

**FR-116: OTP SMS Notification**  
**Priority: P0**  
**Maps to: 7.2 SMS Notifications, FR-005**

GIVEN: User requests OTP (signup, login, password reset)  
WHEN: OTP is generated  
THEN:

* System sends SMS via gateway (Termii, Africa's Talking):  
  * To: User's phone number  
  * Message: "Your NOVA verification code is \[123456\]. Valid for 5 minutes."  
* If SMS succeeds: Log success  
* If SMS fails: Retry once, then display error to user (FR-005)

---

**FR-117: Order Status Update SMS**  
**Priority: P0**  
**Maps to: 7.2 SMS Notifications, FR-044**

GIVEN: Vendor updates order status to "In Transit" or "Delivered"  
WHEN: Status is saved  
THEN:

* System sends SMS to buyer (if phone number exists):  
  * "Your order from \[Vendor\] is now \[Status\]. Track: \[Tracking URL\]"  
* Only send for significant status changes (not every update)  
* Buyer can opt-out (P1 feature)

---

**FR-118: New Review Notification (Vendor)**  
**Priority: P1**  
**Maps to: 7.2 SMS Notifications, 7.3 Email Notifications**

GIVEN: Buyer leaves review for vendor AND review is approved  
WHEN: Review moderation\_status changes to "approved"  
THEN:

* System sends notification to vendor:  
  * SMS: "You have a new review\! View: \[Profile URL\]"  
  * OR Email (if vendor has email)  
* Encourages vendor to engage with customers

---

**FR-119: Profile Verification Notification**  
**Priority: P0**  
**Maps to: 7.2 SMS Notifications, FR-202, FR-203**

GIVEN: Admin approves or rejects vendor's NIN verification  
WHEN: Verification decision is made  
THEN:

* System sends SMS to vendor (as specified in FR-202, FR-203)  
* Critical notification (affects vendor's ability to use platform)

---

**FR-120: In-App Notification Bell (P1)**  
**Priority: P1**  
**Maps to: 7.1 In-App Notifications**

GIVEN: Vendor is logged in  
WHEN: New notification occurs (review, verification, etc.)  
THEN:

* System displays notification bell icon in header:  
  * Red badge with unread count (e.g., "3")  
* Clicking bell opens dropdown:  
  * List of notifications (newest first)  
  * Mark as read  
  * Link to relevant page (review, profile, etc.)  
* Real-time update via WebSocket or polling (every 30 seconds)

---

15. **SECURITY & ERROR HANDLING**

**FR-121: HTTPS/SSL Enforcement**  
**Priority: P0**  
**Maps to: 11.2 Data Encryption**

GIVEN: User attempts to access site via HTTP  
WHEN: Request reaches server  
THEN:

* System redirects to HTTPS:  
  * http://novahq.co → https://novahq.co (301 redirect)  
* All API requests require HTTPS  
* SSL certificate: Let's Encrypt (free, auto-renew)

---

**FR-122: Rate Limiting (API)**  
**Priority: P0**  
**Maps to: 11.3 Rate Limiting & Anti-Abuse**

GIVEN: User/IP is making API requests  
WHEN: Requests exceed limit  
THEN:

* System implements rate limits:  
  * General API: 100 requests/minute per IP  
  * Login: 5 attempts per 15 minutes per phone number  
  * OTP send: 3 requests per hour per phone number  
  * Signup: 3 accounts per day per IP  
* If limit exceeded:  
  * Return 429 status code  
  * Response: { "error": "Too many requests. Try again in \[X\] minutes." }  
* Use Redis to track request counts (counters with TTL)

---

**FR-123: CORS Policy**  
**Priority: P0**  
**Maps to: 11.2 Data Encryption**

GIVEN: External site attempts to call NOVA API  
WHEN: Cross-origin request is made  
THEN:

* System enforces CORS policy:  
  * Allow: novahq.co, www.novahq.co  
  * Block: All other origins  
* Prevents unauthorized API access from malicious sites

---

**FR-124: Input Sanitization**  
**Priority: P0**  
**Maps to: 11.3 Rate Limiting & Anti-Abuse**

GIVEN: User submits form data (text input)  
WHEN: Data is received by server  
THEN:

* System sanitizes input:  
  * Remove HTML tags (prevent XSS)  
  * Escape special characters (\<, \>, &, etc.)  
  * Trim whitespace  
* Use library: DOMPurify (client-side) \+ validator.js (server-side)  
* Store sanitized data in database

---

**FR-125: SQL Injection Prevention**  
**Priority: P0**  
**Maps to: 11.2 Data Encryption**

GIVEN: Application builds database queries  
WHEN: User input is used in query  
THEN:

* System uses parameterized queries (prepared statements):

  \`\`\`javascript

      // SAFE

      db.query('SELECT \* FROM users WHERE phone \= ?', \[userPhone\]);

      

      // UNSAFE \- NEVER DO THIS

      db.query(\`SELECT \* FROM users WHERE phone \= '${userPhone}'\`);

  \`\`\`

* Use ORM (Sequelize, TypeORM) which handles this automatically

---

**FR-126: Error Logging**  
**Priority: P0**  
**Maps to: 12.3 System Error Logging**

GIVEN: Application encounters error  
WHEN: Error occurs (API failure, database error, etc.)  
THEN:

* System logs error details:  
  * Timestamp  
  * Error message, stack trace  
  * User context (user\_id, phone \- no password/NIN)  
  * Request details (endpoint, payload \- sanitized)  
* Log to:  
  * File system (logs/error.log, rotated daily)  
  * Sentry (for real-time monitoring)  
* Never expose internal errors to user:  
  * User sees: "Something went wrong. Please try again."  
  * Logs show: Full error details

---

**FR-127: Graceful API Error Handling**  
**Priority: P0**  
**Maps to: 12.1 API Error Handling**

GIVEN: External API call fails (NIN verification, SMS gateway, etc.)  
WHEN: API returns error or times out  
THEN:

* System implements retry logic:  
  * Retry 3 times with exponential backoff (1s, 2s, 4s)  
* If all retries fail:  
  * Fall back to manual process (admin review)  
  * Display user-friendly message: "Verification is taking longer than usual. We'll notify you when complete.”  
* Log error details (FR-235)  
* Don't block user progress (allow them to continue with "pending" status)

---

**FR-128: User-Facing Error Messages**  
**Priority: P0**  
**Maps to: 12.2 User-Facing Error Messages**

GIVEN: User encounters error (validation, system error, etc.)  
WHEN: Error is displayed  
THEN:

* System shows clear, actionable messages:  
  * Validation: "Phone number must be 10-11 digits"  
  * Network: "Connection lost. Please check your internet and try again."  
  * Server: "Something went wrong. Please try again in a moment.”  
* Never show technical jargon:  
  * BAD: "500 Internal Server Error"  
  * GOOD: "We're having trouble. Please try again.”  
* Include action button where possible:  
  * "Try Again" (retries action)  
  * "Contact Support" (opens WhatsApp with support)

 

16. 

[image1]: <data:image/png;base64,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>