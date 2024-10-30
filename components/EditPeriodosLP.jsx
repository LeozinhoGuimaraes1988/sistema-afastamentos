import Modal from 'react-modal';
import styles from './EditPeriodosLP.module.css';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';

import { addLicencaPremio } from '../services/fireStore';

import { getDoc, doc, updateDoc } from 'firebase/firestore';

const EditPeriodosLP = ({
  currentPeriods,
  servidorSelecionado,
  showModalLicencasPremio,
  handleCloseLicencaPremio,
}) => {
  // Definir o estado de LP localmente no componente
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

    // Calcula a diferença em milissegundos e converte para dias
    const diffDias = Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24));

    return diffDias === 30;
  };

  const handleAddLP = async () => {
    if (!validarDiasLicencaPremio(novalp.dataInicio, novalp.dataFim)) {
      alert('A licença-prêmio deve ter exatamente 30 dias.');
      return;
    }

    if (novalp.dataInicio && novalp.dataFim) {
      try {
        await addLicencaPremio(servidorSelecionado.id, {
          dataInicio: novalp.dataInicio,
          dataFim: novalp.dataFim,
          tipo: 'licenca-premio',
        });
        // Atualize a lista de licenças-prêmio localmente
        setLP((prev) => [...prev, novalp]);
        setNovaLP({ dataInicio: '', dataFim: '' }); // Reseta os campos após adicionar
        console.log('Licença-prêmio adicionada com sucesso');
      } catch (error) {
        console.error('Erro ao adicionar licença-prêmio:', error);
      }
    } else {
      alert('Por favor, selecione as datas de início e fim.');
    }
  };

  const removeLP = async (index) => {
    try {
      // Identifica a licença-prêmio a ser removida com base no índice
      const lpParaRemover = lp[index];

      if (
        !lpParaRemover ||
        !lpParaRemover.dataInicio ||
        !lpParaRemover.dataFim
      ) {
        console.error('Licença-prêmio não possui datas válidas para exclusão.');
        return;
      }

      // Remove a licença-prêmio do estado local
      const novasLPs = lp.filter((_, lpIndex) => lpIndex !== index);
      setLP(novasLPs);

      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);
      const servidorDoc = await getDoc(servidorRef);

      if (servidorDoc.exists()) {
        const servidorData = servidorDoc.data();
        const periodosExistentes = servidorData.periodos || [];

        // Filtra para remover a licença-prêmio específica do Firebase
        const novosPeriodos = periodosExistentes.filter(
          (periodo) =>
            !(
              periodo.tipo === 'licenca-premio' &&
              periodo.dataInicio === lpParaRemover.dataInicio &&
              periodo.dataFim === lpParaRemover.dataFim
            )
        );

        await updateDoc(servidorRef, { periodos: novosPeriodos });
        console.log('Licença-prêmio removida do Firebase com sucesso!');
      } else {
        console.error('Documento do servidor não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao remover licença-prêmio:', error);
    }
  };

  const handleSaveChangesLP = async () => {
    try {
      // Filtra as licenças-prêmio válidas (as que possuem `dataInicio` e `dataFim` definidos)
      const lpsValidas = lp.filter(
        (licencaPremio) => licencaPremio.dataInicio && licencaPremio.dataFim
      );

      const servidorRef = doc(db, 'servidores', servidorSelecionado.id);

      // Usa arrayUnion para adicionar cada licença-prêmio ao array de períodos no Firestore
      for (const licencaPremio of lpsValidas) {
        await updateDoc(servidorRef, {
          periodos: arrayUnion({
            tipo: 'licenca-premio',
            dataInicio: licencaPremio.dataInicio,
            dataFim: licencaPremio.dataFim,
          }),
        });
      }

      console.log(
        'Licenças-prêmio adicionadas diretamente no array de períodos!'
      );
      alert('Licenças-prêmio salvas com sucesso!');
      handleCloseLP(); // Fecha o modal após salvar
    } catch (error) {
      console.error('Erro ao salvar licenças-prêmio:', error);
    }
  };

  // Chamando a função no momento de abertura do modal
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
        console.log('Nenhum documento encontrado para o servidor selecionado.');
        return;
      }

      // Extrair os períodos e filtrar apenas os que têm tipo 'licencasPremio'
      const servidorData = servidorDoc.data();
      const lpsConvertidas = (servidorData.periodos || [])
        .filter((periodo) => periodo.tipo === 'licenca-premio')
        .map((licencaPremio) => ({
          ...licencaPremio,
          data: licencaPremio.data,
        }));

      setLP(lpsConvertidas);
    } catch (error) {
      console.error('Erro ao buscar abonos:', error);
    }
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

  Modal.setAppElement('#root');

  return (
    <div className={styles.modal}>
      <Modal
        isOpen={showModalLicencasPremio}
        onRequestClose={handleCloseLicencaPremio}
        style={customStyles}
      >
        <h1>Inserir Licenças-prêmio</h1>
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

              <h2>Períodos de Férias e Abonos</h2>
              <div>
                {currentPeriods.length > 0 ? (
                  currentPeriods.map((period, index) => (
                    <div key={index}>
                      <p>
                        <strong>
                          {period.tipo === 'ferias'
                            ? 'Férias'
                            : period.tipo === 'abono'
                            ? 'Abono'
                            : 'Licença-Prêmio'}
                          :
                        </strong>
                        {period.dataInicio
                          ? ` ${new Date(
                              period.dataInicio
                            ).toLocaleDateString()}`
                          : ''}{' '}
                        {period.dataFim
                          ? ` - ${new Date(
                              period.dataFim
                            ).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                  ))
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
          <label>Data de Início</label>
          <input
            type="date"
            name="dataInicio"
            value={novalp.dataInicio}
            onChange={handleLPChange}
          />
          <label>Data de Fim</label>
          <input
            type="date"
            name="dataFim"
            value={novalp.dataFim}
            onChange={handleLPChange}
          />
          <button className={styles.addLP} onClick={handleAddLP}>
            Adicionar Licença-prêmio
          </button>
        </div>

        <div>
          <h2>Licenças-Prêmio</h2>
          {lp.length > 0 ? (
            lp.map((licencaPremio, index) => (
              <div key={index} className={styles.lp}>
                <p>
                  Licença-prêmio de{' '}
                  {new Date(licencaPremio.dataInicio).toLocaleDateString()} a{' '}
                  {new Date(licencaPremio.dataFim).toLocaleDateString()}
                </p>
                <button
                  onClick={() => removeLP(index)}
                  className={styles.eraseButton}
                >
                  Excluir
                </button>
              </div>
            ))
          ) : (
            <p>Nenhuma licença-prêmio adicionada.</p>
          )}
        </div>

        <button className={styles.saveChanges} onClick={handleSaveChangesLP}>
          Salvar Alterações
        </button>
        <button onClick={handleCloseLicencaPremio} className={styles.button}>
          Fechar
        </button>
      </Modal>
    </div>
  );
};

export default EditPeriodosLP;
