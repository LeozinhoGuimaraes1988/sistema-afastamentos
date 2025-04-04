import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import removeAccents from 'remove-accents';

import Navbar from '../../components/Navbar';

import { useEffect, useState } from 'react';
import {
  addServidor,
  deleteServidor,
  updateServidor,
  addFerias,
} from '../../services/fireStore';

// Hooks
import { useFetchFerias } from '../../hooks/useFetchFerias';
import { useAddPeriodo } from '../../hooks/useAddPeriodo';

// Components
import EditPeriodosFerias from '../../components/EditPeriodosFerias';
import EditPeriodosAbonos from '../../components/EditPeriodosAbonos';
import EditPeriodosLP from '../../components/EditPeriodosLP';
import EditDados from '../../components/EditDados';
import ScrollToTopButton from '../../components/ScrollButton';

// CSS
import styles from '../Ferias/Ferias.module.css';
import { getServidoresPaginado } from '../../services/servidoresServices';

const Ferias = () => {
  // Estado para armazenar os dados do novo servidor
  const [newServidor, setNewServidor] = useState({
    nome: '',
    cargo: '',
    lotacao: '',
    matricula: '',
  });

  //const navigate = useNavigate();

  const { loading, error } = useFetchFerias('feriasCollection');
  const { addPeriodo } = useAddPeriodo();

  // Estado para armazenar os períodos de férias
  const [ferias, setFerias] = useState([]);

  // Estado para armazenar o ID do servidor em edição
  const [editingId, setEditingId] = useState(null);

  // Estado para armazenar os períodos de férias dos servidores
  const [servidoresComFerias, setServidoresComFerias] = useState([]);

  // Estados para paginação
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [temMais, setTemMais] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [limitePorPagina] = useState(10);

  const [servidores, setServidores] = useState([]); // para armazenar a lista de servidores

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

  // Função para atualizar a data de início ou de fim de um período
  const handleDateChange = (index, date, field) => {
    setFerias((prevFerias) => {
      const newFerias = [...prevFerias];
      newFerias[index] = { ...newFerias[index], [field]: date };

      if (newFerias[index].dataInicio && newFerias[index].dataFim) {
        const diasCalculados = calcularDias(
          newFerias[index].dataInicio,
          newFerias[index].dataFim
        );
        newFerias[index].dias = diasCalculados;
      }
      return newFerias;
    });
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

  // Função para remover um período de férias
  const removePeriodo = (index) => {
    setFerias(ferias.filter((_, i) => i !== index));
  };

  const [showModalFerias, setShowModalFerias] = useState(false);
  const [showModalAbonos, setShowModalAbonos] = useState(false);
  const [showModalLicencasPremio, setShowModalLicencasPremio] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);

  // Armazena os períodos atuais do servidor
  const [currentPeriods, setCurrentPeriods] = useState([]);

  // Função para atualizar o estado do novo servidor com base no input
  const handleServidorInputChange = (e) => {
    const { name, value } = e.target;
    setNewServidor({ ...newServidor, [name]: value });
  };

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

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!validarPeriodosFerias(ferias)) {
      return;
    }

    let servidorId = editingId;

    try {
      // Atualiza ou adiciona um servidor
      if (editingId) {
        await updateServidor(editingId, newServidor);
        setEditingId(null);
        toast.success('Servidor atualizado com sucesso!');
      } else {
        const newServerRef = await addServidor(newServidor);

        if (!newServerRef) {
          toast.error('Este servidor já está cadastrado.');
          return;
        }
        servidorId = newServerRef.id;
        toast.success('Servidor cadastrado com sucesso!');
      }

      // Adiciona os períodos de férias
      try {
        for (const periodo of ferias) {
          await addFerias(servidorId, {
            dataInicio: periodo.dataInicio,
            dataFim: periodo.dataFim,
            dias: periodo.dias,
          });
        }
        toast.success('Períodos adicionados com sucesso!');
      } catch (error) {
        toast.error('Erro ao adicionar períodos de férias');
        console.log('Erro ao adicionar período de férias: ', error);
      }

      // Limpa o estado após o envio
      setNewServidor({ nome: '', cargo: '', lotacao: '', matricula: '' });
      setFerias([{ dataInicio: '', dataFim: '', dias: 0 }]);

      // Atualiza a lista de servidores
      fetchData();
    } catch (error) {
      toast.error('Erro ao processar operação');
      console.error('Erro:', error);
    }
  };

  // Função para lidar com a exclusão de um servidor
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza de que deseja excluir este servidor?')) {
      try {
        await deleteServidor(id);
        toast.success('Servidor excluído com sucesso!');
        setServidores((prevServidores) =>
          prevServidores.filter((servidor) => servidor.id !== id)
        );
        await fetchData();
      } catch (error) {
        toast.error('Erro ao excluir servidor');
      }
    }
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

  // Função para fechar o modal de abonos
  const handleCloseAbonos = () => {
    setShowModalAbonos(false); // Fecha o modal
  };

  // Função para fechar o modal de licenças-prêmio
  const handleCloseLicencasPremio = () => {
    setShowModalLicencasPremio(false); // Fecha o modal
  };

  // Função para lidar com a edição de dados
  const handleEditServidor = (servidor) => {
    setServidorSelecionado(servidor); // Armazena o servidor a ser editado
    setShowModalEdit(true);
  };

  // Função para fechar o modal de edição
  const handleCloseEdicao = () => {
    setShowModalEdit(false); // Fecha o modal
    setServidorSelecionado(null); // Limpa o servidor selecionado
  };

  // Função para lidar com os abonos
  const handleEditAbonos = (servidor) => {
    setCurrentPeriods(servidor.ferias);
    setServidorSelecionado(servidor);
    setShowModalAbonos(true);
  };

  return (
    <div>
      <div className={styles.navbar}>
        <Navbar />
      </div>
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
      <div>
        {showModalAbonos && (
          <EditPeriodosAbonos
            showModalAbonos={showModalAbonos}
            handleCloseAbonos={handleCloseAbonos}
            servidoresComFerias={servidoresComFerias}
            servidorSelecionado={servidorSelecionado}
            currentPeriods={currentPeriods}
            handleInputChange={handleInputChange}
            setCurrentPeriods={setCurrentPeriods}
            validarPeriodosFerias={validarPeriodosFerias}
          />
        )}
      </div>
      <div>
        {showModalLicencasPremio && (
          <EditPeriodosLP
            showModalLicencasPremio={showModalLicencasPremio}
            handleCloseLicencasPremio={handleCloseLicencasPremio}
            servidoresComFerias={servidoresComFerias}
            servidorSelecionado={servidorSelecionado}
            currentPeriods={currentPeriods}
            handleInputChange={handleInputChange}
            setCurrentPeriods={setCurrentPeriods}
            validarPeriodosFerias={validarPeriodosFerias}
          />
        )}
      </div>
      <div>
        {showModalEdit && (
          <EditDados
            isOpen={showModalEdit}
            servidorSelecionado={servidorSelecionado}
            handleClose={handleCloseEdicao}
          />
        )}
      </div>

      <div className={styles.mainContent}>
        {editingId ? (
          <EditForm /> // Exibe o formulário de edição
        ) : (
          <div className={styles.form_container}>
            <h1>Cadastre o servidor abaixo:</h1>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.form}>
                <div className={styles.input}>
                  <input
                    type="text"
                    name="nome"
                    value={newServidor.nome}
                    onChange={handleServidorInputChange}
                    placeholder="Nome do servidor"
                    autoComplete="off"
                  />
                  <input
                    type="text"
                    name="matricula"
                    value={newServidor.matricula}
                    onChange={handleServidorInputChange}
                    placeholder="Matrícula"
                  />
                </div>
                <div className={styles.input}>
                  <input
                    type="text"
                    name="cargo"
                    value={newServidor.cargo}
                    onChange={handleServidorInputChange}
                    placeholder="Cargo"
                  />
                  <input
                    type="text"
                    name="lotacao"
                    value={newServidor.lotacao}
                    onChange={handleServidorInputChange}
                    placeholder="Lotação"
                  />
                </div>
              </div>
              <h2>Informe o período de férias</h2>
              {/* Campos de Data e Botão de Adicionar */}

              {ferias.map((periodo, index) => (
                <div className={styles.date} key={index}>
                  <DatePicker
                    selected={
                      periodo.dataInicio ? new Date(periodo.dataInicio) : null
                    }
                    onChange={(date) =>
                      handleDateChange(index, date, 'dataInicio')
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Data de Início"
                  />
                  <DatePicker
                    selected={
                      periodo.dataFim ? new Date(periodo.dataFim) : null
                    }
                    onChange={(date) =>
                      handleDateChange(index, date, 'dataFim')
                    }
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Data de Fim"
                  />
                  {ferias.length > 1 && (
                    <button
                      className={styles.buttonDate}
                      type="button"
                      onClick={() => removePeriodo(index)}
                    >
                      Remover Período
                    </button>
                  )}
                </div>
              ))}
              <div className={styles.periodButton}>
                {ferias.length < 3 && (
                  <div className={styles.addPeriodo}>
                    <button type="button" onClick={handleAddPeriodo}>
                      Adicionar Período
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.saveServidor}>
                <button>Salvar Servidor</button>
              </div>
            </form>
          </div>
        )}

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
            {servidoresComFerias.map((servidor) => (
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
                    <button onClick={() => handleEditServidor(servidor)}>
                      Editar Servidor
                    </button>
                    <button onClick={() => handleDelete(servidor.id)}>
                      Excluir Servidor
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPeriods(servidor.ferias);
                        handleEdit(servidor);
                      }}
                    >
                      Editar Períodos de férias
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPeriods(servidor.ferias);
                        handleEditAbonos(servidor);
                      }}
                    >
                      Inserir abonos
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPeriods(servidor.ferias); // Inclui períodos de férias e abonos
                        setServidorSelecionado(servidor);
                        setShowModalLicencasPremio(true); // Abre o modal de licença-prêmio
                      }}
                    >
                      Inserir licenças-prêmio
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
