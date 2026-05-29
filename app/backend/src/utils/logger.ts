// import winston, { createLogger, transports, format } from "winston";
// import DailyRotateFile from "winston-daily-rotate-file";

import { createLogger, transports, format } from 'winston';
import { env } from '@config/env.js';

const { combine, json, timestamp, prettyPrint, splat, errors } = format;

/** Winston logger for general application-level events. */
const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],
});

/** Winston logger scoped to email sending operations. */
const emailLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'emailService', timeStamp: new Date().toISOString() },
});

/** Winston logger scoped to authentication flows (signup, OTP, magic link). */
const authLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'authService', timeStamp: new Date().toISOString() },
});

/** Winston logger scoped to user profile operations. */
const userLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'userService', timeStamp: new Date().toISOString() },
});

/** Winston logger scoped to file upload and Cloudinary operations. */
const fileUplaodLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'fileUplaod', store: 'cloduinary', timeStamp: new Date().toISOString() },
});


/** Winston logger scoped to vendor profile and onboarding operations. */
const vendorLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'vendorService', timeStamp: new Date().toISOString() },
});


/** Winston logger scoped to admin panel and tier calculation operations. */
const adminLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'adminService', timeStamp: new Date().toISOString() },
});

/** Winston logger scoped to business category CRUD operations. */
const categoryLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'categoryService', timeStamp: new Date().toISOString() },
});

/** Winston logger scoped to transaction CRUD and fulfillment operations. */
const transactionLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production' ? [] : []),
    new transports.Console(),
  ],
  defaultMeta: { service: 'transactionService', timeStamp: new Date().toISOString() },
});

/** Winston logger scoped to product CRUD operations. */
const productLogger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), splat(), json(), prettyPrint()),
  transports: [
    ...(env.NODE_ENV === 'production'
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],

  defaultMeta: { service: 'productService', timeStamp: new Date().toISOString() },
});
// const authLogger = createLogger({
//   level: "info",
//   format: combine(
//     timestamp(),
//     errors({ stack: true }),
//     splat(),
//     json(),
//     prettyPrint()
//   ),

//   transports: [
//     ...(process.env.NODE_ENV === "production"
//       ? [
//           new LogtailTransport(logtail),
//           new DailyRotateFile({
//             filename: "logs/authInfo-%DATE%.log",
//             datePattern: "YYYY-MM-DD",
//             level: "info",
//             zippedArchive: true,
//             maxSize: "20m",
//             maxFiles: "14d",
//           }),
//           new DailyRotateFile({
//             filename: "logs/authError-%DATE%.log",
//             datePattern: "YYYY-MM-DD",
//             level: "error",
//             zippedArchive: true,
//             maxSize: "20m",
//             maxFiles: "30d",
//           }),
//         ]
//       : []),
//     new transports.Console(),
//   ],

//   defaultMeta: { service: "authService" },
// });

export default logger;
export { emailLogger, authLogger, userLogger, fileUplaodLogger, vendorLogger, adminLogger, categoryLogger, productLogger, transactionLogger };
