import express from "express";
import { CommonRoutesConfig } from "../common/common.routes.config";
import authController from "./controllers/auth.controller";
import authMiddleware from "./middleware/auth.middleware";
import jwtMiddleware from "./middleware/jwt.middleware";

export class AuthRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, "AuthRoutes");
  }

  public configureRoutes(): express.Application {
    this.app.post(`/auth`, [
      authMiddleware.validateBodyRequest,
      authMiddleware.verifyUserPassword,
      authController.createJWT,
    ]);
    this.app.post(`/auth/refresh-token`, [
      jwtMiddleware.validJWTNeeded,
      jwtMiddleware.verifyRefreshBodyField,
      jwtMiddleware.validRefreshNeeded,
      authController.createJWT,
    ]);
    return this.app;
  }
}
