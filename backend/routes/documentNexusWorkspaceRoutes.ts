import express from 'express';
import { 
  getAllWorkspaces, 
  getWorkspaceById, 
  createWorkspace, 
  updateWorkspace, 
  deleteWorkspace 
} from '../controllers/documentNexusWorkspaceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getAllWorkspaces);
router.get('/:id', authenticate, getWorkspaceById);
router.post('/', authenticate, createWorkspace);
router.put('/:id', authenticate, updateWorkspace);
router.delete('/:id', authenticate, deleteWorkspace);

export default router;
