import styles from '../LicencasMedicas/LicencasMedicas.module.css';
import { getServidores, getLicencaMedicas } from '../../services/fireStore';
import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { addLicencaMedica } from '../../services/fireStore';
import { deleteDoc, doc } from 'firebase/firestore';

import ScrollToTopButton from '../../components/ScrollButton';
import Navbar from '../../components/Navbar';
import GerarPDFButton from '../../components/GerarPDFButton';

const LicencasMedicas = () => {
  const [servidores, setServidores] = useState([]);
  const [servidorSelecionado, setServidorSelecionado] = useState('');
  const [tipoAtestado, setTipoAtestado] = useState('');
  const [quantidadeDias, setQuantidadeDias] = useState('');
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [licencas, setLicencas] = useState([]);
  const [mesFiltro, setMesFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const fetchLicencasMedicas = async () => {
    try {
      const licencasData = await getLicencaMedicas();

      const licencasConvertidas = licencasData.map((licenca) => {
        const dataInicioConvertida =
          licenca.dataInicio &&
          (typeof licenca.dataInicio === 'string'
            ? new Date(licenca.dataInicio + 'T00:00:00')
            : new Date(licenca.dataInicio.seconds * 1000));

        const dataFimConvertida =
          licenca.dataFim &&
          (typeof licenca.dataFim === 'string'
            ? new Date(licenca.dataFim + 'T23:59:59')
            : new Date(licenca.dataFim.seconds * 1000));

        return {
          ...licenca,
          dataInicio: dataInicioConvertida,
          dataFim: dataFimConvertida,
        };
      });

      // Ordenar licenças por data de início
      const licencasOrdenadas = licencasConvertidas.sort(
        (a, b) => new Date(a.dataInicio) - new Date(b.dataInicio)
      );
      setLicencas(licencasOrdenadas);
    } catch (error) {
      console.error('Erro ao buscar licenças médicas:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const servidoresData = await getServidores();

      // Ordenar os servidores por nome
      const servidoresOrdenados = servidoresData.sort((a, b) =>
        a.nome.localeCompare(b.nome)
      );

      setServidores(servidoresOrdenados);
      await fetchLicencasMedicas();
    };
    fetchData();
  }, []);

  const handleAddLicencaMedica = async (e) => {
    e.preventDefault();

    // Verifica o ID do servidor selecionado
    const servidor = servidores.find((s) => s.nome === servidorSelecionado);

    if (!servidor) {
      alert('Selecione um servidor');
      return;
    }

    if (!dataInicio || (tipoAtestado === 'Atestado Médico' && !dataFim)) {
      alert('Por favor, insira as datas de início e fim.');
      return;
    }

    // Determinar a quantidade de dias para atestado médico
    const quantidadeDiasCalculada =
      tipoAtestado === 'Atestado Médico'
        ? Math.ceil(
            new Date(dataFim) - new Date(dataInicio) / (1000 * 60 * 60 * 24) + 1
          )
        : 1; // Para atestado de comparecimento, é sempre 1 dia

    const novaLicenca = {
      tipoAtestado,
      dias: quantidadeDiasCalculada,
      mes: mesSelecionado,
      dataInicio,
      dataFim,
      dataFim: tipoAtestado === 'Atestado Médico' ? dataFim : null, // Apenas para atestado médico
    };

    try {
      // Adiciona a licença médica no Firestore
      await addLicencaMedica(servidor.id, novaLicenca);

      // Atualiza a lista de licenças a partir do Firebase após adicionar a nova licença
      await fetchLicencasMedicas();

      console.log('Licença adicionada com sucesso!', novaLicenca);

      // Limpa os campos do formulário
      setServidorSelecionado('');
      setTipoAtestado('');
      setQuantidadeDias('');
      setMesSelecionado('');
      setDataInicio('');
      setDataFim('');
    } catch (error) {
      console.error('Erro ao adicionar licença médica', error);
    }
  };

  const handleDelete = async (index) => {
    try {
      // Identifica a licenca medica que será removida pelo índice
      const licencaParaRemover = licencas[index];

      if (!licencaParaRemover || !licencaParaRemover.id) {
        console.error('Licença inválida para exclusão.');
        return;
      }

      // Referência do documento da licença na subcoleção licencasMedicas
      const licencaRef = doc(
        db,
        'servidores',
        licencaParaRemover.servidor, // ID do servidor associado)
        'licencasMedicas',
        licencaParaRemover.id // ID da licenca médica
      );

      // Exclui o documento no Firebase
      await deleteDoc(licencaRef);
      console.log('Licença removida com sucesso!');

      const novasLicencas = licencas.filter(
        (_, licencasIndex) => licencasIndex !== index
      );
      setLicencas(novasLicencas);
    } catch (error) {
      console.error('Erro ao remover licença médica:', error);
    }
  };

  const getTotaisPorServidor = () => {
    // totais = constante criada para armazenar o array gerado pelo map
    const totais = servidores.map((servidor) => {
      // esse filter vai encontrar todos os atestados que pertencem ao servidor atual (servidor.nome). Retorna um array (atestados) que contém apenas os itens de licenças onde o campo servidor é igual ao nome do servidor atual
      const atestados = licencas.filter(
        (licenca) => licenca.servidor === servidor.id
      );
      //  usamos filter novamente no array atestados para contar quantos desses atestados têm o tipo "Atestado de Comparecimento".
      const totalComparecimento = atestados.filter(
        (licenca) => licenca.tipoAtestado === 'Atestado de Comparecimento'
      ).length; // .length conta o número de elementos nesse array, que é o total de atestados de comparecimento.

      const totalMedico = atestados.filter(
        (licenca) => licenca.tipoAtestado === 'Atestado Médico'
      ).length;

      // cria e retorna um objeto para o servidor atual com as seguintes propriedades:
      return {
        servidor: servidor.nome,
        matricula: servidor.matricula,
        lotacao: servidor.lotacao,
        totalComparecimento,
        totalMedico,
      };
    });
    return totais;
  };

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <h1 className={styles.licencasMedicas}>Licenças Médicas</h1>
      <div className={styles.content}>
        <h2>Registrar Licença Médica</h2>
        <form onSubmit={handleAddLicencaMedica} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Servidor:</label>
            <select
              value={servidorSelecionado}
              onChange={(e) => setServidorSelecionado(e.target.value)}
              required
            >
              <option value="">Selecione o servidor</option>
              {servidores.map((servidor) => (
                <option key={servidor.id} value={servidor.nome}>
                  {servidor.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Mês:</label>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              required
            >
              <option value="">Selecione o mês</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Tipo de Atestado:</label>
            <select
              value={tipoAtestado}
              onChange={(e) => setTipoAtestado(e.target.value)}
              required
            >
              <option value="">Selecione o tipo</option>
              <option value="Atestado de Comparecimento">
                Atestado de Comparecimento
              </option>
              <option value="Atestado Médico">Atestado Médico</option>
            </select>
          </div>

          {/* Campos para Atestado Médico */}
          {tipoAtestado === 'Atestado Médico' && (
            <div className={styles.formGroup}>
              <label>Data de Início:</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
              <label>Data de Fim:</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </div>
          )}
          {/* Campos para Atestado de Comparecimento */}
          {tipoAtestado === 'Atestado de Comparecimento' && (
            <div className={styles.formGroup}>
              <label>Data do Comparecimento:</label>
              <input
                type="date"
                value={dataInicio} // Usamos dataInicio para o dia único
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className={styles.submitButton}>
            Registrar Licença
          </button>
        </form>
      </div>

      <div className={styles.totaisSection}>
        <h2>Licenças Registradas no Mês Selecionado</h2>
        <select
          className={styles.select}
          value={mesFiltro}
          onChange={(e) => setMesFiltro(e.target.value)}
        >
          <option value="">Selecione o mês</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
            </option>
          ))}
        </select>

        <table className={styles.table} id="tabelaLicencasMedicasMes">
          <thead>
            <tr className={styles.titles}>
              <th>Servidor</th>
              <th>Matrícula</th>
              <th>Lotação</th>
              <th>Tipo de Atestado</th>
              <th>Dias</th>
              <th className="hide-pdf">Ações</th>
            </tr>
          </thead>
          <tbody>
            {licencas
              .filter((licenca) => licenca.mes === mesFiltro)
              .map((licenca, index) => {
                const servidor = servidores.find(
                  (s) => s.id === licenca.servidor
                );

                return (
                  <tr key={index}>
                    <td>{servidor?.nome || 'Servidor não encontrado'}</td>
                    <td>{servidor?.matricula || '-'}</td>
                    <td>{servidor?.lotacao || '-'}</td>
                    <td>{licenca.tipoAtestado}</td>
                    <td>
                      {licenca.tipoAtestado === 'Atestado Médico' ? (
                        <>
                          {licenca.dataInicio
                            ? new Date(licenca.dataInicio).toLocaleDateString()
                            : 'Data inválida'}{' '}
                          a{' '}
                          {licenca.dataFim
                            ? new Date(licenca.dataFim).toLocaleDateString()
                            : 'Data inválida'}{' '}
                          (
                          {licenca.dataInicio && licenca.dataFim
                            ? Math.ceil(
                                (new Date(licenca.dataFim) -
                                  new Date(licenca.dataInicio)) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : 'N/A'}{' '}
                          dias)
                        </>
                      ) : (
                        <>
                          {licenca.dataInicio
                            ? new Date(licenca.dataInicio).toLocaleDateString()
                            : 'Data inválida'}{' '}
                          (1 dia)
                        </>
                      )}
                    </td>

                    <td className="hide-pdf">
                      <button onClick={() => handleDelete(index)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <h2>Visualizar Totais de Atestados no Ano</h2>

        <table className={styles.table} id="tabelaLicencasMedicasTotal">
          <thead>
            <tr className={styles.titles}>
              <th>Servidor</th>
              <th>Matrícula</th>
              <th>Lotação</th>
              <th>Atestados de Comparecimento</th>
              <th>Atestados Médicos</th>
            </tr>
          </thead>
          <tbody>
            {getTotaisPorServidor().map((servidor, index) => (
              <tr key={index}>
                <td>{servidor.servidor}</td>
                <td>{servidor.matricula}</td>
                <td>{servidor.lotacao}</td>
                <td>{servidor.totalComparecimento}</td>
                <td>{servidor.totalMedico}</td>
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

export default LicencasMedicas;
