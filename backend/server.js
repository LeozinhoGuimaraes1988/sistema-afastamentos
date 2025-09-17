// backend/server.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

import afastamentosRoutes from './routes/afastamentosRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';
import { initializeFirebase } from './services/firebaseService.js';

dotenv.config();

const app = express();

// 🟢 Início do backend
console.log('\n🔄 Inicializando backend...');

// ✅ Inicializa Firebase Admin
initializeFirebase();

const SUPER_ADMIN_EMAIL = 'leosinho.jw@gmail.com'; // 🔒 substitua pelo seu e-mail

async function garantirSuperAdmin() {
  try {
    const user = await admin.auth().getUserByEmail(SUPER_ADMIN_EMAIL);

    // Se ainda não tiver claim admin, aplica
    if (!user.customClaims?.admin) {
      await admin.auth().setCustomUserClaims(user.uid, {
        ...(user.customClaims || {}),
        admin: true,
      });
      console.log(`✅ Super admin garantido para ${SUPER_ADMIN_EMAIL}`);
    } else {
      console.log(`🛡️ Super admin já configurado: ${SUPER_ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error('❌ Erro ao garantir super admin:', err);
  }
}

// Executa no startup
garantirSuperAdmin();

// 🌐 Configura CORS (antes do Helmet)
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://gestaoafastamentos.web.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.options('*', cors());

// 🔐 Proteções básicas
app.use(helmet());

// 🧠 Middleware de JSON
app.use(express.json());

// 🧪 Rota de verificação de status (health check)
app.get('/status', (req, res) => {
  console.log('🔍 Rota /status acessada!');
  res.status(200).json({ status: 'ok', message: 'API funcionando! 🚀' });
});

// 🛣️ Rotas da aplicação
app.use('/api/afastamentos', afastamentosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clientes', clientesRoutes);

// 🚀 Inicializa servidor
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`✅ Backend iniciado com sucesso em http://localhost:${PORT}\n`);
});

export default app;
