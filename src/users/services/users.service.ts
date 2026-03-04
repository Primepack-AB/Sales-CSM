import { PermissionLevel } from "../../common/middleware/common.permissionlevel.enum";
import UsersDao from "../daos/users.dao";
import { CreateUserDto } from "../dto/create.user.dto";
import { PatchUserDto } from "../dto/patch.user.dto";
import { PutUserDto } from "../dto/put.user.dto";

class UsersService {
    public async create(resource: CreateUserDto) {
        resource.permissionLevel = PermissionLevel.USER_PERMISSION;
        return UsersDao.addUser(resource);
    }

    public async deleteById(id: string) {
        return UsersDao.removeUserById(id);
    }

    public async list(limit = 100, page = 0) {
        return UsersDao.getUsers(limit, page);
    }

    public async patchById(id: string, resource: PatchUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource);
    }

    public async putById(id: string, resource: PutUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource);
    }

    public async readById(id: string) {
        return UsersDao.getUserById(id);
    }

    public async updateById(id: string, resource: CreateUserDto): Promise<any> {
        return UsersDao.updateUserById(id, resource);
    }

    public async getUserByEmail(email: string) {
        return UsersDao.getUserByEmail(email);
    }
    public async getUserByEmailWithHash(email: string) {
        return UsersDao.getUserByEmailWithHash(email);
    }
}

export default new UsersService();
