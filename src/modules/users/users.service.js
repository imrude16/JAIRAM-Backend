import AppError from "../../common/errors/AppError.js";
import User from "./users.model.js";
import { hash } from "bcrypt";

const createUser = async (payload) => {
    const existingUser = await User.findOne({ email: payload.email });

    if (existingUser) {
        throw new AppError(
            "User already exists",
            409,
            "USER_ALREADY_EXISTS"
        );
    }

    const hashedPassword = await hash(payload.password, 10);

    const user = await User.create({
        ...payload,
        password: hashedPassword,
    });

    console.log({ user })

    return user;
};

const getUserById = async (id) => {
    const user = await User.findById(id).select("-password");

    if (!user) {
        throw new AppError(
            "User not found",
            404,
            "USER_NOT_FOUND"
        );
    }

    return user;
};

export default {
    createUser,
    getUserById,
};
