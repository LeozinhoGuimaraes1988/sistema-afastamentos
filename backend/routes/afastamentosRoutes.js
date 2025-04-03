import express from 'express';
import { getAllAfastamentos } from '../controllers/afastamentosController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAllAfastamentos);

export default router;
