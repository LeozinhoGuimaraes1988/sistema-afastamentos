import admin from 'firebase-admin';

// Listar usuários
export async function listarUsuarios(req, res) {
  try {
    const list = [];
    let nextPageToken;

    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach((userRecord) => {
        list.push({
          uid: userRecord.uid,
          email: userRecord.email,
          claims: userRecord.customClaims || {},
        });
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    res.status(200).json(list);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
}

// Atualizar claims de um usuário
export async function definirClaims(req, res) {
  const { uid, autorizado, clienteId } = req.body;

  if (!uid || typeof autorizado === 'undefined' || !clienteId) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
  }

  try {
    await admin.auth().setCustomUserClaims(uid, {
      autorizado,
      clienteId,
    });
    res.status(200).json({ message: 'Claims atualizadas com sucesso' });
  } catch (err) {
    console.error('Erro ao definir claims:', err);
    res.status(500).json({ message: 'Erro ao definir claims' });
  }
}
