import crypto from "crypto";
import debug from "debug";
import express from "express";
import jwt from "jsonwebtoken";
import authService from "../services/auth.service";

const log: debug.IDebugger = debug("app:auth-controller");

const tokenExpirationInSeconds = 36000;

class AuthController {
    public async createJWT(req: express.Request, res: express.Response) {
        try {
            const jwtSecret = await authService.getJWTSecret();
            const refreshId = req.body.userId + jwtSecret;
            const salt = crypto.createSecretKey(crypto.randomBytes(16));
            const hash = crypto
                .createHmac("sha512", salt)
                .update(refreshId)
                .digest("base64");
            req.body.refreshKey = salt.export();
            const token = jwt.sign(req.body, jwtSecret, {
                expiresIn: tokenExpirationInSeconds,
            });
            return res
                .status(201)
                .send({ accessToken: token, refreshToken: hash, expiresIn: tokenExpirationInSeconds });
        } catch (error) {
            log("createJWT error: %O", error);
            const { message } = error as Error;
            return res
                .status(500)
                .send({ errors: [`Failed to create JWT Token`, message] });
        }
    }
}

export default new AuthController();
