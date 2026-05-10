import winston, { createLogger, transports, format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "@config/env.js";

const { combine, printf, json, timestamp, prettyPrint, splat, errors } = format;



const logger = createLogger({
  level: "info",
  format: combine(
    timestamp(),
    errors({ stack: true }),
    splat(),
    json(),
    prettyPrint()
  ),
  transports: [
    ...(env.NODE_ENV === "production"
      ? [
          //Log Transport for production environment
        ]
      : []),
    new transports.Console(),
  ],
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
