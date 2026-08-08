// src/components/Sidebar/Sidebar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi'; // ícone de documento/log
import { Link } from 'react-router-dom';
import styles from './Sidebar.module.css';
import {
  FaHome,
  FaUserFriends,
  FaUmbrellaBeach,
  FaClipboardCheck,
  FaHeartbeat,
  FaSearch,
  FaBars,
  FaChevronDown,
  FaTrophy,
  FaUser,
} from 'react-icons/fa';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
    setIsHovered(false); // Se clicou no toggle, não precisa mais do hover
  };

  const handleClickOutside = (e) => {
    if (
      isExpanded &&
      sidebarRef.current &&
      !sidebarRef.current.contains(e.target)
    ) {
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  const menuItems = [
    { icon: <FaHome />, label: 'Início', path: '/' },
    { icon: <FaUser />, label: 'Servidores', path: '/servidores' },
    { icon: <FaUmbrellaBeach />, label: 'Férias', path: '/ferias' },
    { icon: <FaClipboardCheck />, label: 'Abonos', path: '/abonos' },
    { icon: <FaTrophy />, label: 'Licenças', path: '/licencaspremio' },
    {
      icon: <FaHeartbeat />,
      label: 'Licenças Médicas',
      path: '/licencasmedicas',
    },
    { icon: <FaSearch />, label: 'Buscar Períodos', path: '/buscarperiodos' },
    { icon: <FaUserFriends />, label: 'Painel Admin', path: '/admin' },
    { icon: <FiFileText />, label: 'Logs', path: '/logs' },
  ];

  return (
    <div
      ref={sidebarRef}
      className={`${styles.sidebar} ${
        isExpanded
          ? styles.expanded
          : isHovered
            ? styles.hovered
            : styles.collapsed
      }`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isExpanded && !isHovered && (
        <div className={styles.chevronTrigger}>
          <FaChevronDown />
        </div>
      )}

      {(isHovered || isExpanded) && (
        <button className={styles.toggleButton} onClick={handleToggle}>
          <FaBars />
        </button>
      )}

      <ul className={styles.menu}>
        {menuItems.map((item, idx) => (
          <li
            key={idx}
            className={styles.menuItem}
            onClick={() => navigate(item.path)}
            title={isExpanded ? '' : item.label}
          >
            {(isHovered || isExpanded) && (
              <span className={styles.icon}>{item.icon}</span>
            )}
            {isExpanded && <span className={styles.label}>{item.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
