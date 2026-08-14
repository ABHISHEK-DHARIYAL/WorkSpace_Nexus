import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { workspaceService } from '../di/container';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Pure HTTP boundary: extract request data, call the service, shape the
 * response. No Firestore calls, no business rules, no try/catch — errors
 * thrown by the service propagate to the centralized error middleware via
 * asyncHandler. This is the "receive request -> call service -> return
 * response" shape the Controller layer should have.
 */

export const getAllWorkspaces = asyncHandler(async (req: AuthRequest, res: Response) => {
  const owner = req.user!.email;
  const workspaces = await workspaceService.getAllByUser(owner);
  res.json(workspaces);
});

export const getWorkspaceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspace = await workspaceService.getById(req.params.id);
  res.json(workspace);
});

export const createWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const owner = req.user!.email;
  const workspace = await workspaceService.create(req.body, owner);
  res.status(201).json(workspace);
});

export const updateWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspace = await workspaceService.update(req.params.id, req.body);
  res.json(workspace);
});

export const deleteWorkspace = asyncHandler(async (req: AuthRequest, res: Response) => {
  await workspaceService.delete(req.params.id);
  res.json({ message: 'Workspace deleted' });
});
