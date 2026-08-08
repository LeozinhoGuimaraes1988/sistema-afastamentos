// src/components/ServidorModal.jsx
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './ServidorModal.module.css';
import toast from 'react-hot-toast';

const ServidorModal = ({
  isOpen,
  onClose,
  newServidor,
  handleServidorInputChange,
  handleEditSubmit,
}) => {
  const [formTouched, setFormTouched] = useState(false);

  const validate = () =>
    newServidor.nome && newServidor.matricula && newServidor.cargo;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormTouched(true);

    if (validate()) {
      handleEditSubmit(e);
      toast.success('Servidor salvo com sucesso!');
    } else {
      toast.error('Por favor, preencha os campos obrigatórios.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Cadastro de Servidor</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.form}>
            <div className={styles.field}>
              <label>Nome *</label>
              <input
                type="text"
                name="nome"
                value={newServidor.nome}
                onChange={handleServidorInputChange}
                className={
                  formTouched && !newServidor.nome ? styles.invalid : ''
                }
              />
            </div>
            <div className={styles.field}>
              <label>Matrícula *</label>
              <input
                type="text"
                name="matricula"
                value={newServidor.matricula}
                onChange={handleServidorInputChange}
                className={
                  formTouched && !newServidor.matricula ? styles.invalid : ''
                }
              />
            </div>
            <div className={styles.field}>
              <label>Cargo *</label>
              <input
                type="text"
                name="cargo"
                value={newServidor.cargo}
                onChange={handleServidorInputChange}
                className={
                  formTouched && !newServidor.cargo ? styles.invalid : ''
                }
              />
            </div>
            <div className={styles.field}>
              <label>Lotação</label>
              <input
                type="text"
                name="lotacao"
                value={newServidor.lotacao}
                onChange={handleServidorInputChange}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn}>
              Salvar Servidor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServidorModal;
