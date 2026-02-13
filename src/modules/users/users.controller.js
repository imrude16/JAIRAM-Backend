import { createUser as _createUser, getUserById as _getUserById } from "./users.service";
import { sendSuccess } from "../../common/utils/responseHandler";

const createUser = async (req, res) => {
    const user = await _createUser(req.body);

    sendSuccess(res, {
        statusCode: 201,
        message: "User created successfully",
        data: user,
    });
};

const getUserById = async (req, res) => {
    const user = await _getUserById(req.user.id);

    sendSuccess(res, {
        statusCode: 200,
        message: "User fetched successfully",
        data: user,
    });
};

export default {
    createUser,
    getUserById,
};
