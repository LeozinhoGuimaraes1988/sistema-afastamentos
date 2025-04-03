import Modal from 'react-modal';
import styles from './EditPeriodosLP.module.css';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { addLicencaPremio } from '../services/fireStore';
import { getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';

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

    // Define o horário para meio-dia para evitar problemas de timezone
    inicio.setHours(12, 0, 0, 0);
    fim.setHours(12, 0, 0, 0);

    // Calcula a diferença em dias, adicionando 1 para incluir o dia inicial
    const diffDays = Math.round((fim - inicio) / (1000 * 60 * 60 * 24)) + 1;

    return diffDays === 30;
  };

  const verificarConflitos = (dataInicio, dataFim) => {
    const inicioNovaLP = new Date(dataInicio);
    const fimNovaLP = new Date(dataFim);

    for (const periodo of currentPeriods) {
      const inicioPeriodo = new Date(periodo.dataInicio);
      const fimPeriodo = new Date(periodo.dataFim);

      // Verifica se o período novo se sobrepõe a um período existente
      if (
        (inicioNovaLP <= fimPeriodo && inicioNovaLP >= inicioPeriodo) ||
        (fimNovaLP <= fimPeriodo && fimNovaLP >= inicioPeriodo) ||
        (inicioNovaLP <= inicioPeriodo && fimNovaLP >= fimPeriodo)
      ) {
        return true;
      }
    }
    return false;
  };

  const handleAddLP = async () => {
    if (!validarDiasLicencaPremio(novalp.dataInicio, novalp.dataFim)) {
      toast.error('A licença-prêmio deve ter exatamente 30 dias.');
      return;
    }

    if (verificarConflitos(novalp.dataInicio, novalp.dataFim)) {
      toast.error(
        'O período selecionado conflita com outra licença-prêmio, férias ou abono.'
      );
      return;
    }

    if (novalp.dataInicio && novalp.dataFim) {
      try {
        await addLicencaPremio(servidorSelecionado.id, {
          dataInicio: novalp.dataInicio,
          dataFim: novalp.dataFim,
          tipo: 'licenca-premio',
        });
        setLP((prev) => [...prev, novalp]);
        setNovaLP({ dataInicio: '', dataFim: '' });
        toast.success('Licença-prêmio adicionada com sucesso');
      } catch (error) {
        toast.error(`Erro ao adicionar licença-prêmio: ${error.message}`);
      }
    } else {
      toast.error('Por favor, selecione as datas de início e fim.');
    }
  };

  const removeLP = async (index) => {
    try {
      const lpParaRemover = lp[index];
      const novasLPs = lp.filter((_, lpIndex) => lpIndex !== index);
      setLP(novasLPs);

      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
      const servidorDoc = await getDoc(servidorRef);

      if (servidorDoc.exists()) {
        const servidorData = servidorDoc.data();
        const periodosExistentes = servidorData.periodos || [];

        const novosPeriodos = periodosExistentes.filter(
          (periodo) =>
            !(
              periodo.tipo === 'licenca-premio' &&
              periodo.dataInicio === lpParaRemover.dataInicio &&
              periodo.dataFim === lpParaRemover.dataFim
            )
        );

        await updateDoc(servidorRef, { periodos: novosPeriodos });
        toast.success('Licença-prêmio removida com sucesso!');
      } else {
        toast.error('Documento do servidor não encontrado.');
      }
    } catch (error) {
      toast.error(`Erro ao remover licença-prêmio: ${error.message}`);
    }
  };

  const handleSaveChangesLP = async () => {
    try {
      const lpsValidas = lp.filter(
        (licencaPremio) => licencaPremio.dataInicio && licencaPremio.dataFim
      );

      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);

      await updateDoc(servidorRef, {
        periodos: arrayUnion(
          ...lpsValidas.map((licencaPremio) => ({
            tipo: 'licenca-premio',
            dataInicio: licencaPremio.dataInicio,
            dataFim: licencaPremio.dataFim,
          }))
        ),
      });

      toast.success('Alterações salvas com sucesso!');
      setLP([]);
      setTimeout(() => {
        handleCloseLicencasPremio();
      }, 1000);
    } catch (error) {
      toast.error('Erro ao salvar licenças-prêmio:', error);
    }
  };

  useEffect(() => {
    if (servidorSelecionado) {
      fetchLicencasPremio();
    }
  }, [servidorSelecionado]);

  const fetchLicencasPremio = async () => {
    try {
      const servidorDoc = await getDoc(
        doc(db, 'servidores', servidorSelecionado.id)
      );

      if (!servidorDoc.exists()) {
        return;
      }

      const servidorData = servidorDoc.data();
      const lpsConvertidas = (servidorData.periodos || [])
        .filter((periodo) => periodo.tipo === 'licenca-premio')
        .map((licencaPremio) => ({
          ...licencaPremio,
          data: licencaPremio.data,
        }));

      setLP(lpsConvertidas);
    } catch (error) {
      toast.error('Erro ao buscar licenças-prêmio:', error);
    }
  };

  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.75)',
      zIndex: 1040, // Certifique-se de que esteja acima da navbar e outros elementos
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '700px', // Largura padrão
      maxWidth: '90vw', // Largura máxima para telas pequenas
      maxHeight: '95vh', // Limite a altura máxima para evitar overflow
      padding: '20px', // Um padding suave ao redor do conteúdo
      overflow: 'auto', // Permite rolagem se o conteúdo exceder a altura
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
          <h1>Inserir Licenças-prêmio</h1>

          <div>
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
                        .filter((period) => period.tipo === 'ferias') // Filtra para mostrar apenas os períodos de férias
                        .map((period, index) => {
                          // Verificar e tratar dataInicio
                          const dataInicio =
                            typeof period.dataInicio === 'string'
                              ? new Date(period.dataInicio + 'T00:00:00') // Adiciona hora para evitar timezone
                              : period.dataInicio?.seconds
                              ? new Date(period.dataInicio.seconds * 1000) // Caso venha do Firebase como timestamp
                              : null;

                          // Verificar e tratar dataFim
                          const dataFim =
                            typeof period.dataFim === 'string'
                              ? new Date(period.dataFim + 'T23:59:59') // Adiciona hora para evitar timezone
                              : period.dataFim?.seconds
                              ? new Date(period.dataFim.seconds * 1000) // Caso venha do Firebase como timestamp
                              : null;

                          // Formata as datas para exibição ou exibe 'Data inválida'
                          const dataInicioFormatada = dataInicio
                            ? dataInicio.toLocaleDateString()
                            : 'Data inválida';
                          const dataFimFormatada = dataFim
                            ? dataFim.toLocaleDateString()
                            : 'Data inválida';

                          return `${
                            index + 1
                          }º - ${dataInicioFormatada} a ${dataFimFormatada}`;
                        })
                        .join('       ')}{' '}
                      {/* Espaçamento entre os períodos */}
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
          </div>
          <div>
            <h2 className={styles.lpTitle}>Adicionar Licença-prêmio</h2>
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
                  type="date"
                  name="dataFim"
                  value={novalp.dataFim}
                  onChange={handleLPChange}
                />
              </div>
            </div>
          </div>
          <div className={styles.addLP}>
            <button className={styles.buttonaddLP} onClick={handleAddLP}>
              Adicionar Licença-prêmio
            </button>
          </div>
          <div>
            <h2>Licenças-Prêmio</h2>
            {lp.length > 0 ? (
              lp.map((licencaPremio, index) => {
                const dataInicio = new Date(
                  licencaPremio.dataInicio + 'T00:00:00'
                );
                const dataFim = new Date(licencaPremio.dataFim + 'T23:59:59');
                const diffDays =
                  dataInicio && dataFim
                    ? Math.floor(
                        (dataFim - dataInicio) / (1000 * 60 * 60 * 24) + 1
                      ) // Ajuste para incluir o último dia
                    : null;

                return (
                  <div key={index} className={styles.lp}>
                    <p>
                      Licença prêmio de{' '}
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
              <p>Nenhuma licença-prêmio adicionada.</p>
            )}
          </div>
          <button className={styles.saveChanges} onClick={handleSaveChangesLP}>
            Salvar Alterações
          </button>
          <button onClick={handleCloseLicencasPremio} className={styles.button}>
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditPeriodosLP;
