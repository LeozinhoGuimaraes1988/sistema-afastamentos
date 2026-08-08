// src/components/Navbar/Navbar.jsx
import React from 'react';
import styles from './Navbar.module.css';
import { FaUserCircle, FaSignOutAlt, FaPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ onOpenModal }) => {
  const { currentUser, logout } = useAuth();

  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <h1 className={styles.logo}>
          Sistema de Gerenciamento de Afastamentos
        </h1>
      </div>

      <div className={styles.right}>
        <div className={styles.userInfo}>
          <FaUserCircle className={styles.icon} />
          <span className={styles.userName}>
            {currentUser?.displayName || currentUser?.email || 'Usuário'}
          </span>
        </div>

        <button className={styles.logout} onClick={logout}>
          <FaSignOutAlt />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
