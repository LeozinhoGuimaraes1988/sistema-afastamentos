import Modal from 'react-modal';
import styles from './EditPeriodosAbonos.module.css';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';

import { collection, getDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const EditPeriodosAbonos = ({
  showModalAbonos,
  handleCloseAbonos,
  servidorSelecionado,
  currentPeriods = [], // Valor padrão vazio
}) => {
  // const { handleSave } = useUpdatePeriodo();

  // Definir o estado de abonos localmente no componente
  const [abonos, setAbonos] = useState([]);
  const [novoAbono, setNovoAbono] = useState({
    data: '',
  });

  const handleAbonoChange = (e) => {
    setNovoAbono({ data: e.target.value });
  };

  const handleAddAbono = async () => {
    if (novoAbono.data) {
      try {
        // Adicionar o abono ao Firebase
        const abonoDocRef = await addDoc(
          collection(db, 'servidores', servidorSelecionado.id, 'abonos'),
          { data: novoAbono.data, tipo: 'abono' }
        );

        // Atualizar a lista de abonos localmente com o ID gerado
        const abonoComId = { ...novoAbono, id: abonoDocRef.id };
        setAbonos((prev) => [...prev, abonoComId]);

        console.log('Abono adicionado com sucesso:', abonoComId);

        // Limpar o campo após adicionar
        setNovoAbono({ data: '' });
      } catch (error) {
        toast.error('Erro ao adicionar abono:', error);
      }
    } else {
      toast.error('Por favor, selecione uma data.');
    }
  };

  const removeAbono = async (index) => {
    try {
      // Identifica o abono específico que será removido pelo índice
      const abonoParaRemover = abonos[index];

      if (!abonoParaRemover || !abonoParaRemover.data) {
        toast.error('Abono não possui uma data válida para exclusão.');
        return;
      }

      // Filtra e remove o abono do estado local
      const novosAbonos = abonos.filter(
        (_, abonoIndex) => abonoIndex !== index
      );
      setAbonos(novosAbonos);

      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
      const servidorDoc = await getDoc(servidorRef);

      if (servidorDoc.exists()) {
        const servidorData = servidorDoc.data();
        const periodosExistentes = servidorData.periodos || [];

        // Remove apenas o abono específico do array `periodos`, mantendo outros períodos intactos
        const novosPeriodos = periodosExistentes.filter(
          (periodo) =>
            !(
              periodo.tipo === 'abono' && periodo.data === abonoParaRemover.data
            )
        );

        await updateDoc(servidorRef, { periodos: novosPeriodos });
        toast.success('Abono removido com sucesso!');

        setTimeout(() => {
          handleCloseAbonos();
        }, 1000);
      } else {
        toast.error(
          'Documento do servidor não encontrado para remoção do abono.'
        );
      }
    } catch (error) {
      toast.error('Erro ao remover o abono:', error);
    }
  };

  const handleSaveChanges = async () => {
    // Função assíncrona que salva as alterações de abonos diretamente no array de períodos do servidor.
    try {
      // Tenta executar o bloco de código. Se ocorrer um erro, será tratado pelo `catch`.

      const abonosValidos = abonos.filter((abono) => abono.data);
      // Filtra os abonos que possuem uma data definida, criando uma lista apenas com abonos válidos.

      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
      // Cria uma referência ao documento do servidor específico no Firestore usando o `id` do servidor selecionado.

      const servidorDoc = await getDoc(servidorRef);
      // Busca o documento do servidor no Firestore de forma assíncrona.

      if (!servidorDoc.exists()) {
        toast.error('Nenhum documento encontrado para o servidor selecionado.');
        return;
      }
      // Verifica se o documento do servidor foi encontrado no Firestore.
      // Se não for encontrado, exibe uma mensagem e encerra a função.

      const servidorData = servidorDoc.data();
      const periodosExistentes = servidorData.periodos || [];
      const feriasExistentes = periodosExistentes.filter(
        (periodo) => periodo.tipo === 'ferias'
      );
      // Extrai os dados do documento do servidor e obtém a lista de períodos.
      // Filtra apenas os períodos de férias, criando uma lista separada para manter os períodos de férias existentes.

      const novosPeriodos = [
        ...feriasExistentes, // Mantém os períodos de férias existentes
        ...abonosValidos.map((abono) => ({
          tipo: 'abono',
          data: abono.data,
        })),
      ];
      // Cria uma nova lista `novosPeriodos` que inclui:
      // - Todos os períodos de férias existentes.
      // - Os abonos válidos, convertidos para objetos com `tipo: 'abono'` e a respectiva `data`.

      await updateDoc(servidorRef, {
        periodos: novosPeriodos,
      });
      // Atualiza o documento do servidor no Firestore, substituindo o campo `periodos` pelo `novosPeriodos`.
      // Isso adiciona ou atualiza os abonos no array de períodos do servidor.

      toast.success('Abonos salvos com sucesso!');
      // Exibe mensagens de sucesso no console e em um alerta para o usuário.

      setTimeout(() => {
        handleCloseAbonos();
      }, 1000);
      // Fecha o modal de abonos após salvar as alterações.
    } catch (error) {
      toast.error('Ocorreu um erro ao salvar os abonos.');
      // Captura qualquer erro que ocorra durante a execução do bloco `try`.
      // Exibe uma mensagem de erro no console e alerta o usuário sobre o problema.
    }
  };

  // Chamando a função no momento de abertura do modal
  useEffect(() => {
    if (servidorSelecionado) {
      fetchAbonos();
    }
  }, [servidorSelecionado]);

  const fetchAbonos = async () => {
    try {
      const servidorDoc = await getDoc(
        doc(db, 'servidores', servidorSelecionado.id)
      );

      if (!servidorDoc.exists()) {
        console.log('Nenhum documento encontrado para o servidor selecionado.');
        return;
      }

      // Extrair os períodos e filtrar apenas os que têm tipo 'abono'
      const servidorData = servidorDoc.data();
      const abonosConvertidos = (servidorData.periodos || [])
        .filter((periodo) => periodo.tipo === 'abono')
        .map((abono) => ({
          ...abono,
          data: abono.data,
        }));

      setAbonos(abonosConvertidos);
    } catch (error) {
      toast.error('Erro ao buscar abonos:', error);
    }
  };

  const customStyles = {
    content: {
      top: '50%', // Centraliza o modal verticalmente
      left: '50%', // Centraliza o modal horizontalmente
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)', // Centraliza o modal perfeitamente no centro
      zIndex: 1050,
      padding: '20px',
      overflow: 'auto',
    },
    overlay: {
      zIndex: 1040,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Mantém o fundo fumê
    },
  };

  Modal.setAppElement('#root');

  return (
    <div className={styles.modal}>
      <Modal
        isOpen={showModalAbonos}
        onRequestClose={handleCloseAbonos}
        style={customStyles}
      >
        <h1>Inserir abonos</h1>
        <div className={styles.container}>
          {' '}
          {/* Novo contêiner */}
          <div className={styles.feriasSection}>
            {' '}
            {/* Área laranja */}
            {servidorSelecionado ? (
              <div>
                <div className={styles.titles}>
                  <p>
                    Nome: <strong>{servidorSelecionado.nome}</strong>
                  </p>
                  <p>
                    Matrícula:<strong>{servidorSelecionado.matricula}</strong>
                  </p>
                  <p>
                    Lotação: <strong>{servidorSelecionado.lotacao}</strong>
                  </p>
                </div>
                <p className={styles.p}>
                  Este servidor possui as seguintes férias marcadas:
                </p>
                <div className={styles.dates}>
                  {currentPeriods.length > 0 ? (
                    currentPeriods
                      .filter(
                        (period) =>
                          period.tipo === 'ferias' &&
                          period.dataInicio &&
                          period.dataFim
                      )
                      .map((period, index) => {
                        // Trata dataInicio
                        const dataInicio = period.dataInicio
                          ? typeof period.dataInicio === 'string'
                            ? period.dataInicio // se for string
                            : period.dataInicio.seconds // se tiver seconds
                            ? new Date(period.dataInicio.seconds * 1000)
                                .toISOString()
                                .split('T')[0]
                            : null // se não tiver seconds
                          : null; // se não tiver dataInicio

                        // Trata dataFim
                        const dataFim = period.dataFim
                          ? typeof period.dataFim === 'string'
                            ? period.dataFim // se for string
                            : period.dataFim.seconds // se tiver seconds
                            ? new Date(period.dataFim.seconds * 1000)
                                .toISOString()
                                .split('T')[0]
                            : null // se não tiver seconds
                          : null; // se não tiver dataFim

                        return (
                          <div
                            key={`${period.tipo}-${index}`}
                            className={styles.periodForm}
                          >
                            <div className={styles.inputAbonos}>
                              <div className={styles.inputFieldAbonos}>
                                <label>Data Início</label>
                                <input
                                  type="date"
                                  value={dataInicio || ''}
                                  disabled
                                />
                              </div>
                              <div className={styles.inputFieldAbonos}>
                                <label>Data de Fim</label>
                                <input
                                  type="date"
                                  value={dataFim || ''}
                                  disabled
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <p>
                      Nenhum período registrado para {servidorSelecionado.nome}
                    </p>
                  )}

                  {/* {currentPeriods.length > 0 ? (
                    currentPeriods
                      .filter((period) => period.dataInicio && period.dataFim)
                      .map((period, index) => (
                        <div
                          key={`${period.tipo}-${index}`}
                          className={styles.periodForm}
                        >
                          <div className={styles.inputAbonos}>
                            <div className={styles.inputFieldAbonos}>
                              <label>Data Início</label>
                              <input
                                type="date"
                                value={period.dataInicio || ''}
                                disabled
                              />
                            </div>
                            <div className={styles.inputFieldAbonos}>
                              <label>Data de Fim</label>
                              <input
                                type="date"
                                value={period.dataFim || ''}
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p>
                      Nenhum período registrado para {servidorSelecionado.nome}
                    </p>
                  )} */}
                </div>
              </div>
            ) : (
              <p>Selecione um servidor para editar os períodos de férias.</p>
            )}
          </div>
          <div className={styles.abonosSection}>
            {' '}
            {/* Área verde */}
            <div className={styles.insertAbonos}>
              {abonos.length > 0 ? (
                abonos.map((abono, index) => (
                  <div key={index} className={styles.abonos}>
                    <p>
                      {index + 1}º{' '}
                      {abono.data
                        ? new Date(abono.data + 'T23:59:59')
                            .toLocaleDateString()
                            .split('T')[0]
                        : 'Data inválida'}
                    </p>
                    <button
                      onClick={() => removeAbono(index)}
                      className={styles.eraseButton}
                    >
                      Excluir abono
                    </button>
                  </div>
                ))
              ) : (
                <p>Nenhum abono adicionado.</p>
              )}
            </div>
            <div>
              <p>Escolha a data do abono</p>
              <input
                type="date"
                value={novoAbono.data}
                onChange={handleAbonoChange}
                disabled={abonos.length >= 5}
              />
              <button
                className={styles.addButton}
                type="button"
                onClick={handleAddAbono}
                disabled={abonos.length >= 5}
              >
                Adicionar abono
              </button>
            </div>
          </div>
        </div>

        <div className={styles.endButtons}>
          <button onClick={handleCloseAbonos} className={styles.close}>
            Fechar
          </button>
          <button onClick={handleSaveChanges} className={styles.changes}>
            Salvar Alterações
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EditPeriodosAbonos;
