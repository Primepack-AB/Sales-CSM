import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";
import { Jwt } from "../../common/types/jwt";
import usersService from "../../users/services/users.service";
import authServices from "../services/auth.service";

class JwtMiddleware {
    public async extractUserIdFromToken(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        try {
            const user = await usersService.getUserByEmail(
                res.locals.jwt.email
            );

            if (!user || !user._id) {
                throw new Error();
            }

            req.body.userId = user._id;
        } catch (error) {
            return res.status(404).send({
                errors: [`Failed to get active User ID`, error],
            });
        }
        return next();
    }

    public verifyRefreshBodyField(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.body && req.body.refreshToken) {
            return next();
        }
        return res
            .status(400)
            .send({ errors: ["Missing required field: refreshToken"] });
    }

    public async validRefreshNeeded(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const user = await usersService.getUserByEmailWithHash(
            res.locals.jwt.email
        );
        if (!user) {
            throw new Error();
        }
        const salt = crypto.createSecretKey(
            Buffer.from(res.locals.jwt.refreshKey.data)
        );
        const hash = crypto
            .createHmac("sha512", salt)
            .update(res.locals.jwt.userId + await authServices.getJWTSecret())
            .digest("base64");
        if (hash === req.body.refreshToken) {
            req.body = {
                userId: user._id,
                email: user.email,
                provider: "email",
                permissionLevel: user.permissionLevel,
            };
            return next();
        }
        return res.status(400).send({ errors: ["Invalid refresh token"] });
    }

    public async validJWTNeeded(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.headers.authorization) {
            try {
                const authorization = req.headers.authorization.split(" ");
                if (authorization[0] !== "Bearer") {
                    return res.status(401).send();
                } else {
                    res.locals.jwt = jwt.verify(
                        authorization[1],
                        await authServices.getJWTSecret(),
                    ) as Jwt;
                    return next();
                }
            } catch (err) {
                return res.status(401).send({
                    errors: ["Failed to authenticated JWT token.", err],
                });
            }
        }
        return res
            .status(401)
            .send({ errors: "Request is missing JWT Token." });
    }
}

export default new JwtMiddleware();
