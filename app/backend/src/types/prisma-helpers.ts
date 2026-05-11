// import { Prisma } from "generated/prisma/client.js";
// // Helper types for including relations
// export type UserWithRelations = Prisma.UserGetPayload<{
//   include: {
//     vendor_profile: true;
//     buyer_profile: true;
//   };
// }>;

// export type VendorWithProducts = Prisma.VendorProfileGetPayload<{
//   include: {
//     products: {
//       include: {
//         images: true;
//       };
//     };
//   };
// }>;

// export type VendorWithMetrics = Prisma.VendorProfileGetPayload<{
//   select: {
//     id: true;
//     business_name: true;
//     slug: true;
//     city: true;
//     state: true;
//     nin_verified: true;
//     total_transactions: true;
//     fulfillment_rate: true;
//     average_rating: true;
//     profile_photo_url: true;
//   };
// }>;

// export type TransactionWithRelations = Prisma.TransactionGetPayload<{
//   include: {
//     vendor: true;
//     buyer: true;
//     product: true;
//     status_history: true;
//   };
// }>;

// export type ReviewWithRelations = Prisma.ReviewGetPayload<{
//   include: {
//     transaction: true;
//     vendor: true;
//     buyer: true;
//   };
// }>;