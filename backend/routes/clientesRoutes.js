import express from 'express';
import {
  listarClientes,
  criarCliente,
} from '../controllers/clientesController.js';

const router = express.Router();

router.get('/', listarClientes);
router.post('/', criarCliente);

export default router;
