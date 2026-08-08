import React, { useEffect, useState } from 'react';
import { getAuth, getIdToken, getIdTokenResult } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../services/apiAuth.js';
import { logAlteracao } from '../../services/logService';

import { auth } from '../../firebase/config.js';

import styles from './Admin.module.css';
import EditUserModal from '../../components/EditUserModal.jsx';

const AdminUserPanel = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verificarAdmin = async () => {
      const user = auth.currentUser;
      if (!user) return;

      await user.getIdToken(true);
      const tokenResult = await getIdTokenResult(user);
      const claims = tokenResult.claims;

      if (!claims.admin) {
        alert('Acesso restrito ao administrador.');
        window.location.href = '/';
      }
    };

    verificarAdmin();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetchWithAuth('/admin/usuarios');

      // ⚠️ Se a resposta não for 2xx, captura o erro antes de tentar res.json()
      if (!res.ok) {
        const text = await res.text(); // pode ser JSON ou HTML
        console.error('❌ Erro da API:', text);
        throw new Error(`Erro ${res.status}: ${text}`);
      }

      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      alert('Falha ao carregar usuários. Veja o console para detalhes.');
    }
  };

  const salvarEdicao = async (form) => {
    try {
      const res = await fetchWithAuth('/admin/set-claim', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert('Claims atualizadas com sucesso!');
        setUsuarioSelecionado(null);
        fetchUsuarios();
      } else {
        alert('Erro ao aplicar claims');
      }
    } catch (err) {
      console.error('Erro ao salvar edição:', err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleVoltar = () => {
    navigate('/'); // ⬅️ Redireciona para a Home
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Administração de Usuários</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>UID</th>
            <th>Autorizado</th>
            <th>clienteId</th>
            <th>admin</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.uid}>
              <td>{u.email}</td>
              <td>{u.uid}</td>
              <td className={styles.statusIcon}>
                {u.claims?.autorizado ? '✅' : '❌'}
              </td>
              <td>{u.claims?.clienteId || '-'}</td>
              <td>{u.claims?.admin ? '🛡️' : '-'}</td>
              <td className={styles.actions}>
                <button
                  className={styles.editButton}
                  onClick={() => setUsuarioSelecionado(u)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={handleVoltar}
        className={styles.voltarButton}
      >
        Voltar
      </button>

      {usuarioSelecionado && (
        <EditUserModal
          user={usuarioSelecionado}
          onClose={() => setUsuarioSelecionado(null)}
          onSave={salvarEdicao}
        />
      )}
    </div>
  );
};

export default AdminUserPanel;
