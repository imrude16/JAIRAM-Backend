import userService from "../../modules/users/users.service.js";
import responseHandler from "../../common/utils/responseHandler.js";

const { createUser: _createUser, getUserById: _getUserById } = userService;
const { sendSuccess } = responseHandler;

const createUser = async (req, res) => {
    const user = await _createUser(req.body);

    sendSuccess(
        res,
        "User created successfully",
        user,
        null,
        201
    );
};

const getUserById = async (req, res) => {
    const user = await _getUserById(req.user.id);

    sendSuccess(
        res,
        "User fetched successfully",
        user,
        null,
        200
    );
};

export default {
    createUser,
    getUserById,
};
