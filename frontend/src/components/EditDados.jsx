import Modal from 'react-modal';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { logAlteracao } from '../services/logService';
import toast from 'react-hot-toast';

import styles from './EditDados.module.css';

const EditDados = ({ servidorSelecionado, isOpen, handleClose }) => {
  const [dados, setDados] = useState({
    nome: '',
    matricula: '',
    cargo: '',
    lotacao: '',
  });

  const [dadosOriginais, setDadosOriginais] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (servidorSelecionado) {
      const fetchData = async () => {
        const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
        const servidorSnapshot = await getDoc(servidorRef);
        if (servidorSnapshot.exists()) {
          const data = servidorSnapshot.data();
          setDados(data);
          setDadosOriginais(data); // Guarda para comparação
        }
      };
      fetchData();
    }
  }, [servidorSelecionado]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDados({ ...dados, [name]: value });
  };

  const handleSave = async () => {
    try {
      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
      await updateDoc(servidorRef, dados);

      // Comparar dados e montar o log
      const camposAlterados = [];
      for (const key in dados) {
        if (dados[key] !== dadosOriginais[key]) {
          camposAlterados.push(
            `${key} alterado de "${dadosOriginais[key] || ''}" para "${
              dados[key] || ''
            }"`
          );
        }
      }

      const detalhes = camposAlterados.join(' | ');
      if (detalhes) {
        const auth = getAuth();
        const user = auth.currentUser;
        await user?.getIdToken(true);

        await logAlteracao('dados', 'atualizou', detalhes, user);
      }

      toast.success('Dados atualizados com sucesso!');
      setSaved(true);
      setTimeout(() => {
        handleClose();
        setSaved(false);
      }, 1000);
    } catch (error) {
      toast.error(`Erro ao atualizar dados: ${error.message}`);
      setSaved(false);
    }
  };

  const customStyles = {
    overlay: {
      zIndex: 1040,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxWidth: '90%',
      zIndex: 1050,
    },
  };

  Modal.setAppElement('#root');

  return (
    <div>
      <Modal isOpen={isOpen} onRequestClose={handleClose} style={customStyles}>
        <h1>Editar dados do servidor</h1>
        <form className={styles.periodForm}>
          {['nome', 'cargo', 'lotacao', 'matricula'].map((campo) => (
            <div key={campo} className={styles.inputField}>
              <label>{campo.charAt(0).toUpperCase() + campo.slice(1)}</label>
              <input
                type="text"
                name={campo}
                value={dados[campo]}
                onChange={handleInputChange}
              />
            </div>
          ))}
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
