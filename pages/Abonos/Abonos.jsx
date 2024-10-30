import styles from '../Abonos/Abonos.module.css';
import { useEffect, useState } from 'react';
import {
  getServidores,
  addAbono,
  updateServidor,
  addServidor,
} from '../../services/fireStore';

import EditPeriodosAbonos from '../../components/EditPeriodosAbonos';

const Abonos = () => {
  const [novoServidor, setNovoServidor] = useState({
    nome: '',
    cargo: '',
    lotacao: '',
    matricula: '',
  });

  const [abonos, setAbonos] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [showModalAbonos, setShowModalAbonos] = useState(false);
  const [servidorSelecionado, setServidorSelecionado] = useState(null);

  const fetchData = async () => {
    try {
      const servidoresData = await getServidores();

      const servidoresComAbonos = servidoresData.map((servidor) => {
        if (servidor.abonos && servidor.abonos.length > 0) {
          const abonosConvertidos = servidor.abonos.map((periodo) => ({
            ...periodo,
            dataConvertida: new Date(periodo.dataConvertida.seconds * 1000),
          }));
          return { ...servidor, abonos: abonosConvertidos };
        }
        return { ...servidor, abonos: [] };
      });

      setServidores(servidoresComAbonos);
    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditSubmitAbonos = async (e) => {
    const servidorId = servidorSelecionado.id;

    try {
      // Atualiza os abonos do servidor no Firebase
      await addAbono(servidorId, abonos); // Envia a lista de abonos
      alert('Abonos salvos com sucesso!');
      fetchData(); // Recarrega os dados para atualizar a lista de abonos
    } catch (error) {
      console.log('Erro ao salvar abonos:', error);
    }
    setShowModalAbonos(false);
  };

  const handleEdit = (servidor) => {
    // Verifica se o servidor possui período de férias
    if (servidor.abonos && servidor.abonos.length > 0) {
      setServidorSelecionado(servidor); // Armazena o servidor selecionado em um estado
      setAbonos(servidor.abonos); // Atualiza o currentPeriods com os períodos de férias do servidor selecionado
    } else {
      console.log('Nenhum período de férias encontrado para o servidor.');
      setCurrentPeriods([]); // Limpa se não houver períodos
    }

    setShowModal(true);
  };

  const handleClose = () => {
    setShowModalAbonos(false);
    setServidorSelecionado(null);
  };

  return (
    <div>
      <EditPeriodosAbonos
        showModal={showModalAbonos}
        handleClose={handleClose}
        servidorSelecionado={servidorSelecionado}
        currentPeriods={servidorSelecionado?.ferias || []}
        handleEditSubmitAbonos={handleEditSubmitAbonos}
        handleEdit={handleEdit}
        novoServidor={novoServidor}
      />
      <h1>Abonos</h1>

      <div>
        <h2>Servidores</h2>

        <table>
          <thead>
            <tr>
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
                    servidor.abonos.map((periodo, index) => {
                      const dataInicio = new Date(
                        periodo.dataInicio.seconds * 1000
                      );
                      const dataFim = new Date(periodo.dataFim.seconds * 1000);

                      const diffTime = Math.abs(dataFim - dataInicio);
                      const diffDays = Math.ceil(
                        diffTime / (1000 * 60 * 60 * 24)
                      );

                      return (
                        <div key={index}>
                          <p>
                            {dataInicio.toLocaleDateString()} a{' '}
                            {dataFim.toLocaleDateString()} ({diffDays} dias)
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p>Nenhum abono agendado</p>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => {
                      setCurrentPeriods(servidor.ferias);
                      handleEdit(servidor);
                    }}
                  >
                    Inserir abonos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Abonos;
