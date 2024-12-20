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

  const fetchData = async (limpar = false) => {
    try {
      setCarregando(true);

      const resultado = await getServidoresPaginado(
        limitePorPagina,
        limpar ? null : ultimoDoc
      );

      const servidoresProcessados = await Promise.all(
        resultado.servidores.map(async (servidor) => {
          if (servidor.periodos && servidor.periodos.length > 0) {
            const periodosConvertidos = servidor.periodos.map((periodo) => {
              let dataInicioConvertida, dataFimConvertida;

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

            return { ...servidor, ferias: periodosConvertidos };
          } else {
            return { ...servidor, ferias: [] };
          }
        })
      );

      setServidores((prevServidores) => {
        if (limpar) return servidoresProcessados;

        const todosServidores = [...prevServidores, ...servidoresProcessados];
        const servidoresUnicos = Array.from(
          new Map(todosServidores.map((item) => [item.id, item])).values()
        );

        return servidoresUnicos.sort((a, b) =>
          a.nome.localeCompare(b.nome, 'pt-BR', {
            sensitivity: 'base',
            ignorePunctuation: true,
          })
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
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <div className={styles.content}>
        <h1 className={styles.abonos}>Licenças-prêmio</h1>
        <div>
          <table className={styles.table} id="tabelaLP">
            <thead>
              <tr className={styles.titles}>
                <th>Nome</th>
                <th>Cargo</th>
                <th>Lotação</th>
                <th>Matrícula</th>
                <th>Licenças-prêmio</th>
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

                  <td className="hide-pdf">
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
