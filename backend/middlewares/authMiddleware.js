import admin from 'firebase-admin';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    if (!decoded.clienteId) {
      return res
        .status(403)
        .json({ message: 'Acesso negado: clienteId ausente' });
    }

    req.user = {
      uid: decoded.uid,
      clienteId: decoded.clienteId,
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(403).json({ message: 'Token inválido' });
  }
}
