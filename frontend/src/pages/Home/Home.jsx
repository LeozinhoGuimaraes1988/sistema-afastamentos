// src/pages/Home/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import {
  FaUmbrellaBeach,
  FaClipboardCheck,
  FaTrophy,
  FaHeartbeat,
  FaSearch,
  FaUserShield,
  FaUser,
} from 'react-icons/fa';
import { fetchWithAuth } from '../../services/apiAuth.js';

const Home = () => {
  const navigate = useNavigate();

  const testarApi = async () => {
    try {
      const res = await fetchWithAuth('/status');
      const data = await res.text();
      alert('API retornou: ' + data);
    } catch (error) {
      console.error('❌ Erro ao acessar API:', error);
      alert('Erro ao acessar API. Veja o console.');
    }
  };

  const cards = [
    { title: 'Servidores', icon: <FaUser />, path: '/servidores' },
    { title: 'Férias', icon: <FaUmbrellaBeach />, path: '/ferias' },
    { title: 'Abonos', icon: <FaClipboardCheck />, path: '/abonos' },
    { title: 'Licenças', icon: <FaTrophy />, path: '/licencaspremio' },
    {
      title: 'Licenças Médicas',
      icon: <FaHeartbeat />,
      path: '/licencasmedicas',
    },
    { title: 'Buscar Períodos', icon: <FaSearch />, path: '/buscarperiodos' },
    { title: 'Painel Admin', icon: <FaUserShield />, path: '/admin' },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h2 className={styles.title}>Selecione o tipo de afastamento</h2>
        <div className={styles.grid}>
          {cards.map((card, index) => (
            <Card
              key={index}
              title={card.title}
              icon={card.icon}
              onClick={() => navigate(card.path)}
            />
          ))}
        </div>

        {/* <div>
          <h1>Dashboard</h1>
          <button onClick={testarApi}>Testar API protegida</button>
        </div> */}
      </div>
    </div>
  );
};

const Card = ({ title, icon, onClick }) => (
  <div className={styles.card} onClick={onClick}>
    <div className={styles.icon}>{icon}</div>
    <h3 className={styles.cardTitle}>{title}</h3>
  </div>
);

export default Home;
