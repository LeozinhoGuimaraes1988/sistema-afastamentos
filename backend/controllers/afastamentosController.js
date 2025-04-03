import { db } from '../services/firebaseService.js';

export async function getAllAfastamentos(req, res) {
  try {
    const snapshot = await db
      .collection('clientes')
      .doc(req.user.clienteId)
      .collection('afastamentos')
      .get();

    const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(dados);
  } catch (error) {
    console.error('Erro ao buscar afastamentos:', error);
    res.status(500).json({ message: 'Erro ao buscar afastamentos' });
  }
}
