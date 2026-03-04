import debug from "debug";
import express from "express";
import { PermissionLevel } from "./common.permissionlevel.enum";

const log: debug.IDebugger = debug("app:common-permission-middleware");

class CommonPermissionMiddleware {
    public minimumPermissionLevelRequired(requiredPermissionLevel: PermissionLevel) {
        return (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
            try {
                const userPermissionLevel = parseInt(
                    res.locals.jwt.permissionLevel
                );
                if (userPermissionLevel & requiredPermissionLevel) {
                    next();
                } else {
                    return res
                        .status(403)
                        .send({
                            errors: `User is not permitted to do this action.`,
                        });
                }
            } catch (error) {
                log(error);
                const { message } = error as Error;
                return res
                    .status(500)
                    .send({ errors: [`Failed to verify JWT Token`, message] });
            }
            return next(); // NOTE: Unreachable
        };
    }

    public async onlySameUserOrAdminCanDoThisAction(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const userPermissionLevel = parseInt(res.locals.jwt.permissionLevel);
        if (
            req.params &&
            req.params.userId &&
            req.params.userId === res.locals.jwt.userId
        ) {
            return next();
        } else {
            if (userPermissionLevel & PermissionLevel.ADMIN_PERMISSION) {
                return next();
            } else {
                return res.status(403).send();
            }
        }
    }

    public async onlyAdminCanDoThisAction(
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const userPermissionLevel = parseInt(res.locals.jwt.permissionLevel);
        if (userPermissionLevel & PermissionLevel.ADMIN_PERMISSION) {
            return next();
        }
        return res.status(403).send();
    }
}

export default new CommonPermissionMiddleware();
