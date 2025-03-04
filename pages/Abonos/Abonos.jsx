import { useContext, useState, useEffect } from 'react';
import { PeriodsContext } from '../../contexts/PeriodosContext';
import { getServidoresPaginado } from '../../services/servidoresServices';

import styles from '../Abonos/Abonos.module.css';

import Navbar from '../../components/Navbar';
import EditPeriodosAbonos from '../../components/EditPeriodosAbonos';
import ScrollToTopButton from '../../components/ScrollButton';

const Abonos = () => {
  const { currentPeriods, setCurrentPeriods } = useContext(PeriodsContext);
  const [showModalAbonos, setShowModalAbonos] = useState(false);
  const [servidores, setServidores] = useState([]);
  const [servidorSelecionado, setServidorSelecionado] = useState(null);

  // Paginação
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [limitePorPagina] = useState(10);

  const handleInserirAbono = (servidor) => {
    setServidorSelecionado(servidor);

    const ferias = servidor.periodos
      ? servidor.periodos
          .filter((p) => p.tipo === 'ferias')
          .map((periodo) => ({
            ...periodo,
            dataInicio: periodo.dataInicio
              ? typeof periodo.dataInicio === 'object' &&
                periodo.dataInicio.seconds
                ? new Date(periodo.dataInicio.seconds * 1000)
                    .toISOString()
                    .split('T')[0]
                : new Date(periodo.dataInicio).toISOString().split('T')[0]
              : '', // String vazia se for inválido
            dataFim: periodo.dataFim
              ? typeof periodo.dataFim === 'object' && periodo.dataFim.seconds
                ? new Date(periodo.dataFim.seconds * 1000)
                    .toISOString()
                    .split('T')[0]
                : new Date(periodo.dataFim).toISOString().split('T')[0]
              : '', // String vazia se for inválido
          }))
      : [];

    setCurrentPeriods(ferias);
    setShowModalAbonos(true);
  };

  const handleCloseAbonos = () => {
    setShowModalAbonos(false);
    setServidorSelecionado(null);
  };

  const fetchData = async (limpar = false) => {
    try {
      setCarregando(true);

      const resultado = await getServidoresPaginado(
        limitePorPagina,
        limpar ? null : ultimoDoc
      );

      const servidoresProcessados = resultado.servidores.map((servidor) => ({
        ...servidor,
        abonos:
          servidor.periodos?.filter((periodo) => periodo.tipo === 'abono') ||
          [],
      }));

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
        <h1 className={styles.abonos}>Abonos</h1>

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
        <div>
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
                      servidor.abonos
                        .filter((periodo) => periodo.tipo === 'abono')
                        .map((periodo, index) => {
                          const dataAbono = periodo.data
                            ? new Date(periodo.data + 'T00:00:00')
                            : null;

                          const hoje = new Date();
                          hoje.setHours(0, 0, 0, 0);

                          let periodoStatus = '';

                          if (dataAbono) {
                            if (
                              hoje.toDateString() === dataAbono.toDateString()
                            ) {
                              periodoStatus = 'andamento';
                            } else if (hoje < dataAbono) {
                              const diasParaInicio = Math.ceil(
                                (dataAbono - hoje) / (1000 * 60 * 60 * 24)
                              );
                              periodoStatus =
                                diasParaInicio <= 15 ? 'proximo' : 'futuro';
                            } else if (hoje > dataAbono) {
                              periodoStatus = 'passado';
                            }
                          }

                          return (
                            <div
                              key={index}
                              className={`periodo-abono ${periodoStatus}`}
                              style={{
                                borderBottom: '1px solid #ccc',
                                padding: '4px',
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
                              <p>
                                {index + 1}º Abono -{' '}
                                {dataAbono
                                  ? dataAbono.toLocaleDateString()
                                  : 'Data Inválida'}
                              </p>
                            </div>
                          );
                        })
                    ) : (
                      <p>Nenhum abono registrado</p>
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
      <div>
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default Abonos;
