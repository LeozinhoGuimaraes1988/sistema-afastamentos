import Modal from 'react-modal';
import styles from './EditPeriodosFerias.module.css';
import { useEffect } from 'react';
import { useUpdatePeriodo } from '../hooks/useUpdatePeriodo';
import { getAuth } from 'firebase/auth';

const EditPeriodosFerias = ({
  showModalFerias,
  handleClose,
  servidorSelecionado,
  handleInputChange,
  currentPeriods,
  setCurrentPeriods,
}) => {
  const { handleSave } = useUpdatePeriodo();

  useEffect(() => {
    if (servidorSelecionado) {
      const periodosFormatados = (
        currentPeriods.length > 0
          ? currentPeriods.filter((periodo) => periodo.tipo === 'ferias')
          : [{ dataInicio: '', dataFim: '', tipo: 'ferias' }]
      ).map((periodo) => {
        const dataInicio = periodo.dataInicio
          ? typeof periodo.dataInicio === 'string'
            ? periodo.dataInicio
            : periodo.dataInicio.seconds
            ? new Date(periodo.dataInicio.seconds * 1000)
                .toISOString()
                .split('T')[0]
            : null
          : null;

        const dataFim = periodo.dataFim
          ? typeof periodo.dataFim === 'string'
            ? periodo.dataFim
            : periodo.dataFim.seconds
            ? new Date(periodo.dataFim.seconds * 1000)
                .toISOString()
                .split('T')[0]
            : null
          : null;

        return {
          ...periodo,
          dataInicio,
          dataFim,
          tipo: 'ferias',
        };
      });

      setCurrentPeriods(periodosFormatados);
    }
  }, [servidorSelecionado]);

  const calcularDuracao = (dataInicio, dataFim) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diff = fim - inicio;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleAddPeriodo = () => {
    const novoPeriodo = {
      dataInicio: '',
      dataFim: '',
      dias: 0,
      tipo: 'ferias',
    };
    setCurrentPeriods((prevPeriods) => [...prevPeriods, novoPeriodo]);
  };

  const removePeriodo = (index) => {
    const newPeriods = [...currentPeriods];
    newPeriods.splice(index, 1);
    setCurrentPeriods(newPeriods);
  };

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1050,
      padding: '20px',
      overflow: 'auto',
    },
    overlay: {
      zIndex: 1040,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
  };

  Modal.setAppElement('#root');

  return (
    <div className={styles.modal}>
      <Modal
        isOpen={showModalFerias}
        onRequestClose={handleClose}
        style={customStyles}
      >
        <h1>Editar Período de Férias</h1>
        <div>
          {servidorSelecionado ? (
            <>
              <div className={styles.personalDate}>
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
              {currentPeriods.map((period, periodIndex) => (
                <form key={periodIndex} className={styles.periodForm}>
                  <div className={styles.inputFerias}>
                    <div className={styles.inputFieldFerias}>
                      <label>Data Início</label>
                      <input
                        type="date"
                        value={period.dataInicio || ''}
                        onChange={(e) =>
                          handleInputChange(
                            periodIndex,
                            'dataInicio',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className={styles.inputFieldFerias}>
                      <label>Data de Fim</label>
                      <input
                        type="date"
                        value={period.dataFim || ''}
                        onChange={(e) =>
                          handleInputChange(
                            periodIndex,
                            'dataFim',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className={styles.days}>
                    <p>
                      Duração:{' '}
                      {calcularDuracao(period.dataInicio, period.dataFim) > 0
                        ? `${calcularDuracao(
                            period.dataInicio,
                            period.dataFim
                          )} dias`
                        : ' - '}
                    </p>

                    <button
                      className={styles.remove}
                      type="button"
                      onClick={() => removePeriodo(periodIndex)}
                      disabled={currentPeriods.length === 1}
                    >
                      Remover Período
                    </button>
                  </div>
                </form>
              ))}

              {currentPeriods.length < 3 && (
                <button
                  className={styles.button}
                  type="button"
                  onClick={handleAddPeriodo}
                >
                  Adicionar Período
                </button>
              )}
            </>
          ) : (
            <p>Selecione um servidor para editar os períodos de férias.</p>
          )}
        </div>

        <div className={styles.endButtons}>
          <button
            className={styles.changes}
            onClick={() => {
              const auth = getAuth();
              const user = auth.currentUser;

              const usuario = {
                nome: user?.displayName || 'Usuário desconhecido',
                uid: user?.uid || '',
              };

              handleSave(
                servidorSelecionado.id,
                currentPeriods,
                servidorSelecionado.nome,
                usuario
              );

              setTimeout(() => {
                handleClose();
              }, 1000);
            }}
          >
            Salvar Alterações
          </button>
          <button onClick={handleClose} className={styles.close}>
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditPeriodosFerias;
