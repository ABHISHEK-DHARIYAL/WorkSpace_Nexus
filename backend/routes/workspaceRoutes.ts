const express = require("express");
const { getAllWorkspaces, getWorkspaceById, createWorkspace, updateWorkspace, deleteWorkspace } = require("../controllers/workspaceController");
const { authenticate } = require("../middleware/auth");


const router = express.Router();

router.get('/', authenticate, getAllWorkspaces);
router.get('/:id', authenticate, getWorkspaceById);
router.post('/', authenticate, createWorkspace);
router.put('/:id', authenticate, updateWorkspace);
router.delete('/:id', authenticate, deleteWorkspace);

module.exports = router;
