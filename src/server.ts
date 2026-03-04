import "dotenv/config";

import * as bodyParser from "body-parser";
import type { CorsOptions } from "cors";
import cors from "cors";
import debug from "debug";
import express from "express";
import * as expressWinston from "express-winston";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import * as winston from "winston";
import { AuthRoutes } from "./auth/auth.routes.config";
import type { CommonRoutesConfig } from "./common/common.routes.config";

const app: express.Application = express();
let server: http.Server | https.Server;

let key: string | undefined;
let cert: string | undefined;

try {
  key = fs.readFileSync(`${process.env.SSL_CERT_PATH}/privkey.pem`, "utf-8");
  cert = fs.readFileSync(`${process.env.SSL_CERT_PATH}/fullchain.pem`, "utf-8");
} catch {
  // Assume we are outside of production environment
  // and therefore won't need SSI certificate for https
  //
  // TODO: Use process.env.NODE_ENV == 'production'/'development'
  // for more explicit control and error handling
} finally {
  if (key && cert) {
    server = https.createServer({ key, cert }, app);
  } else {
    server = http.createServer(app);
  }
}

const port = process.env.PORT ?? 8443;

const routes: CommonRoutesConfig[] = [];
const debugLog: debug.IDebugger = debug("server");

// here we are adding middleware to parse all incoming requests as JSON using body-parser
const jsonParser = bodyParser.json();
app.use(bodyParser.json());

// here we are adding middleware to allow cross-origin requests
const exposedHeaders = [
  "Origin",
  "Accept",
  "Content-Type",
  "Content-Range",
  "Content-Length",
  "X-Content-Range",
  "X-Content-Length",

  "X-Total-Count",
  "X-Requested-With",

  "Authorization",
];
const corsOptions: CorsOptions = {
  exposedHeaders: [
    ...exposedHeaders,
    ...exposedHeaders.map((header) => header.toLowerCase()),
  ],
};

app.use(cors(corsOptions));

// CORS: https://stackoverflow.com/a/42463858
app.use((request, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With",
  );

  // allow preflight
  if (request.method === "OPTIONS") {
    res.send(200);
  } else {
    next();
  }
});

const logDir = "./logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const loggerOptions: expressWinston.LoggerOptions = {
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: `${logDir}/winston-error.log`,
      level: "error",
    }),
  ],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true }),
  ),
};

if (!process.env.DEBUG) {
  loggerOptions.meta = false; // when not debugging, make terse

  // if (typeof global.it === 'function') {
  // NOTE: Note sure what this determines exactly
  if (
    typeof (global as typeof globalThis & { it: () => unknown }).it ===
    "function"
  ) {
    loggerOptions.level = "http"; // for non-debug test runs, squelch entirely
  }
}

app.use(expressWinston.logger(loggerOptions));

routes.push(new AuthRoutes(app));

const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

// This route will handle all the requests that are
// not handled by any other route handler.
app.use((request, res, next) => {
  if (!request.route) {
    // If no route is matched, redirect to '/'
    return res.redirect("/");
  }
  next();
});

app.listen(8080);

export default server.listen(port, () => {
  debugLog(`Server running at https://localhost:${port}`);
  routes.forEach((route: CommonRoutesConfig) => {
    debugLog(`Routes configured for ${route.getName()}`);
  });
});
