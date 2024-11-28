import React, { useContext, useState, useEffect } from 'react';
import { PeriodsContext } from '../../contexts/PeriodosContext';
import { getServidores } from '../../services/fireStore';
import EditPeriodosLP from '../../components/EditPeriodosLP';
import styles from '../Abonos/Abonos.module.css';

import Navbar from '../../components/Navbar';
import ScrollToTopButton from '../../components/ScrollButton';

const LicencasPremio = () => {
  const { currentPeriods, setCurrentPeriods } = useContext(PeriodsContext);
  const [showModalLicencasPremio, setShowLicencasPremio] = useState(false);
  const [servidores, setServidores] = useState([]);
  const [servidorSelecionado, setServidorSelecionado] = useState(null);

  const handleInserirLicencasPremio = (servidor) => {
    if (!showModalLicencasPremio) {
      // Só abre se não estiver aberto
      setServidorSelecionado(servidor);
      const ferias = servidor.periodos
        ? servidor.periodos.filter((p) => p.tipo === 'ferias')
        : [];
      setCurrentPeriods(ferias);
      setShowLicencasPremio(true);
    }
  };

  const handleCloseLicencasPremio = () => {
    setShowLicencasPremio(false);
    setServidorSelecionado(null);
  };

  const fetchData = async () => {
    try {
      const servidoresData = await getServidores();

      const servidoresComLP = await Promise.all(
        servidoresData.map(async (servidor) => {
          if (servidor.periodos && servidor.periodos.length > 0) {
            const periodosConvertidos = servidor.periodos.map((periodo) => {
              let dataInicioConvertida, dataFimConvertida;

              // Verificação e conversão para `dataInicio`
              if (periodo.dataInicio) {
                if (typeof periodo.dataInicio === 'string') {
                  dataInicioConvertida = periodo.dataInicio;
                } else if (
                  periodo.dataInicio instanceof Object &&
                  typeof periodo.dataInicio.toDate === 'function'
                ) {
                  dataInicioConvertida = periodo.dataInicio
                    .toDate()
                    .toISOString()
                    .split('T')[0];
                } else {
                  console.warn(
                    'Tipo inesperado para dataInicio:',
                    periodo.dataInicio
                  );
                }
              }

              // Verificação e conversão para `dataFim`
              if (periodo.dataFim) {
                if (typeof periodo.dataFim === 'string') {
                  dataFimConvertida = periodo.dataFim;
                } else if (
                  periodo.dataFim instanceof Object &&
                  typeof periodo.dataFim.toDate === 'function'
                ) {
                  dataFimConvertida = periodo.dataFim
                    .toDate()
                    .toISOString()
                    .split('T')[0];
                } else {
                  console.warn(
                    'Tipo inesperado para dataFim:',
                    periodo.dataFim
                  );
                }
              }

              return {
                ...periodo,
                dataInicio: dataInicioConvertida,
                dataFim: dataFimConvertida,
              };
            });

            return { ...servidor, ferias: periodosConvertidos };
          } else {
            return { ...servidor, ferias: [] };
          }
        })
      );

      const servidoresOrdenados = servidoresComLP.sort((a, b) =>
        a.nome.localeCompare(b.nome)
      ); // Ordena por nome
      setServidores(servidoresOrdenados);
    } catch (error) {
      console.error('Erro ao buscar dados dos servidores:', error);
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
        <h1 className={styles.abonos}>Licenças-prêmio</h1>
        <div>
          <h2 className={styles.title}>Servidores</h2>

          <table className={styles.table}>
            <thead>
              <tr className={styles.titles}>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Lotação</th>
                <th>Matrícula</th>
                <th>Licenças-prêmio</th>
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
                    {servidor.ferias &&
                    servidor.ferias.some(
                      (periodo) => periodo.tipo === 'licenca-premio'
                    ) ? (
                      servidor.ferias
                        .filter((periodo) => periodo.tipo === 'licenca-premio')
                        .map((periodo, index) => {
                          const dataInicio = periodo.dataInicio
                            ? typeof periodo.dataInicio === 'string'
                              ? new Date(periodo.dataInicio + 'T00:00:00')
                              : new Date(periodo.dataInicio.seconds * 1000)
                            : null;
                          const dataFim = periodo.dataFim
                            ? typeof periodo.dataFim === 'string'
                              ? new Date(periodo.dataFim + 'T23:59:59')
                              : new Date(periodo.dataFim.seconds * 1000)
                            : null;

                          const diffDays =
                            dataInicio && dataFim
                              ? Math.floor(
                                  (dataFim - dataInicio) /
                                    (1000 * 60 * 60 * 24) +
                                    1
                                )
                              : null;

                          return (
                            <div key={index}>
                              <p>
                                {dataInicio
                                  ? dataInicio.toLocaleDateString()
                                  : 'Data de Início inválida'}{' '}
                                a{' '}
                                {dataFim
                                  ? dataFim.toLocaleDateString()
                                  : 'Data de Fim inválida'}
                                {diffDays !== null
                                  ? ` (${diffDays} dias)`
                                  : ' (Dias não calculados)'}
                              </p>
                            </div>
                          );
                        })
                    ) : (
                      <p>Nenhuma licença-prêmio agendada</p>
                    )}
                  </td>

                  <td>
                    <div className={styles.tdButtons}>
                      <button
                        onClick={() => handleInserirLicencasPremio(servidor)}
                      >
                        Inserir Licença-prêmio
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Component */}
        {showModalLicencasPremio && (
          <EditPeriodosLP
            showModalLicencasPremio={showModalLicencasPremio}
            handleCloseLicencasPremio={handleCloseLicencasPremio}
            servidorSelecionado={servidorSelecionado}
            currentPeriods={currentPeriods}
            setCurrentPeriods={setCurrentPeriods}
          />
        )}
      </div>
      <div>
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default LicencasPremio;
