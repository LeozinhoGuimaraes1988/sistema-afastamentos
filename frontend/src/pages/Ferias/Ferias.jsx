import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import removeAccents from 'remove-accents';
import { useEffect, useState } from 'react';

// Hooks
import { useFetchFerias } from '../../hooks/useFetchFerias';
import { useAddPeriodo } from '../../hooks/useAddPeriodo';

// Components
import EditPeriodosFerias from '../../components/EditPeriodosFerias';
import ScrollToTopButton from '../../components/ScrollButton';

// CSS
import styles from './Ferias.module.css';
import { getServidoresPaginado } from '../../services/servidoresServices';

const Ferias = () => {
  const { loading, error } = useFetchFerias('feriasCollection');
  const { addPeriodo } = useAddPeriodo();

  // Estado para armazenar os períodos de férias
  const [ferias, setFerias] = useState([]);

  // Estado para armazenar os períodos de férias dos servidores
  const [servidoresComFerias, setServidoresComFerias] = useState([]);

  // Estados para paginação
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [limitePorPagina] = useState(10);

  // Estado para busca de servidores
  const [filtro, setFiltro] = useState('');
  const fetchData = async (limpar = false) => {
    try {
      setCarregando(true);

      const resultado = await getServidoresPaginado(
        limitePorPagina,
        limpar ? null : ultimoDoc
      );

      if (!resultado || !resultado.servidores?.length) {
        console.log('Sem mais resultados para carregar');
        setTemMais(false);
        return;
      }

      const servidoresProcessados = await Promise.all(
        resultado.servidores.map(async (servidor) => ({
          id: servidor.id,
          nome: decodeURIComponent(servidor.nome),
          cargo: servidor.cargo,
          lotacao: servidor.lotacao,
          matricula: servidor.matricula,
          ferias: servidor.periodos || [],
        }))
      );

      setServidoresComFerias((prevServidores) => {
        // Se estiver limpando, retorna apenas os novos servidores
        if (limpar) {
          return servidoresProcessados;
        }

        // Combina servidores antigos e novos
        const todosServidores = [...prevServidores, ...servidoresProcessados];

        // Remove duplicatas usando Set e mantém a ordem correta
        const servidoresUnicos = Array.from(
          new Map(todosServidores.map((item) => [item.id, item])).values()
        );

        // Ordena corretamente considerando caracteres especiais
        return servidoresUnicos.sort((a, b) =>
          removeAccents(a.nome).localeCompare(removeAccents(b.nome), 'pt-BR', {
            sensitivity: 'base',
            ignorePunctuation: true,
          })
        );
      });

      setUltimoDoc(resultado.ultimoDocumentoDaPagina);
      setTemMais(resultado.temMais);
    } catch (error) {
      console.error('Erro no fetchData:', error);
      setTemMais(false);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const fetchData = () => {
      const fetchedFerias = [{ dataInicio: '', dataFim: '' }];
      setFerias(fetchedFerias); // Inicia com apenas um campo de período de férias
    };

    fetchData(); // Chama a função fetchData após ela ser definida
  }, []);

  // useEffect para chamar fetchData quando o componente for montado
  useEffect(() => {
    fetchData();
  }, []);

  // Função para calcular o número de dias entre duas datas
  const calcularDias = (dataInicio, dataFim) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = fim - inicio;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Função para adicionar um novo período de férias

  const handleAddPeriodo = async (servidorId) => {
    try {
      if (!servidorId) {
        throw new Error('ServidorId não fornecido!');
      }
      await addPeriodo(ferias[0], servidorId);
      toast.success('Período adicionado com sucesso!');
      setFerias([...ferias, { dataInicio: '', dataFim: '' }]);
    } catch (error) {
      toast.error('Erro ao adicionar período');
      console.error('Erro ao adicionar período:', error);
    }
  };

  useEffect(() => {
    if (!ferias.length) {
      setFerias([{ dataInicio: '', dataFim: '', dias: 0 }]);
    }
  }, [ferias]);

  const [showModalFerias, setShowModalFerias] = useState(false);

  // Armazena os períodos atuais do servidor
  const [currentPeriods, setCurrentPeriods] = useState([]);

  // Função para validar os períodos de férias
  const validarPeriodosFerias = (periodosValidos) => {
    // Calcular o número de dias de cada período
    const diasFerias = periodosValidos.map((periodo) =>
      calcularDias(periodo.dataInicio, periodo.dataFim)
    );

    // Verificar se há um intervalo menor que 30 dias entre os períodos
    for (let i = 1; i < periodosValidos.length; i++) {
      const diffEntrePeriodos = calcularDias(
        periodosValidos[i - 1].dataFim,
        periodosValidos[i].dataInicio
      );
      if (diffEntrePeriodos < 30) {
        alert('Intervalo entre os períodos não pode ser menor que 30 dias.');
        return false;
      }
    }

    // Definir as combinações válidas
    const combinacoesValidas = [
      [10, 10, 10],
      [10, 20],
      [20, 10],
      [15, 15],
      [20, 20],
      [30],
    ];

    // Verificar se a combinação de dias é válida
    const combinacaoValida = combinacoesValidas.some(
      (combinacao) =>
        combinacao.length === diasFerias.length &&
        combinacao.every((dia, index) => dia === diasFerias[index])
    );

    if (!combinacaoValida) {
      alert(
        'Combinação de períodos inválida. As combinações válidas são: 10+10+10, 10+20, 20+10, 15+15, 20+20 ou 30 dias.'
      );
      return false;
    }

    return true;
  };

  // Função para lidar com a atualização de um servidor
  const [servidorSelecionado, setServidorSelecionado] = useState(null);

  const handleEdit = (servidor) => {
    // Verifica se o servidor possui período de férias
    if (servidor.ferias && servidor.ferias.length > 0) {
      const periodosFeriasServidor = servidor.ferias.filter(
        (periodo) => periodo.tipo === 'ferias'
      );
      setServidorSelecionado(servidor); // Armazena o servidor selecionado em um estado
      setCurrentPeriods(periodosFeriasServidor); // Atualiza o currentPeriods com os períodos de férias do servidor selecionado
    } else {
      console.log('Nenhum período de férias encontrado para o servidor.');
      setServidorSelecionado(servidor);
      setCurrentPeriods([]); // Limpa se não houver períodos
    }

    setShowModalFerias(true);
  };

  useEffect(() => {}, [currentPeriods]);

  // Formulário para editar período de férias
  if (loading) return <p>Carregando...</p>;
  if (error) return <p>Erro ao carregar dados: {error}</p>;

  const handleInputChange = (index, field, value) => {
    setCurrentPeriods((prevPeriods) => {
      const updatePeriods = [...prevPeriods];
      // Convertendo para Date e formatando como 'YYYY-MM-DD'
      const formattedDate =
        typeof value === 'string' && value.includes('-')
          ? value
          : new Date(value).toISOString().split('T')[0]; // / Formata para 'YYYY-MM-DD'

      updatePeriods[index] = { ...prevPeriods[index], [field]: formattedDate };
      return updatePeriods;
    });
  };

  // Função para fechar o modal ferias
  const handleClose = () => {
    setShowModalFerias(false); // Fecha o modal
  };

  // Novo array com filtro aplicado
  const servidoresFiltrados = servidoresComFerias.filter(
    (servidor) =>
      servidor.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      servidor.matricula.includes(filtro)
  );

  return (
    <div>
      <h1 className={styles.titulo}>Férias</h1>

      <div>
        {showModalFerias && (
          <EditPeriodosFerias
            showModalFerias={showModalFerias}
            handleClose={handleClose}
            servidoresComFerias={servidoresComFerias}
            servidorSelecionado={servidorSelecionado}
            currentPeriods={currentPeriods}
            handleInputChange={handleInputChange}
            handleAddPeriodo={handleAddPeriodo}
            setCurrentPeriods={setCurrentPeriods}
            validarPeriodosFerias={validarPeriodosFerias}
          />
        )}
      </div>

      <div className={styles.mainContent}>
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
      </div>

      <div className={styles.filtroContainer}>
        <input
          type="text"
          placeholder="Buscar por nome ou matrícula"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={styles.filtroInput}
        />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table} id="tabelaFerias">
          <thead>
            <tr className={styles.titles}>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Lotação</th>
              <th>Matrícula</th>
              <th>Férias</th>
              <th>Abonos</th>
              <th>Licenças-Prêmio</th>
              <th className="hide-pdf">Ações</th>
            </tr>
          </thead>

          <tbody>
            {servidoresFiltrados.map((servidor) => (
              <tr key={servidor.id}>
                <td>{servidor.nome}</td>
                <td>{servidor.cargo}</td>
                <td>{servidor.lotacao}</td>
                <td>{servidor.matricula}</td>

                {/* Coluna para Períodos de Férias */}
                <td>
                  {servidor.ferias && servidor.ferias.length > 0 ? (
                    servidor.ferias
                      .filter((periodo) => periodo.tipo === 'ferias')
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

                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0); // Zera a hora para evitar problemas de fuso horário

                        let periodoStatus = '';

                        if (dataInicio && dataFim) {
                          if (hoje >= dataInicio && hoje <= dataFim) {
                            periodoStatus = 'andamento'; // Período em andamento
                          } else if (hoje < dataInicio) {
                            const diasParaInicio = Math.ceil(
                              (dataInicio - hoje) / (1000 * 60 * 60 * 24)
                            );

                            if (diasParaInicio <= 15) {
                              periodoStatus = 'proximo'; // Próximo em até 15 dias
                            } else {
                              periodoStatus = 'futuro'; // Futuro além de 15 dias
                            }
                          } else if (hoje > dataFim) {
                            periodoStatus = 'passado'; // Período passado
                          }
                        }

                        const diffDays =
                          dataInicio && dataFim
                            ? Math.floor(
                                (dataFim.getTime() - dataInicio.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ) + 1
                            : null;

                        return (
                          <div
                            key={index}
                            className={`periodo-ferias ${periodoStatus}`}
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
                              {dataInicio
                                ? dataInicio.toLocaleDateString()
                                : 'Data de Início inválida'}{' '}
                              a{' '}
                              {dataFim
                                ? dataFim.toLocaleDateString()
                                : 'Data de Fim inválida'}{' '}
                              {diffDays !== null
                                ? `(${diffDays} dias)`
                                : '(Dias não calculados)'}
                            </p>
                          </div>
                        );
                      })
                  ) : (
                    <p>Nenhum período de férias registrado</p>
                  )}
                </td>

                {/* Coluna para Períodos de Abonos */}
                <td>
                  {(() => {
                    // Agora usa servidor.periodos ao invés de servidor.ferias
                    const abonosFiltrados = servidor.ferias
                      ? servidor.ferias.filter(
                          (periodo) => periodo.tipo === 'abono'
                        )
                      : [];

                    if (abonosFiltrados.length === 0) {
                      return <p>Nenhum abono registrado</p>;
                    }

                    return abonosFiltrados.map((periodo, index) => {
                      const dataAbono = periodo.data
                        ? new Date(periodo.data + 'T00:00:00')
                        : null;

                      const hoje = new Date();
                      hoje.setHours(0, 0, 0, 0);

                      let periodoStatus = '';

                      if (dataAbono) {
                        if (hoje.toDateString() === dataAbono.toDateString()) {
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
                    });
                  })()}
                </td>

                {/* Coluna para Períodos de Licenças-prêmio */}
                <td>
                  {(() => {
                    // Filtra os períodos do tipo "licenca-premio"
                    const licencasPremioFiltradas = servidor.ferias
                      ? servidor.ferias.filter(
                          (periodo) => periodo.tipo === 'licenca-premio'
                        )
                      : [];

                    // Se não houver licenças-prêmio, exibe a mensagem
                    if (licencasPremioFiltradas.length === 0) {
                      return <p>Nenhuma licença-prêmio registrada</p>;
                    }

                    return licencasPremioFiltradas.map((periodo, index) => {
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
                            (dataInicio - hoje) / (1000 * 60 * 60 * 24)
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
                              (dataFim - dataInicio) / (1000 * 60 * 60 * 24)
                            ) + 1
                          : null;

                      return (
                        <div
                          key={index}
                          className={`periodo-licenca ${periodoStatus}`}
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
                            {dataInicio
                              ? dataInicio.toLocaleDateString()
                              : 'Data Inválida'}{' '}
                            a{' '}
                            {dataFim
                              ? dataFim.toLocaleDateString()
                              : 'Data Inválida'}{' '}
                            ({diffDays} dias)
                          </p>
                        </div>
                      );
                    });
                  })()}
                </td>

                {/* Coluna para Ações */}
                <td className="hide-pdf">
                  <div className={styles.tdButtons}>
                    <button
                      onClick={() => {
                        setCurrentPeriods(servidor.ferias);
                        handleEdit(servidor);
                      }}
                    >
                      Editar Períodos de férias
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
              {carregando ? 'Carregando...' : 'Carregar Mais Servidores'}
            </button>
          </div>
        )}
      </div>
      <div>
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default Ferias;
