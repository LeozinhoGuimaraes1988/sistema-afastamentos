// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ServidorModal from '../components/ServidorModal';
import styles from './Layout.module.css';
import { useAuth } from '../contexts/AuthContext';
import { adicionarServidor } from '../services/servidoresServices';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [newServidor, setNewServidor] = useState({
    nome: '',
    matricula: '',
    cargo: '',
    lotacao: '',
  });
  const [ferias, setFerias] = useState([{ dataInicio: null, dataFim: null }]);

  const { currentUser } = useAuth();

  const handleServidorInputChange = (e) => {
    const { name, value } = e.target;
    setNewServidor((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (index, date, field) => {
    const novosPeriodos = [...ferias];
    novosPeriodos[index][field] = date;
    setFerias(novosPeriodos);
  };

  const handleAddPeriodo = () => {
    setFerias((prev) => [...prev, { dataInicio: null, dataFim: null }]);
  };

  const removePeriodo = (index) => {
    const novos = [...ferias];
    novos.splice(index, 1);
    setFerias(novos);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const servidorParaSalvar = {
        ...newServidor,
        periodos: ferias,
      };
      console.log('currentUser:', currentUser);
      await adicionarServidor(servidorParaSalvar, 'servidor_unidade_1');

      toast.success('Servidor salvo com sucesso!');
      setModalOpen(false);
      // Limpa o formulário
      setNewServidor({ nome: '', matricula: '', cargo: '', lotacao: '' });
      setFerias([{ dataInicio: null, dataFim: null }]);
    } catch (error) {
      console.error('Erro ao salvar servidor:', error);
      toast.error('Erro ao salvar servidor');
    }
  };

  return (
    <div className={styles.layout}>
      <Navbar onOpenModal={() => setModalOpen(true)} />
      <Sidebar />
      <main className={styles.content}>{children}</main>

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
    </div>
  );
};

export default Layout;
