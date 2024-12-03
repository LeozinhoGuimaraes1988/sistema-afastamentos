import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// import { NavLink, useNavigate } from 'react-router-dom';

import Navbar from '../../components/Navbar';

import { useEffect, useState } from 'react';
import {
  getServidores,
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
import GerarPDFButton from '../../components/GerarPDFButton';

// CSS
import styles from '../Ferias/Ferias.module.css';

const Ferias = () => {
  // Estado para armazenar os dados do novo servidor
  const [newServidor, setNewServidor] = useState({
    nome: '',
    cargo: '',
    lotacao: '',
    matricula: '',
  });

  //const navigate = useNavigate();

  const { documents, loading, error } = useFetchFerias('feriasCollection');
  const { addPeriodo } = useAddPeriodo();

  // Estado para armazenar os períodos de férias
  const [ferias, setFerias] = useState([]);

  // Estado para armazenar o ID do servidor em edição
  const [editingId, setEditingId] = useState(null);

  // const [periodoAtual, setPeriodoAtual] = useState(null);

  // Estado para armazenar os períodos de férias dos servidores
  const [servidoresComFerias, setServidoresComFerias] = useState([]);

  const [servidores, setServidores] = useState([]); // para armazenar a lista de servidores

  const fetchData = async () => {
    try {
      const servidoresData = await getServidores();

      const servidoresComFerias = await Promise.all(
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

      const servidoresOrdenados = servidoresComFerias.sort((a, b) =>
        a.nome.trim().toLowerCase().localeCompare(b.nome.trim().toLowerCase())
      ); // Ordena por nome
      setServidoresComFerias(servidoresOrdenados);
    } catch (error) {
      console.error('Erro ao buscar dados dos servidores:', error);
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
      await addPeriodo(ferias[0], servidorId); // Se `ferias` é um array, passe o primeiro objeto
      setFerias([...ferias, { dataInicio: '', dataFim: '' }]); // Atualiza o estado local
    } catch (error) {
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
        'Combinação de períodos inválida. As combinações válidas são: 10+10+10, 10+20, 20+10, 15+15 ou 30 dias.'
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

    // Atualiza ou adiciona um servidor
    if (editingId) {
      await updateServidor(editingId, newServidor);
      setEditingId(null);
    } else {
      const newServerRef = await addServidor(newServidor);

      if (!newServerRef) {
        // Se newServerRef for null, o servidor já existe
        alert('Este servidor já está cadastrado.');
        return; // Encerra a função para evitar erros
      }
      servidorId = newServerRef.id; // Define o servidorId corretamente
    }

    try {
      // Adiciona os períodos de férias para o servidor
      for (const periodo of ferias) {
        await addFerias(servidorId, {
          dataInicio: periodo.dataInicio,
          dataFim: periodo.dataFim,
          dias: periodo.dias,
        });
      }
      alert('Servidor e períodos adicionados com sucesso!');
    } catch (error) {
      console.log('Erro ao adicionar período de férias: ', error);
    }

    // Limpa o estado após o envio
    setNewServidor({ nome: '', cargo: '', lotacao: '', matricula: '' });
    setFerias([{ dataInicio: '', dataFim: '', dias: 0 }]);

    // Atualiza a lista de servidores
    fetchData();
  };

  // Função para lidar com a exclusão de um servidor
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza de que deseja excluir este servidor?')) {
      try {
        await deleteServidor(id);

        // Atualize o estado filtrando o servidor excluído
        setServidores((prevServidores) =>
          prevServidores.filter((servidor) => servidor.id !== id)
        );
        await fetchData(); // Chamamos a fetchData para garantir que os dados estejam sincronizados corretamente com o banco de dados
        alert('Servidor excluído com sucesso!');
      } catch (error) {
        console.log('Erro ao excluir servidor: ', error);
      }
    }
  };

  // Função para lidar com a atualização de um servidor
  const [servidorSelecionado, setServidorSelecionado] = useState(null);

  const handleEdit = (servidor) => {
    // Verifica se o servidor possui período de férias
    if (servidor.ferias && servidor.ferias.length > 0) {
      setServidorSelecionado(servidor); // Armazena o servidor selecionado em um estado
      setCurrentPeriods(servidor.ferias); // Atualiza o currentPeriods com os períodos de férias do servidor selecionado
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

  // Função de Voltar ao início da página

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
      </div>
      {/* Botão para gerar PDF */}
      <GerarPDFButton tabelaId="tabelaFerias" fileName="ferias.pdf" />
      <div>
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
                        // Manipula dataInicio
                        const dataInicio = periodo.dataInicio
                          ? typeof periodo.dataInicio === 'string' // Se for string
                            ? new Date(periodo.dataInicio + 'T00:00:00') // Força o horário inicial para evitar timezone
                            : new Date(periodo.dataInicio.seconds * 1000) // Se vier do Firestore (timestamp)
                          : null;

                        // Manipula dataFim
                        const dataFim = periodo.dataFim
                          ? typeof periodo.dataFim === 'string' // Se for string
                            ? new Date(periodo.dataFim + 'T23:59:59') // Força o horário final para o dia correto
                            : new Date(periodo.dataFim.seconds * 1000) // Se vier do Firestore (timestamp)
                          : null;

                        // Adiciona 1 dia ao cálculo para incluir o último dia
                        const diffDays =
                          dataInicio && dataFim
                            ? Math.floor(
                                (dataFim.getTime() - dataInicio.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ) + 1 // Inclui o último dia
                            : null;

                        // Exibição das datas
                        return (
                          <div key={index}>
                            <p>
                              {dataInicio
                                ? dataInicio.toLocaleDateString()
                                : 'Data de Início inválida'}{' '}
                              a{' '}
                              {dataFim
                                ? dataFim.toLocaleDateString()
                                : 'Data de Fim inválida'}{' '}
                              {diffDays !== null
                                ? ` (${diffDays} dias)`
                                : ' (Dias não calculados)'}
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
                  {servidor.ferias && servidor.ferias.length > 0 ? (
                    servidor.ferias
                      .filter((periodo) => periodo.tipo === 'abono')
                      .map((periodo, index) => (
                        <div key={index}>
                          <p>
                            {index + 1}
                            {index === 0
                              ? 'º' // Exibe "1º"
                              : index === 1
                              ? 'º' // Exibe "2º"
                              : index === 2
                              ? 'º' // Exibe "3º"
                              : 'º'}{' '}
                            {periodo.data
                              ? new Date(
                                  periodo.data + 'T00:00:00'
                                ).toLocaleDateString()
                              : 'Data inválida'}
                          </p>
                        </div>
                      ))
                  ) : (
                    <p>Nenhum abono registrado</p>
                  )}
                </td>

                {/* Coluna para Períodos de Licenças-prêmio */}
                <td>
                  {servidor.ferias && servidor.ferias.length > 0 ? (
                    servidor.ferias
                      .filter((periodo) => periodo.tipo === 'licenca-premio')
                      .map((periodo, index) => {
                        const dataInicio = periodo.dataInicio
                          ? typeof periodo.dataInicio === 'string'
                            ? new Date(periodo.dataInicio)
                            : new Date(periodo.dataInicio.seconds * 1000)
                          : null;
                        const dataFim = periodo.dataFim
                          ? typeof periodo.dataFim === 'string'
                            ? new Date(periodo.dataFim)
                            : new Date(periodo.dataFim.seconds * 1000)
                          : null;

                        // Calcula a diferença entre as datas
                        const diffDays =
                          dataInicio && dataFim
                            ? Math.floor(
                                (dataFim - dataInicio) / (1000 * 60 * 60 * 24) +
                                  1
                              ) // Ajuste para incluir o último dia
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
                    <p>Nenhuma licença-prêmio registrada</p>
                  )}
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
      </div>
      <div>
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default Ferias;
