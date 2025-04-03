import styles from '../Home/Home.module.css';
import Navbar from '../../components/Navbar';
import { NavLink, useNavigate } from 'react-router-dom';

const Home = () => {
  // const navigate = useNavigate();
  return (
    <div>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <div className={styles.content}>
        <div className={styles.container}>
          <h1>Selecione o tipo de afastamento</h1>
          <div className={styles.buttons}>
            <NavLink to="/ferias">
              <button className={styles.buttonsName}>Férias</button>
            </NavLink>
            <NavLink to="/abonos">
              <button className={styles.buttonsName}>Abonos</button>
            </NavLink>
            <NavLink to="/licencaspremio">
              <button className={styles.buttonsName}>Licenças-prêmio</button>
            </NavLink>
            <NavLink to="/licencasmedicas">
              <button className={styles.buttonsName}>Licenças Médicas</button>
            </NavLink>
            <NavLink to="/buscarperiodos">
              <button className={styles.buttonsName}>Buscar Períodos</button>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
