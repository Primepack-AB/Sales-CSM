import { PermissionLevel } from "../../common/middleware/common.permissionlevel.enum";

export interface UserFields {
    email: string;
    hash?: string;
    salt?: string;
    firstName?: string;
    lastName?: string;
    permissionLevel: PermissionLevel;
}
