import React, { useEffect, useState } from 'react';
import styles from './Servidores.module.css';
import useServidores from '../../hooks/useServidores';
import {
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getAuth } from 'firebase/auth';
import { logAlteracao } from '../../services/logService';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import ServidorModal from '../../components/ServidorModal';

export default function Servidores() {
  const { servidores, fetchServidores } = useServidores();
  const { currentUser } = useAuth();
  const [filtro, setFiltro] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [newServidor, setNewServidor] = useState({
    nome: '',
    cargo: '',
    lotacao: '',
    matricula: '',
  });
  const [ferias, setFerias] = useState([{ dataInicio: '', dataFim: '' }]);

  useEffect(() => {
    fetchServidores();
  }, []);

  const iniciarEdicao = (servidor) => {
    setEditandoId(servidor.id);
    setDadosEditados({
      nome: servidor.nome,
      matricula: servidor.matricula,
      cargo: servidor.cargo,
      lotacao: servidor.lotacao,
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const salvarAlteracoes = async (id) => {
    try {
      const servidorRef = doc(db, 'servidores', id);
      const snapshot = await getDoc(servidorRef);
      const dadosOriginais = snapshot.data();

      await updateDoc(servidorRef, dadosEditados);

      const camposAlterados = Object.keys(dadosEditados).filter(
        (key) => dadosEditados[key] !== dadosOriginais[key]
      );

      const detalhes = camposAlterados
        .map(
          (campo) =>
            `${campo} alterado de "${dadosOriginais[campo] || ''}" para "${
              dadosEditados[campo] || ''
            }"`
        )
        .join(' | ');

      if (detalhes) {
        const auth = getAuth();
        const user = auth.currentUser;
        await user?.getIdToken(true);
        await logAlteracao('dados', 'atualizou', detalhes, user);
      }

      toast.success('Alterações salvas!');
      setEditandoId(null);
      fetchServidores();
    } catch (error) {
      toast.error('Erro ao salvar alterações: ' + error.message);
    }
  };

  const excluirServidor = async (id, nome) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o servidor "${nome}"?`
    );
    if (!confirmacao) return;

    try {
      await logAlteracao('dados', 'excluiu', `Servidor: ${nome}`, currentUser);
      await deleteDoc(doc(db, 'servidores', id));
      toast.success('Servidor excluído com sucesso!');
      fetchServidores();
    } catch (error) {
      toast.error('Erro ao excluir servidor: ' + error.message);
    }
  };

  const handleServidorInputChange = (e) => {
    const { name, value } = e.target;
    setNewServidor({ ...newServidor, [name]: value });
  };

  const handleDateChange = (index, date, field) => {
    const novasFerias = [...ferias];
    novasFerias[index][field] = date;
    setFerias(novasFerias);
  };

  const handleAddPeriodo = () => {
    if (ferias.length < 3) {
      setFerias([...ferias, { dataInicio: '', dataFim: '' }]);
    }
  };

  const removePeriodo = (index) => {
    const novasFerias = ferias.filter((_, i) => i !== index);
    setFerias(novasFerias);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = getAuth().currentUser;
      const token = await user.getIdTokenResult(true); // força refresh do token
      const servidorId = token.claims.servidorId;

      if (!servidorId) {
        toast.error('ID do servidor não encontrado.');
        return;
      }

      const docRef = await addDoc(collection(db, 'servidores'), {
        ...newServidor,
        servidorId,
        createdAt: serverTimestamp(),
        periodos: ferias.filter((p) => p.dataInicio && p.dataFim),
      });

      await logAlteracao(
        'dados',
        'cadastrou',
        `Novo servidor: ${newServidor.nome}`,
        user
      );
      toast.success('Servidor cadastrado com sucesso!');
      setModalOpen(false);
      fetchServidores();
      setNewServidor({ nome: '', cargo: '', lotacao: '', matricula: '' });
      setFerias([{ dataInicio: '', dataFim: '' }]);
    } catch (error) {
      toast.error('Erro ao cadastrar servidor: ' + error.message);
    }
  };

  const servidoresFiltrados = servidores
    .filter(
      (s) =>
        s.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        s.matricula.includes(filtro)
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>Servidores</h1>

      <div className={styles.topo}>
        <input
          type="text"
          placeholder="Buscar por nome ou matrícula"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button
          className={styles.botaoCadastrar}
          onClick={() => setModalOpen(true)}
        >
          + Cadastrar Servidor
        </button>
      </div>

      <div className={styles.resumo}>
        <span>
          Total de servidores encontrados:{' '}
          <strong>{servidoresFiltrados.length}</strong>
        </span>
      </div>

      <ServidorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        newServidor={newServidor}
        handleServidorInputChange={handleServidorInputChange}
        ferias={ferias}
        handleDateChange={handleDateChange}
        handleAddPeriodo={handleAddPeriodo}
        removePeriodo={removePeriodo}
        handleEditSubmit={handleEditSubmit}
      />

      <table className={styles.tabela}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Matrícula</th>
            <th>Cargo</th>
            <th>Lotação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {servidoresFiltrados.map((servidor) => (
            <tr key={servidor.id}>
              {editandoId === servidor.id ? (
                <>
                  <td>
                    <input
                      value={dadosEditados.nome}
                      onChange={(e) =>
                        setDadosEditados({
                          ...dadosEditados,
                          nome: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={dadosEditados.matricula}
                      onChange={(e) =>
                        setDadosEditados({
                          ...dadosEditados,
                          matricula: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={dadosEditados.cargo}
                      onChange={(e) =>
                        setDadosEditados({
                          ...dadosEditados,
                          cargo: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={dadosEditados.lotacao}
                      onChange={(e) =>
                        setDadosEditados({
                          ...dadosEditados,
                          lotacao: e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className={styles.actionsInline}>
                    <button
                      className={styles.salvar}
                      onClick={() => salvarAlteracoes(servidor.id)}
                    >
                      Salvar
                    </button>
                    <button
                      className={styles.excluir}
                      onClick={() =>
                        excluirServidor(servidor.id, servidor.nome)
                      }
                    >
                      Excluir
                    </button>
                    <button
                      className={styles.cancelar}
                      onClick={cancelarEdicao}
                    >
                      Cancelar
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{servidor.nome}</td>
                  <td>{servidor.matricula}</td>
                  <td>{servidor.cargo}</td>
                  <td>{servidor.lotacao}</td>
                  <td className={styles.actionsInline}>
                    <button
                      className={styles.editar}
                      onClick={() => iniciarEdicao(servidor)}
                    >
                      Editar
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
