import styles from '../LicencasMedicas/LicencasMedicas.module.css';

const LicencasMedicas = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Licenças Médicas</h1>
      <h1>Procurar por</h1>
      <form className={styles.form}>
        <div className={styles.name}>
          <h1>Nome</h1>
          <input type="text" />
          <button>Procurar</button>
        </div>

        <div className={styles.mat}>
          <h1>Matrícula</h1>
          <input type="number" />
          <button>Procurar</button>
        </div>

        <div className={styles.lot}>
          <h1>Lotação</h1>
          <input type="text" />
          <button>Procurar</button>
        </div>
      </form>
    </div>
  );
};

export default LicencasMedicas;
