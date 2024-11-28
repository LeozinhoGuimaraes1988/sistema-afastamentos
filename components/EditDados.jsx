import Modal from 'react-modal';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

import styles from './EditDados.module.css';

const EditDados = ({ servidorSelecionado, isOpen, handleClose }) => {
  const [dados, setDados] = useState({
    nome: '',
    matricula: '',
    cargo: '',
    lotacao: '',
  });

  useEffect(() => {
    if (servidorSelecionado) {
      // Carrega os dados do servidor selecionado ao abrir o modal
      const fetchData = async () => {
        const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
        const servidorSnapshot = await getDoc(servidorRef);
        if (servidorSnapshot.exists()) {
          setDados(servidorSnapshot.data());
        }
      };
      fetchData();
    }
  }, [servidorSelecionado]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setDados({ ...dados, [name]: value });
  };

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // Atualiza os dados no banco de dados
    const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
    await updateDoc(servidorRef, dados);
    if (servidorRef) {
      alert('Dados atualizados com sucesso!');
    } else {
      alert('Erro ao atualizar dados');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1000); // Reseta o feedback após 2 segundos
  };

  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.75)',
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxWidth: '90%',
      zIndex: 1050,
    },
    overlay: {
      zIndex: 1040,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Mantém o fundo fumê
    },
  };

  Modal.setAppElement('#root');
  return (
    <div>
      <Modal isOpen={isOpen} onRequestClose={handleClose} style={customStyles}>
        <h1>Editar dados do servidor</h1>
        <form className={styles.periodForm}>
          <div className={styles.inputField}>
            <label>Nome</label>
            <input
              type="text"
              name="nome"
              value={dados.nome}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.inputField}>
            <label>Cargo</label>
            <input
              type="text"
              name="cargo"
              value={dados.cargo}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.inputField}>
            <label>Lotação</label>
            <input
              type="text"
              name="lotacao"
              value={dados.lotacao}
              onChange={handleInputChange}
            />
          </div>
          <div className={styles.inputField}>
            <label>Matrícula</label>
            <input
              type="text"
              name="matricula"
              value={dados.matricula}
              onChange={handleInputChange}
            />
          </div>
        </form>
        <div className={styles.buttons}>
          <button onClick={handleClose} className={styles.close}>
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`${styles.save} ${saved ? styles.saved : ''}`}
          >
            Salvar Alterações
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditDados;
