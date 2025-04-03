// middlewares/verifyAdmin.js
import admin from 'firebase-admin';

export async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    if (!decoded.admin) {
      return res
        .status(403)
        .json({ message: 'Acesso restrito a administradores' });
    }

    req.user = {
      uid: decoded.uid,
      admin: true,
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar token do admin:', error);
    return res.status(403).json({ message: 'Token inválido' });
  }
}
