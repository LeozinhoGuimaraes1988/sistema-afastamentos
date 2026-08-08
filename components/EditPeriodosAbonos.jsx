import Modal from 'react-modal';
import styles from './EditPeriodosAbonos.module.css';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';

import { getDoc, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const EditPeriodosAbonos = ({
  showModalAbonos,
  handleCloseAbonos,
  servidorSelecionado,
  currentPeriods = [],
}) => {
  const [abonos, setAbonos] = useState([]);
  const [novoAbono, setNovoAbono] = useState({ data: '' });

  const handleAbonoChange = (e) => {
    setNovoAbono({ data: e.target.value });
  };

  // 🔢 Limite de 6 abonos
  const handleAddAbono = () => {
    if (abonos.length >= 6) {
      toast.error('É permitido no máximo 6 abonos.');
      return;
    }

    if (!novoAbono.data) {
      toast.error('Por favor, selecione uma data.');
      return;
    }

    setAbonos((prev) => [
      ...prev,
      { data: novoAbono.data, tipo: 'abono', natalicio: false },
    ]);

    setNovoAbono({ data: '' });
  };

  // ❌ Remover abono
  const removeAbono = (index) => {
    setAbonos((prev) => prev.filter((_, i) => i !== index));
  };

  // 🎄 Garantir apenas 1 natalício
  const toggleNatalicio = (indexSelecionado) => {
    setAbonos((prev) =>
      prev.map((abono, index) => ({
        ...abono,
        natalicio: index === indexSelecionado ? !abono.natalicio : false,
      })),
    );
  };

  // 💾 Salvar no Firestore
  const handleSaveChanges = async () => {
    try {
      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
      const servidorDoc = await getDoc(servidorRef);

      if (!servidorDoc.exists()) {
        toast.error('Servidor não encontrado.');
        return;
      }

      const periodosExistentes = servidorDoc.data().periodos || [];
      const feriasExistentes = periodosExistentes.filter(
        (p) => p.tipo === 'ferias',
      );

      const novosPeriodos = [
        ...feriasExistentes,
        ...abonos.map((abono) => ({
          tipo: 'abono',
          data: abono.data,
          natalicio: abono.natalicio || false,
        })),
      ];

      await updateDoc(servidorRef, { periodos: novosPeriodos });

      toast.success('Abonos salvos com sucesso!');
      setTimeout(handleCloseAbonos, 1000);
    } catch (error) {
      toast.error('Erro ao salvar abonos.');
    }
  };

  // 🔄 Buscar abonos existentes
  useEffect(() => {
    if (!servidorSelecionado) return;

    const fetchAbonos = async () => {
      try {
        const servidorDoc = await getDoc(
          doc(db, 'servidores', servidorSelecionado.id),
        );

        if (!servidorDoc.exists()) return;

        const abonosExistentes = (servidorDoc.data().periodos || [])
          .filter((p) => p.tipo === 'abono')
          .map((a) => ({
            data: a.data,
            tipo: 'abono',
            natalicio: a.natalicio || false,
          }));

        setAbonos(abonosExistentes);
      } catch {
        toast.error('Erro ao buscar abonos.');
      }
    };

    fetchAbonos();
  }, [servidorSelecionado]);

  Modal.setAppElement('#root');

  return (
    <Modal isOpen={showModalAbonos} onRequestClose={handleCloseAbonos}>
      <h1>Inserir abonos</h1>

      <div className={styles.abonosSection}>
        <div className={styles.insertAbonos}>
          {abonos.length > 0 ? (
            abonos.map((abono, index) => (
              <div
                key={index}
                className={`${styles.abonos} ${
                  abono.natalicio ? styles.natalicio : ''
                }`}
              >
                <p>
                  {index + 1}º{' '}
                  {new Date(abono.data + 'T23:59:59').toLocaleDateString()}
                </p>

                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={abono.natalicio}
                    onChange={() => toggleNatalicio(index)}
                  />
                  Natalício 🎄
                </label>

                <button
                  onClick={() => removeAbono(index)}
                  className={styles.eraseButton}
                >
                  Excluir
                </button>
              </div>
            ))
          ) : (
            <p>Nenhum abono adicionado.</p>
          )}
        </div>

        <div>
          <p>Escolha a data do abono</p>
          <input
            type="date"
            value={novoAbono.data}
            onChange={handleAbonoChange}
            disabled={abonos.length >= 6}
          />
          <button
            className={styles.addButton}
            onClick={handleAddAbono}
            disabled={abonos.length >= 6}
          >
            Adicionar abono
          </button>
        </div>
      </div>

      <div className={styles.endButtons}>
        <button onClick={handleCloseAbonos}>Fechar</button>
        <button onClick={handleSaveChanges}>Salvar Alterações</button>
      </div>
    </Modal>
  );
};

export default EditPeriodosAbonos;
