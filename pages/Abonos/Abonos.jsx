import { useContext, useState, useEffect } from 'react';
import { PeriodsContext } from '../../contexts/PeriodosContext';
import { getServidores } from '../../services/fireStore';

import styles from '../Abonos/Abonos.module.css';

import Navbar from '../../components/Navbar';
import EditPeriodosAbonos from '../../components/EditPeriodosAbonos';
import GerarPDFButton from '../../components/GerarPDFButton';

const Abonos = () => {
  const { currentPeriods, setCurrentPeriods } = useContext(PeriodsContext);
  const [showModalAbonos, setShowModalAbonos] = useState(false);
  const [servidores, setServidores] = useState([]);
  const [servidorSelecionado, setServidorSelecionado] = useState(null);

  const handleInserirAbono = (servidor) => {
    setServidorSelecionado(servidor);

    const ferias = servidor.periodos
      ? servidor.periodos
          .filter((p) => p.tipo === 'ferias')
          .map((periodo) => ({
            ...periodo,
            dataInicio: periodo.dataInicio
              ? new Date(periodo.dataInicio.seconds * 1000)
                  .toISOString()
                  .split('T')[0]
              : '', // Define como string vazia se não existir
            dataFim: periodo.dataFim
              ? new Date(periodo.dataFim.seconds * 1000)
                  .toISOString()
                  .split('T')[0]
              : '', // Define como string vazia se não existir
          }))
      : [];

    setCurrentPeriods(ferias);
    setShowModalAbonos(true);
  };

  const handleCloseAbonos = () => {
    setShowModalAbonos(false);
    setServidorSelecionado(null);
  };

  const fetchData = async () => {
    try {
      const servidoresData = await getServidores();

      // Ordena os servidores em ordem alfabética pelo nome
      const servidoresComAbonos = servidoresData
        .map((servidor) => {
          if (servidor.periodos && servidor.periodos.length > 0) {
            const abonos = servidor.periodos
              .filter((periodo) => periodo.tipo === 'abono')
              .map((periodo) => {
                const dataConvertida =
                  periodo.data instanceof Object && periodo.data.seconds
                    ? new Date(periodo.data.seconds * 1000)
                    : new Date(periodo.data);

                return { ...periodo, dataConvertida };
              });
            return { ...servidor, abonos };
          }
          return { ...servidor, abonos: [] };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena por nome

      setServidores(servidoresComAbonos);
    } catch (error) {
      console.error('Erro ao buscar servidores: ', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <div className={styles.content}>
        <h1 className={styles.abonos}>Abonos</h1>
        <div>
          <h2 className={styles.title}>Servidores</h2>
          {/* Botão para gerar PDF */}
          <GerarPDFButton tabelaId="tabelaAbonos" fileName="abonos.pdf" />

          <table className={styles.table} id="tabelaAbonos">
            <thead>
              <tr className={styles.titles}>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Lotação</th>
                <th>Matrícula</th>
                <th>Abonos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {servidores.map((servidor) => (
                <tr key={servidor.id}>
                  <td>{servidor.nome}</td>
                  <td>{servidor.cargo}</td>
                  <td>{servidor.lotacao}</td>
                  <td>{servidor.matricula}</td>
                  <td>
                    {servidor.abonos && servidor.abonos.length > 0 ? (
                      servidor.abonos.map((abono, index) => (
                        <div key={index}>
                          <p>
                            {index + 1}
                            {index === 0
                              ? 'º'
                              : index === 1
                              ? 'º'
                              : index === 2
                              ? 'º'
                              : index === 3
                              ? 'º'
                              : index === 4
                              ? 'ª'
                              : index === 5}{' '}
                            {abono.data
                              ? new Date(abono.data + 'T23:59:59')
                                  .toLocaleDateString()
                                  .split('T')[0]
                              : 'Data inválida'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>Nenhum abono agendado</p>
                    )}
                  </td>
                  <td>
                    <div className={styles.tdButtons}>
                      <button onClick={() => handleInserirAbono(servidor)}>
                        Inserir Abono
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Component */}
        {showModalAbonos && (
          <EditPeriodosAbonos
            showModalAbonos={showModalAbonos}
            handleCloseAbonos={handleCloseAbonos}
            servidorSelecionado={servidorSelecionado}
            currentPeriods={currentPeriods}
            setCurrentPeriods={setCurrentPeriods}
          />
        )}
      </div>
    </div>
  );
};

export default Abonos;
