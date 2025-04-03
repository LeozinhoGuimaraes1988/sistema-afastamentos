// adminRoutes.js
import express from 'express';
import { verifyAdmin } from '../middlewares/verifyAdmin.js';
import {
  listarUsuarios,
  definirClaims,
} from '../controllers/adminController.js';

const router = express.Router();

// ✅ Agora protegido por verificação de admin
router.get('/usuarios', verifyAdmin, listarUsuarios);
router.post('/set-claim', verifyAdmin, definirClaims);

export default router;
