import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

export const generateToken = (payload: { email: string; role: string }, expiresIn: string = "1d"): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, ENV.JWT_SECRET);
};
