import React, { useContext, useState, useEffect } from 'react';
import { PeriodsContext } from '../../contexts/PeriodosContext';
import { getServidoresPaginado } from '../../services/servidoresServices';

import EditPeriodosLP from '../../components/EditPeriodosLP';
import styles from '../Abonos/Abonos.module.css';
import Navbar from '../../components/Navbar';
import ScrollToTopButton from '../../components/ScrollButton';

const LicencasPremio = () => {
  const { currentPeriods, setCurrentPeriods } = useContext(PeriodsContext);

  const [showModalLicencasPremio, setShowLicencasPremio] = useState(false);
  const [servidores, setServidores] = useState([]);
  const [servidorSelecionado, setServidorSelecionado] = useState(null);

  // Paginação
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [limitePorPagina] = useState(10);

  const handleInserirLicencasPremio = (servidor) => {
    if (!showModalLicencasPremio) {
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

  const fetchData = async (limpar = false) => {
    try {
      setCarregando(true);

      const resultado = await getServidoresPaginado(
        limitePorPagina,
        limpar ? null : ultimoDoc,
      );

      const servidoresProcessados = await Promise.all(
        resultado.servidores.map(async (servidor) => {
          if (servidor.periodos && servidor.periodos.length > 0) {
            const periodosConvertidos = servidor.periodos.map((periodo) => {
              let dataInicioConvertida;
              let dataFimConvertida;

              // Conversão de dataInicio
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
                }
              }

              // Conversão de dataFim
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
                }
              }

              return {
                ...periodo,
                dataInicio: dataInicioConvertida,
                dataFim: dataFimConvertida,
              };
            });

            return {
              ...servidor,
              ferias: periodosConvertidos,
            };
          } else {
            return {
              ...servidor,
              ferias: [],
            };
          }
        }),
      );

      setServidores((prevServidores) => {
        if (limpar) return servidoresProcessados;

        const todosServidores = [...prevServidores, ...servidoresProcessados];

        const servidoresUnicos = Array.from(
          new Map(todosServidores.map((item) => [item.id, item])).values(),
        );

        return servidoresUnicos.sort((a, b) =>
          a.nome.localeCompare(b.nome, 'pt-BR', {
            sensitivity: 'base',
            ignorePunctuation: true,
          }),
        );
      });

      setUltimoDoc(resultado.ultimoDocumentoDaPagina);
      setTemMais(resultado.temMais);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className={styles.content}>
        <h1 className={styles.abonos}>Licenças-prêmio</h1>

        <div>
          <div className={styles.legendaContainer}>
            <h4 className={styles.legendaTitulo}>Legenda:</h4>

            <div className={styles.legendaItens}>
              <div className={styles.legendaItem}>
                <div
                  className={`${styles.legendaCor} ${styles.legendaAndamento}`}
                ></div>
                <span>Em andamento</span>
              </div>

              <div className={styles.legendaItem}>
                <div
                  className={`${styles.legendaCor} ${styles.legendaProximo}`}
                ></div>
                <span>Próximo (em até 15 dias)</span>
              </div>

              <div className={styles.legendaItem}>
                <div
                  className={`${styles.legendaCor} ${styles.legendaFuturo}`}
                ></div>
                <span>Futuro (além de 15 dias)</span>
              </div>

              <div className={styles.legendaItem}>
                <div
                  className={`${styles.legendaCor} ${styles.legendaPassado}`}
                ></div>
                <span>Passado</span>
              </div>
            </div>
          </div>

          <table className={styles.table} id="tabelaLP">
            <thead>
              <tr className={styles.titles}>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Lotação</th>
                <th>Matrícula</th>
                <th>Afastamentos</th>
                <th className="hide-pdf">Ações</th>
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
                    {(() => {
                      const afastamentos =
                        servidor.ferias?.filter(
                          (periodo) =>
                            periodo.tipo === 'licenca-premio' ||
                            periodo.tipo === 'licenca-servidor',
                        ) || [];

                      if (afastamentos.length === 0) {
                        return <p>Nenhum afastamento registrado</p>;
                      }

                      return afastamentos.map((periodo, index) => {
                        const dataInicio = periodo.dataInicio
                          ? new Date(periodo.dataInicio + 'T00:00:00')
                          : null;

                        const dataFim = periodo.dataFim
                          ? new Date(periodo.dataFim + 'T23:59:59')
                          : null;

                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);

                        let periodoStatus = '';

                        if (dataInicio && dataFim) {
                          if (hoje >= dataInicio && hoje <= dataFim) {
                            periodoStatus = 'andamento';
                          } else if (hoje < dataInicio) {
                            const diasParaInicio = Math.ceil(
                              (dataInicio - hoje) / (1000 * 60 * 60 * 24),
                            );

                            periodoStatus =
                              diasParaInicio <= 15 ? 'proximo' : 'futuro';
                          } else if (hoje > dataFim) {
                            periodoStatus = 'passado';
                          }
                        }

                        const diffDays =
                          dataInicio && dataFim
                            ? Math.floor(
                                (dataFim - dataInicio) / (1000 * 60 * 60 * 24),
                              ) + 1
                            : null;

                        const isLicencaPremio =
                          periodo.tipo === 'licenca-premio';

                        return (
                          <div
                            key={index}
                            className={`periodo-licenca ${periodoStatus}`}
                            style={{
                              borderBottom: '1px solid #ccc',
                              padding: '6px',
                              marginBottom: '4px',
                              backgroundColor:
                                periodoStatus === 'andamento'
                                  ? 'lightblue'
                                  : periodoStatus === 'proximo'
                                    ? 'yellow'
                                    : periodoStatus === 'futuro'
                                      ? 'lightgreen'
                                      : periodoStatus === 'passado'
                                        ? 'lightgray'
                                        : 'transparent',
                            }}
                          >
                            <div
                              style={{
                                display: 'inline-block',
                                padding: '3px 7px',
                                marginBottom: '4px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#fff',
                                backgroundColor: isLicencaPremio
                                  ? '#2563eb'
                                  : '#16a34a',
                              }}
                            >
                              {isLicencaPremio
                                ? 'Licença-prêmio'
                                : 'Licença servidor'}
                            </div>

                            <p style={{ margin: 0 }}>
                              {dataInicio
                                ? dataInicio.toLocaleDateString('pt-BR')
                                : 'Data Inválida'}{' '}
                              a{' '}
                              {dataFim
                                ? dataFim.toLocaleDateString('pt-BR')
                                : 'Data Inválida'}{' '}
                              {diffDays !== null ? `(${diffDays} dias)` : ''}
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </td>

                  <td className="hide-pdf">
                    <div className={styles.tdButtons}>
                      <button
                        onClick={() => handleInserirLicencasPremio(servidor)}
                      >
                        Inserir Licença
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {carregando && (
            <div className={styles.loading}>
              <p>Carregando mais servidores...</p>
            </div>
          )}

          {temMais && !carregando && (
            <div className={styles.loadMoreButton}>
              <button
                className={styles.loadButton}
                onClick={() => fetchData(false)}
                disabled={carregando}
              >
                Carregar Mais Servidores
              </button>
            </div>
          )}
        </div>

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
