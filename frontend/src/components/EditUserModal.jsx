import React, { useState, useEffect } from 'react';
import styles from './EditUserModal.module.css';
import { useNavigate } from 'react-router-dom';

const EditUserModal = ({ user, onClose, onSave }) => {
  const [clienteId, setClienteId] = useState(user.claims?.clienteId || '');
  const [autorizado, setAutorizado] = useState(
    user.claims?.autorizado || false
  );
  const [admin, setAdmin] = useState(user.claims?.admin || false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      uid: user.uid,
      clienteId,
      autorizado,
      admin,
    });
  };

  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const fetchClientes = async () => {
      const res = await fetch('http://localhost:5000/api/clientes');
      const data = await res.json();
      setClientes(data);
    };

    fetchClientes();
  }, []);

  const handleVoltar = () => {
    navigate('/'); // ⬅️ Redireciona para a Home
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Editar Usuário</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>UID:</label>
            <input className={styles.input} value={user.uid} readOnly />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Cliente ID:</label>
            <input
              className={styles.input}
              type="text"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            />
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              checked={autorizado}
              onChange={(e) => setAutorizado(e.target.checked)}
            />
            <label>Autorizado</label>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              checked={admin}
              onChange={(e) => setAdmin(e.target.checked)}
            />
            <label>Admin</label>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleVoltar}
              className={styles.voltarButton}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
