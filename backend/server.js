import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import afastamentosRoutes from './routes/afastamentosRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initializeFirebase } from './services/firebaseService.js';
import clientesRoutes from './routes/clientesRoutes.js';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Inicializa Firebase Admin
initializeFirebase();

// Rotas
app.use('/api/afastamentos', afastamentosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clientes', clientesRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
