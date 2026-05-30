import { Request, Response } from 'express';
import { DocumentNexusWorkspaceService } from '../services/documentNexusWorkspaceService';

export const getAllWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.email;
    const workspaces = await DocumentNexusWorkspaceService.getAllByUser(userId);
    res.json(workspaces);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const workspace = await DocumentNexusWorkspaceService.getById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.email;
    const workspace = await DocumentNexusWorkspaceService.create(req.body, userId);
    res.status(201).json(workspace);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const workspace = await DocumentNexusWorkspaceService.update(req.params.id, req.body);
    res.json(workspace);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    await DocumentNexusWorkspaceService.delete(req.params.id);
    res.json({ message: 'Workspace deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
