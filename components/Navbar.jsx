import styles from '../components/Navbar.module.css';
import logo from '../assets/images/logoSES.png';

const Navbar = () => {
  return (
    <div className={styles.content}>
      {' '}
      {/* Usando `content` como contêiner principal */}
      <div className={styles.container}>
        <img src={logo} alt="Logo" />
        <div>
          <h1>Sistema de Gerenciamento de Afastamentos</h1>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
