// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import afastamentosRoutes from './routes/afastamentosRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';
import { initializeFirebase } from './services/firebaseService.js';

dotenv.config();

const app = express();

// ✅ CORS - deve vir ANTES do helmet
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://gestaoafastamentos.web.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ✅ Responde a preflight OPTIONS
app.options('*', cors());

// 🔐 Helmet - depois do CORS
app.use(helmet());

// 🧠 JSON parser
app.use(express.json());

// 🔥 Firebase Admin
initializeFirebase();

// 🛣️ Rotas principais
app.use('/api/afastamentos', afastamentosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clientes', clientesRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;
