import styles from '../Home/Home.module.css';
import { NavLink, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.content}>
      <div className={styles.register}>
        <h1>Cadastrar servidor</h1>

        <div className={styles.buttons}>
          <NavLink to="/register" onClick={() => navigate('/register')}>
            <button className={styles.buttonsName}>Cadastro</button>
          </NavLink>
        </div>
      </div>
      <div className={styles.container}>
        <div>
          <div className={styles.title}>
            <h1>Selecione o tipo de afastamento</h1>
          </div>

          <div className={styles.buttons}>
            <NavLink to="/ferias" onClick={() => navigate('/ferias')}>
              <button className={styles.buttonsName}>Férias</button>
            </NavLink>
            <NavLink to="/abonos" onClick={() => navigate('/abonos')}>
              <button className={styles.buttonsName}>Abonos</button>
            </NavLink>
            <NavLink
              to="/licencaspremio"
              onClick={() => navigate('/licencaspremio')}
            >
              <button className={styles.buttonsName}>Licenças-prêmio</button>
            </NavLink>

            <NavLink
              to="/licencasmedicas"
              onClick={() => navigate('./licencasmedicas')}
            >
              <button className={styles.buttonsName}>Licenças Médicas</button>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
