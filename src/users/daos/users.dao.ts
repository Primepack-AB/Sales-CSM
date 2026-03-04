import debug from "debug";
import { nanoid } from "nanoid";
import { PermissionLevel } from "../../common/middleware/common.permissionlevel.enum";
import mongooseService from "../../common/services/mongoose.service";
import { CreateUserDto } from "../dto/create.user.dto";
import { PatchUserDto } from "../dto/patch.user.dto";
import { PutUserDto } from "../dto/put.user.dto";
import { UserFields } from "../interfaces/user.fields.interface";

const log: debug.IDebugger = debug("app:users-dao");

class UsersDao {
    public Schema = mongooseService.getMongoose().Schema;

    public userSchema = new this.Schema(
        {
            _id: String,
            email: String,
            hash: { type: String, select: false },
            salt: { type: String, select: false },
            firstName: String,
            lastName: String,
            permissionLevel: Number,
        },
        { id: false }
    );

    public User = mongooseService
        .getMongoose()
        .model<UserFields>("Users", this.userSchema);

    constructor() {
        log("Created new instance of UsersDao");
    }

    public async addUser(userFields: CreateUserDto) {
        const userId = nanoid();
        const user = new this.User({
            _id: userId,
            ...userFields,
            permissionLevel: PermissionLevel.USER_PERMISSION,
        });
        await user.save();
        return userId;
    }

    public async getUserByEmail(email: string) {
        return this.User.findOne({ email }).exec();
    }

    public async getUserByEmailWithHash(email: string) {
        return this.User.findOne({ email })
            .select("_id email permissionLevel +salt +hash")
            .exec();
    }

    public async removeUserById(userId: string) {
        return this.User.deleteOne({ _id: userId }).exec();
    }

    public async getUserById(userId: string) {
        return this.User.findOne({ _id: userId }).populate("User").exec();
    }

    public async getUsers(limit = 25, page = 0) {
        return this.User.find()
            .limit(limit)
            .skip(limit * page)
            .exec();
    }

    public async updateUserById(
        userId: string,
        userFields: PatchUserDto | PutUserDto
    ) {
        const existingUser = await this.User.findOneAndUpdate(
            { _id: userId },
            { $set: userFields },
            { new: true }
        ).exec();

        return existingUser;
    }
}

export default new UsersDao();
