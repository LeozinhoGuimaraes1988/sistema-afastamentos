import Modal from 'react-modal';
import styles from './EditPeriodosLP.module.css';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { addLicencaPremio } from '../services/fireStore';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { getAuth } from 'firebase/auth';
import { logAlteracao } from '../services/logService';

const EditPeriodosLP = ({
  currentPeriods,
  servidorSelecionado,
  showModalLicencasPremio,
  handleCloseLicencasPremio,
}) => {
  const [lp, setLP] = useState([]);

  const [novalp, setNovaLP] = useState({
    dataInicio: '',
    dataFim: '',
  });

  const handleLPChange = (e) => {
    setNovaLP({
      ...novalp,
      [e.target.name]: e.target.value,
    });
  };

  const validarDiasLicencaPremio = (dataInicio, dataFim) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    inicio.setHours(12, 0, 0, 0);
    fim.setHours(12, 0, 0, 0);

    const diffDays = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;

    return diffDays === 30;
  };

  const validarDatas = (dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) {
      toast.error('Por favor, selecione as datas de início e fim.');
      return false;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (inicio > fim) {
      toast.error('A data de início não pode ser posterior à data de fim.');
      return false;
    }

    return true;
  };

  const verificarConflitos = (dataInicio, dataFim) => {
    const inicioNovo = new Date(dataInicio + 'T00:00:00');
    const fimNovo = new Date(dataFim + 'T23:59:59');

    // Verifica contra férias e demais períodos
    const todosPeriodos = [...(currentPeriods || []), ...(lp || [])];

    for (const periodo of todosPeriodos) {
      if (!periodo.dataInicio || !periodo.dataFim) {
        continue;
      }

      const inicioPeriodo = new Date(periodo.dataInicio + 'T00:00:00');

      const fimPeriodo = new Date(periodo.dataFim + 'T23:59:59');

      if (inicioNovo <= fimPeriodo && fimNovo >= inicioPeriodo) {
        return true;
      }
    }

    return false;
  };

  const adicionarAfastamento = async (tipo) => {
    const { dataInicio, dataFim } = novalp;

    if (!validarDatas(dataInicio, dataFim)) {
      return;
    }

    // A Licenca Premio e Licenca Servidor  precisa ter exatamente 30 dias

    if (!validarDiasLicencaPremio(dataInicio, dataFim)) {
      toast.error('O afastamento deve ter exatamente 30 dias.');
      return;
    }

    if (verificarConflitos(dataInicio, dataFim)) {
      toast.error(
        'O período selecionado conflita com outro período de férias, licença-prêmio ou licença servidor.',
      );
      return;
    }

    try {
      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);

      const novoPeriodo = {
        tipo,
        dataInicio,
        dataFim,
      };

      await updateDoc(servidorRef, {
        periodos: arrayUnion(novoPeriodo),
      });

      setLP((prev) => [...prev, novoPeriodo]);

      setNovaLP({
        dataInicio: '',
        dataFim: '',
      });

      const nomeTipo =
        tipo === 'licenca-premio' ? 'licença-prêmio' : 'licença servidor';

      toast.success(`${nomeTipo} adicionada com sucesso!`);

      // Log
      const auth = getAuth();
      const user = auth.currentUser;

      await user?.getIdToken(true);

      await logAlteracao(
        nomeTipo,
        'adicionou',
        `Período: ${new Date(dataInicio + 'T00:00:00').toLocaleDateString(
          'pt-BR',
        )} a ${new Date(dataFim + 'T00:00:00').toLocaleDateString(
          'pt-BR',
        )} (${servidorSelecionado.nome})`,
        user,
      );
    } catch (error) {
      toast.error(
        `Erro ao adicionar ${
          tipo === 'licenca-premio' ? 'licença-prêmio' : 'licença servidor'
        }: ${error.message}`,
      );
    }
  };

  const removeLP = async (index) => {
    try {
      const periodoParaRemover = lp[index];

      if (!periodoParaRemover) {
        return;
      }

      const novasLPs = lp.filter((_, lpIndex) => lpIndex !== index);

      setLP(novasLPs);

      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);

      const servidorDoc = await getDoc(servidorRef);

      if (!servidorDoc.exists()) {
        toast.error('Documento do servidor não encontrado.');
        return;
      }

      const servidorData = servidorDoc.data();

      const periodosExistentes = servidorData.periodos || [];

      const novosPeriodos = periodosExistentes.filter(
        (periodo) =>
          !(
            periodo.tipo === periodoParaRemover.tipo &&
            periodo.dataInicio === periodoParaRemover.dataInicio &&
            periodo.dataFim === periodoParaRemover.dataFim
          ),
      );

      await updateDoc(servidorRef, {
        periodos: novosPeriodos,
      });

      const nomeTipo =
        periodoParaRemover.tipo === 'licenca-premio'
          ? 'licença-prêmio'
          : 'licença servidor';

      toast.success(`${nomeTipo} removida com sucesso!`);

      // Log
      const auth = getAuth();
      const user = auth.currentUser;

      await user?.getIdToken(true);

      await logAlteracao(
        nomeTipo,
        'removeu',
        `Período: ${new Date(
          periodoParaRemover.dataInicio + 'T00:00:00',
        ).toLocaleDateString('pt-BR')} a ${new Date(
          periodoParaRemover.dataFim + 'T00:00:00',
        ).toLocaleDateString('pt-BR')} (${servidorSelecionado.nome})`,
        user,
      );
    } catch (error) {
      toast.error(`Erro ao remover período: ${error.message}`);
    }
  };

  useEffect(() => {
    if (servidorSelecionado) {
      fetchAfastamentos();
    }
  }, [servidorSelecionado]);

  const fetchAfastamentos = async () => {
    try {
      const servidorDoc = await getDoc(
        doc(db, 'servidores', servidorSelecionado.id),
      );

      if (!servidorDoc.exists()) {
        return;
      }

      const servidorData = servidorDoc.data();

      const afastamentosConvertidos = (servidorData.periodos || [])
        .filter(
          (periodo) =>
            periodo.tipo === 'licenca-premio' ||
            periodo.tipo === 'licenca-servidor',
        )
        .map((periodo) => ({
          ...periodo,
        }));

      setLP(afastamentosConvertidos);
    } catch (error) {
      toast.error(`Erro ao buscar afastamentos: ${error.message}`);
    }
  };

  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.75)',
      zIndex: 1040,
    },

    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '95vh',
      padding: '20px',
      overflow: 'auto',
    },
  };

  Modal.setAppElement('#root');

  return (
    <div className={styles.modal}>
      <Modal
        isOpen={showModalLicencasPremio}
        onRequestClose={handleCloseLicencasPremio}
        shouldCloseOnOverlayClick={true}
        style={customStyles}
      >
        <div className={styles.content}>
          <h1>Inserir Afastamentos</h1>

          {servidorSelecionado ? (
            <div>
              <div className={styles.titles}>
                <p>
                  Nome: <strong>{servidorSelecionado.nome}</strong>
                </p>

                <p>
                  Matrícula: <strong>{servidorSelecionado.matricula}</strong>
                </p>

                <p>
                  Lotação: <strong>{servidorSelecionado.lotacao}</strong>
                </p>
              </div>

              <h2>Períodos de Férias e Abonos</h2>

              <div className={styles.periodVacation}>
                {currentPeriods.length > 0 ? (
                  <p>
                    Férias -
                    {currentPeriods
                      .filter((period) => period.tipo === 'ferias')
                      .map((period, index) => {
                        const dataInicio =
                          typeof period.dataInicio === 'string'
                            ? new Date(period.dataInicio + 'T00:00:00')
                            : period.dataInicio?.seconds
                              ? new Date(period.dataInicio.seconds * 1000)
                              : null;

                        const dataFim =
                          typeof period.dataFim === 'string'
                            ? new Date(period.dataFim + 'T23:59:59')
                            : period.dataFim?.seconds
                              ? new Date(period.dataFim.seconds * 1000)
                              : null;

                        const dataInicioFormatada = dataInicio
                          ? dataInicio.toLocaleDateString('pt-BR')
                          : 'Data inválida';

                        const dataFimFormatada = dataFim
                          ? dataFim.toLocaleDateString('pt-BR')
                          : 'Data inválida';

                        return `${
                          index + 1
                        }º - ${dataInicioFormatada} a ${dataFimFormatada}`;
                      })
                      .join('       ')}
                  </p>
                ) : (
                  <p>
                    Nenhum período registrado para {servidorSelecionado.nome}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p>Selecione um servidor para ver os detalhes.</p>
          )}

          <div>
            <h2 className={styles.lpTitle}>Adicionar Afastamento</h2>

            <div className={styles.datesInput}>
              <div className={styles.label}>
                <label>Data de Início</label>

                <input
                  type="date"
                  name="dataInicio"
                  value={novalp.dataInicio}
                  onChange={handleLPChange}
                />
              </div>

              <div>
                <label>Data de Fim</label>

                <input
                  className={styles.dataFim}
                  type="date"
                  name="dataFim"
                  value={novalp.dataFim}
                  onChange={handleLPChange}
                />
              </div>
            </div>
          </div>

          {/* BOTÕES */}
          <div
            className={styles.addLP}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              flexWrap: 'wrap',
              marginTop: '25px',
            }}
          >
            <button
              className={styles.buttonaddLP}
              onClick={() => adicionarAfastamento('licenca-premio')}
            >
              Adicionar Licença-prêmio
            </button>

            <button
              className={styles.buttonaddLP}
              onClick={() => adicionarAfastamento('licenca-servidor')}
              style={{
                backgroundColor: '#16a34a',
              }}
            >
              Adicionar Licença servidor
            </button>
          </div>

          {/* LISTA DOS AFASTAMENTOS */}
          <div>
            <h2>Afastamentos</h2>

            {lp.length > 0 ? (
              lp.map((afastamento, index) => {
                const dataInicio = new Date(
                  afastamento.dataInicio + 'T00:00:00',
                );

                const dataFim = new Date(afastamento.dataFim + 'T23:59:59');

                const diffDays =
                  Math.floor((dataFim - dataInicio) / (1000 * 60 * 60 * 24)) +
                  1;

                const isLicencaPremio = afastamento.tipo === 'licenca-premio';

                return (
                  <div key={index} className={styles.lp}>
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fff',
                          backgroundColor: isLicencaPremio
                            ? '#2563eb'
                            : '#16a34a',
                          marginBottom: '5px',
                        }}
                      >
                        {isLicencaPremio
                          ? 'Licença-prêmio'
                          : 'Licença servidor'}
                      </span>

                      <p>
                        {isLicencaPremio
                          ? 'Licença-prêmio de '
                          : 'Licença servidor de '}
                        {dataInicio.toLocaleDateString('pt-BR')} a{' '}
                        {dataFim.toLocaleDateString('pt-BR')}
                        {` (${diffDays} dias)`}
                      </p>
                    </div>

                    <button
                      onClick={() => removeLP(index)}
                      className={styles.eraseButton}
                    >
                      Excluir
                    </button>
                  </div>
                );
              })
            ) : (
              <p>Nenhum afastamento adicionado.</p>
            )}
          </div>

          <button onClick={handleCloseLicencasPremio} className={styles.button}>
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditPeriodosLP;
