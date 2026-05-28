
const { UserService } = require("../services/userService");

type Request = import("express").Request;
type Response = import("express").Response;
const { sendSuccess, sendError } = require("../utils/response");

class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAll();
      sendSuccess(res, users);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}


module.exports = {
  UserController
};
