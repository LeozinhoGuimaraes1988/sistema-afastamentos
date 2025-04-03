import admin from 'firebase-admin';

export const listarClientes = async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('clientes').get();
    const clientes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(clientes);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
};

export const criarCliente = async (req, res) => {
  const { nome } = req.body;
  try {
    const novoCliente = await admin
      .firestore()
      .collection('clientes')
      .add({ nome });
    res.status(201).json({ id: novoCliente.id, nome });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};
