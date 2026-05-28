
const { WorkspaceService } = require("../services/workspaceService");

type Request = import("express").Request;
type Response = import("express").Response;

const getAllWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.email;
    const workspaces = await WorkspaceService.getAllByUser(userId);
    res.json(workspaces);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const workspace = await WorkspaceService.getById(req.params.id);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
    res.json(workspace);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const createWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.email;
    const workspace = await WorkspaceService.create(req.body, userId);
    res.status(201).json(workspace);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const workspace = await WorkspaceService.update(req.params.id, req.body);
    res.json(workspace);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    await WorkspaceService.delete(req.params.id);
    res.json({ message: 'Workspace deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  getAllWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace
};
