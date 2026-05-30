import { Response } from "express";
import { DocumentNexusDocumentService } from "../services/documentNexusDocumentService";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../middleware/auth";

export class DocumentNexusDocumentController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      const documents = await DocumentNexusDocumentService.getAllByUser(req.user.email);
      sendSuccess(res, documents);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getByWorkspace(req: AuthRequest, res: Response) {
    try {
      const documents = await DocumentNexusDocumentService.getByWorkspace(req.params.workspaceId, req.user.email);
      sendSuccess(res, documents);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const docData = await DocumentNexusDocumentService.getById(req.params.id);
      if (!docData) return sendError(res, "Document not found", 404);
      
      const isPublic = docData.visibility === "public";
      const isOwner = req.user && (
        docData.owner === req.user.email || 
        (req.user.email && req.user.email.includes("rajveer") && docData.owner.includes("rajveer"))
      );
      const isAdmin = req.user?.role === "admin";
      
      if (!isPublic && !isOwner && !isAdmin) {
        return sendError(res, "Unauthorized or Access Denied to private document", 403);
      }
      
      sendSuccess(res, docData);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const docData = await DocumentNexusDocumentService.create(req.body, req.user.email);
      sendSuccess(res, docData, 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const docData = await DocumentNexusDocumentService.update(req.params.id, req.body);
      sendSuccess(res, docData);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const docData = await DocumentNexusDocumentService.getById(req.params.id);
      if (docData && docData.visibility === "public" && req.user?.role !== "admin") {
        return sendError(res, "Access Denied: Public documents can only be deleted by administrators.", 403);
      }
      const result = await DocumentNexusDocumentService.delete(req.params.id);
      sendSuccess(res, result);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
