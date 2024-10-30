import Modal from 'react-modal';
import styles from './EditPeriodosFerias.module.css';
import { useEffect } from 'react';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Hook
import { useUpdatePeriodo } from '../hooks/useUpdatePeriodo';

const EditPeriodosFerias = ({
  showModalFerias,
  handleClose,
  servidorSelecionado,
  handleInputChange,
  currentPeriods,
  setCurrentPeriods,
  validarPeriodosFerias,
}) => {
  const { handleSave } = useUpdatePeriodo();

  useEffect(() => {
    // Verificamos se servidorSelecionado tem um valor e período de férias
    // servidorSelecionado.ferias é um array contendo todos os períodos de férias do servidor selecionado. Chamamos o método filter para selecionar apenas os períodos que atendem a um critério específico.
    if (servidorSelecionado && currentPeriods.length > 0) {
      // Filtra períodos válidos ao carregar os dados no modal
      const periodosValidos = currentPeriods.filter(
        // Nova constante chamada periodosValidos, que armazena os períodos de férias válidos.
        (periodo) => periodo.dataInicio && periodo.dataFim
      );
      setCurrentPeriods(periodosValidos);
      // Atualizamos o estado currentPeriods com o valor de periodosValidos.
    }
  }, [servidorSelecionado, currentPeriods]); // Colocando [servidorSelecionado] como dependência, estamos dizendo ao useEffect para reexecutar essa função sempre que servidorSelecionado mudar.

  const ajustarDatasPeriodos = (periodos) => {
    return periodos.map((periodo) => {
      const dataInicio = new Date(periodo.dataInicio);
      const dataFim = new Date(periodo.dataFim);

      // Ajusta as datas para garantir que o fuso horário não está interferindo
      dataInicio.setUTCDate(dataInicio.getUTCDate() + 1);
      dataFim.setUTCDate(dataFim.getUTCDate() + 1);

      return {
        ...periodo,
        dataInicio: dataInicio.toISOString().split('T')[0],
        dataFim: dataFim.toISOString().split('T')[0],
      };
    });
  };

  const handleSaveChanges = async () => {
    // Ajusta os períodos para garantir consistência
    const periodosAjustados = ajustarDatasPeriodos(currentPeriods);

    // Filtra para remover períodos sem data de início ou fim
    const periodosValidos = periodosAjustados.filter(
      (periodo) => periodo.dataInicio && periodo.dataFim
    );

    // Valida os períodos ajustados antes de prosseguir
    if (validarPeriodosFerias(periodosValidos)) {
      try {
        // Busca os períodos atuais (incluindo abonos) do servidor selecionado
        const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
        const servidorSnapshot = await getDoc(servidorRef);

        if (servidorSnapshot.exists()) {
          const servidorData = servidorSnapshot.data();
          const periodosExistentes = servidorData.periodos || [];

          // Filtra apenas os abonos dos períodos existentes
          const abonosExistentes = periodosExistentes.filter(
            (periodo) => periodo.tipo === 'abono'
          );

          // Combina os períodos válidos (férias) com os abonos existentes
          const periodosParaSalvar = [...periodosValidos, ...abonosExistentes];

          // Salva todos os períodos combinados no banco de dados
          handleSave(servidorSelecionado.id, periodosParaSalvar);

          // Atualiza o estado localmente
          setCurrentPeriods(periodosParaSalvar);
        }
      } catch (error) {
        console.error('Erro ao buscar abonos:', error);
      }
    }
  };

  const calcularDuracao = (dataInicio, dataFim) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diff = fim - inicio;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0,0,0,0.75)',
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
    },
  };

  // Função para adicionar um novo período de férias
  const handleAddPeriodo = () => {
    // Cria um novo período com datas vazias
    const novoPeriodo = {
      dataInicio: '',
      dataFim: '',
      dias: 0,
      tipo: 'ferias',
    };

    // Adiciona o novo período ao array atual de períodos, preservando os existentes
    setCurrentPeriods((prevPeriods) => [...prevPeriods, novoPeriodo]);
  };

  // Função para remover um período de férias
  const removePeriodo = (index) => {
    const newPeriods = [...currentPeriods];
    newPeriods.splice(index, 1);
    setCurrentPeriods(newPeriods);
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
            <div>
              <div className={styles.titles}>
                {/* Informações do servidor selecionado */}
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
              {/* Mapeia os períodos de férias do servidor selecionado */}
              {currentPeriods.map((period, periodIndex) => (
                <form key={periodIndex} className={styles.periodForm}>
                  <div className={styles.inputField}>
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
                  <div className={styles.inputField}>
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
                    <div className={styles.days}>
                      <p>
                        Duração:{' '}
                        {calcularDuracao(period.dataInicio, period.dataFim)}{' '}
                        dias
                      </p>

                      <button
                        className={styles.remove}
                        type="button"
                        onClick={() => removePeriodo(periodIndex)}
                        disabled={currentPeriods.length === 1} // Desabilita quando houver apenas um período
                      >
                        Remover Período
                      </button>
                    </div>
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
            </div>
          ) : (
            <p>Selecione um servidor para editar os períodos de férias.</p>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
          }}
        >
          <div className={styles.endButtons}>
            <button onClick={handleClose} className={styles.close}>
              Fechar
            </button>
            <button onClick={handleSaveChanges} className={styles.changes}>
              Salvar Alterações
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditPeriodosFerias;
