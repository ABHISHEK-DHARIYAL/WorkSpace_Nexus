import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { email, password, isSocial } = req.body;
      if (!email || !password) return sendError(res, "Email and password required", 400);
      
      const result = await AuthService.signup({ email, password, isSocial });
      sendSuccess(res, result, 201);
    } catch (error: any) {
      sendError(res, error.message, error.message === "User already exists" ? 409 : 400);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return sendError(res, "Email and password required", 400);

      const result = await AuthService.login({ email, password });
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message, 401);
    }
  }

  static async updatePassword(req: AuthRequest, res: Response) {
    try {
      const { password } = req.body;
      const email = req.user.email;
      if (!password || password.length < 6) {
        return sendError(res, "Password must be at least 6 characters long", 400);
      }
      
      const result = await AuthService.updatePassword(email, password, req.user.role);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async deleteAccount(req: AuthRequest, res: Response) {
    try {
      const email = req.user.email;
      const result = await AuthService.deleteAccount(email);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
