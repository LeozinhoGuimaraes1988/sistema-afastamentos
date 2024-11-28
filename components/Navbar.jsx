import { useState } from 'react';
import styles from '../components/Navbar.module.css';
import logo from '../assets/images/logoSES.png';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Controle do menu responsivo

  const handleLogOut = async () => {
    const confirmed = window.confirm('Tem certeza que deseja sair?');
    if (confirmed) {
      await logout();
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div className={styles.navbarContainer}>
      <div className={styles.navbarInner}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <h1 className={styles.title}>
          Sistema de Gerenciamento de Afastamentos
        </h1>

        {/* Botão de Menu para telas menores */}
        <button
          className={styles.hamburgerMenu}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* Links de navegação */}
        <div
          className={`${styles.buttons} ${isMenuOpen ? styles.menuOpen : ''}`}
        >
          <ul className={styles.linksList}>
            <li>
              <NavLink to="/">Home</NavLink>
            </li>
            <li>
              <NavLink to="/ferias">Férias</NavLink>
            </li>
            <li>
              <NavLink to="/abonos">Abonos</NavLink>
            </li>
            <li>
              <NavLink to="/licencaspremio">Licenças-prêmio</NavLink>
            </li>
            <li>
              <NavLink to="/licencasmedicas">Licenças-médicas</NavLink>
            </li>
            <li>
              <NavLink to="/buscarperiodos">Buscar períodos</NavLink>
            </li>
            <button onClick={handleLogOut}>
              <NavLink to="/login">Sair</NavLink>
            </button>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
