
const { db } = require("../config/db");

type Request = import("express").Request;
type Response = import("express").Response;
type NextFunction = import("express").NextFunction;
const { sendError } = require("../utils/response");

const checkDb = (req: Request, res: Response, next: NextFunction) => {
  if (!db) {
    console.error("DB not initialized yet");
    return sendError(res, "Database starting up... please retry in a moment.", 503);
  }
  next();
};


module.exports = {
  checkDb
};
