import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { UserFields } from "../../users/interfaces/user.fields.interface";
import usersService from "../../users/services/users.service";

class AuthMiddleware {
    public async validateBodyRequest(req: Request, res: Response, next: NextFunction) {
        if (req.body && req.body.email && req.body.password) {
            next();
        } else {
            res.status(400).send({
                errors: ["Missing required fields: email and password"],
            });
        }
    }

    public async verifyUserPassword(
        req: Request<
            object,
            object,
            { email: string; password: string; user?: UserFields }
        >,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { email, password } = req.body;
            const user = await usersService.getUserByEmailWithHash(email);
            if (user) {
                if (!user.salt || !user.hash) {
                    throw new Error(
                        `User is missing salt or hash in Database.`
                    );
                }
                const passwordHash = crypto
                    .pbkdf2Sync(password, user.salt, 1000, 64, `sha512`)
                    .toString(`hex`);

                if (user.hash === passwordHash) {
                    req.body.user = user;
                    return next();
                } else {
                    res.status(400).send({
                        errors: ["Invalid email and/or password"],
                    });
                }
            } else {
                res.status(400).send({
                    errors: ["Could not find user with that email"],
                });
            }
        } catch (error) {
            const { message } = error as Error;
            res.status(400).send({
                errors: [`Failed to get user from database with email: '${req.body.email}'`, message],
            });
        }
    }
}

export default new AuthMiddleware();
