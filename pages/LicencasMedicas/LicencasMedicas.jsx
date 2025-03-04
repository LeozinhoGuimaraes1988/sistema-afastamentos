import React from 'react';
import styles from '../LicencasMedicas/LicencasMedicas.module.css';
import { getServidores, getLicencaMedicas } from '../../services/fireStore';
import { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { addLicencaMedica } from '../../services/fireStore';
import { deleteDoc, doc } from 'firebase/firestore';
// import { getServidoresPaginado } from '../../services/servidoresServices';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import ScrollToTopButton from '../../components/ScrollButton';
import Navbar from '../../components/Navbar';
import GerarPDFButton from '../../components/GerarPDFButton';

const LicencasMedicas = () => {
  const [servidores, setServidores] = useState([]);
  const [servidorSelecionado, setServidorSelecionado] = useState('');
  const [quantidadeDias, setQuantidadeDias] = useState('');
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [licencas, setLicencas] = useState([]);
  const [mesFiltro, setMesFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [activeTab, setActiveTab] = useState('mensal'); // mensal, categoria, totais
  const [categoriaExpandida, setCategoriaExpandida] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [categoriaLicenca, setCategoriaLicenca] = useState('');
  const [filtroTipos, setFiltroTipos] = useState([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [licencasFiltradas, setLicencasFiltradas] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const servidoresData = await getServidores();
        const servidoresOrdenados = servidoresData.sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );
        setServidores(servidoresOrdenados);

        // Carrega licenças em lotes
        const todasLicencas = [];
        const batchSize = 10;

        for (let i = 0; i < servidoresData.length; i += batchSize) {
          const batch = servidoresData.slice(i, i + batchSize);
          const promises = batch.map(async (servidor) => {
            const licencasDoServidor = await getLicencaMedicas(servidor.id);
            return licencasDoServidor.map((licenca) => ({
              ...licenca,
              servidor: servidor.id,
              nome: servidor.nome,
              lotacao: servidor.lotacao,
            }));
          });
          const resultados = await Promise.all(promises);
          resultados.forEach((lics) => todasLicencas.push(...lics));
        }
        setLicencas(todasLicencas);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    let filtradas = licencas;

    if (mesFiltro) {
      filtradas = filtradas.filter((licenca) => {
        if (licenca.dataInicio) {
          const inicio = licenca.dataInicio.seconds
            ? new Date(licenca.dataInicio.seconds * 1000)
            : new Date(licenca.dataInicio);
          const inicioMes = inicio.getMonth() + 1;

          const fim = licenca.dataFim
            ? licenca.dataFim.seconds
              ? new Date(licenca.dataFim.seconds * 1000)
              : new Date(licenca.dataFim)
            : inicio;
          const fimMes = fim.getMonth() + 1;

          return (
            inicioMes === parseInt(mesFiltro, 10) ||
            fimMes === parseInt(mesFiltro, 10)
          );
        }
        return false;
      });
    }

    // Aplicar filtro de tipos de licença, se houver
    if (filtroTipos.length > 0) {
      filtradas = filtradas.filter((licenca) =>
        filtroTipos.includes(licenca.tipoAtestado)
      );
    }

    setLicencasFiltradas(filtradas);
  }, [mesFiltro, filtroTipos, licencas]);

  // 🔹 Adicionar/Remover tipo de licença selecionado
  const toggleTipo = (tipo) => {
    setFiltroTipos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // 🔹 Fecha o dropdown ao clicar fora dele
  const dropdownRef = React.useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setDropdownAberto(false);
    }
  };

  // Fecha o dropdown ao clicar fora dele
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const gerarPDFVisaoMensal = () => {
    if (!mesFiltro) {
      alert('Selecione um mês para gerar o relatório');
      return;
    }

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const mesNome = new Date(0, mesFiltro - 1).toLocaleString('pt-BR', {
      month: 'long',
    });

    pdf.setFontSize(14);
    pdf.text(`Relatório de Licenças Médicas - ${mesNome}`, 15, 15);

    // 🔹 Filtrar as licenças corretamente considerando os tipos selecionados
    const licencasParaGerarPDF =
      filtroTipos.length > 0
        ? licencasFiltradas.filter((licenca) =>
            filtroTipos.includes(licenca.tipoAtestado)
          )
        : licencasFiltradas;

    // Se não houver licenças após a filtragem, exibe apenas a mensagem no PDF
    if (licencasParaGerarPDF.length === 0) {
      pdf.text(
        'Nenhuma licença encontrada para os tipos selecionados.',
        15,
        30
      );
      pdf.save(`relatorio_licencas_medicas_${mesNome}.pdf`);
      return;
    }

    const colunas = [
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Matrícula', dataKey: 'matricula' },
      { header: 'Lotação', dataKey: 'lotacao' },
      { header: 'Tipo de Atestado', dataKey: 'tipoAtestado' },
      { header: 'Período/Dias', dataKey: 'periodo' },
    ];

    const linhas = licencasParaGerarPDF.map((licenca) => {
      const servidor = servidores.find((s) => s.id === licenca.servidor);

      const dataInicio = licenca.dataInicio
        ? typeof licenca.dataInicio === 'string'
          ? new Date(licenca.dataInicio + 'T00:00:00')
          : new Date(licenca.dataInicio.seconds * 1000)
        : null;

      const dataFim = licenca.dataFim
        ? typeof licenca.dataFim === 'string'
          ? new Date(licenca.dataFim + 'T23:59:59')
          : new Date(licenca.dataFim.seconds * 1000)
        : null;

      const diffDias =
        dataInicio && dataFim
          ? Math.floor(
              (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1
          : 1;

      const periodo = `${dataInicio?.toLocaleDateString() || 'Data inválida'}${
        dataFim ? ` a ${dataFim.toLocaleDateString()}` : ''
      } (${diffDias} ${diffDias === 1 ? 'dia' : 'dias'})`;

      return {
        nome: servidor?.nome || 'Servidor não encontrado',
        matricula: servidor?.matricula || '-',
        lotacao: servidor?.lotacao || '-',
        tipoAtestado: licenca.tipoAtestado,
        periodo: periodo,
      };
    });

    pdf.autoTable({
      head: [colunas.map((col) => col.header)],
      body: linhas.map((linha) =>
        colunas.map((col) => linha[col.dataKey] || '')
      ),
      startY: 25,
      margin: { top: 20, right: 10, left: 10, bottom: 20 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 },
        4: { cellWidth: 50 },
      },
      headStyles: {
        fillColor: [200, 200, 200],
        textColor: 20,
        fontSize: 9,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    pdf.save(`relatorio_licencas_medicas_${mesNome}.pdf`);
  };

  const handleAddLicencaMedica = async (e) => {
    e.preventDefault();
    console.log('Iniciando salvamento...');

    const servidor = servidores.find((s) => s.nome === servidorSelecionado);
    console.log('Servidor encontrado:', servidor);

    if (!servidor) {
      alert('Selecione um servidor');
      return;
    }

    if (
      !dataInicio ||
      (['Atestado Médico', 'Férias', 'Licença Maternidade / Gestante'].includes(
        categoriaLicenca
      ) &&
        !dataFim)
    ) {
      alert('Por favor, insira as datas necessárias.');
      return;
    }

    const dataInicioObj = new Date(dataInicio + 'T00:00:00');
    const dataFimObj = dataFim ? new Date(dataFim + 'T23:59:59') : null;

    const quantidadeDiasCalculada = dataFimObj
      ? Math.floor(
          (dataFimObj.getTime() - dataInicioObj.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 1;

    const novaLicenca = {
      tipoAtestado: categoriaLicenca,
      dias: calcularDiasLicenca({ dataInicio, dataFim }),
      mes: mesSelecionado,
      dataInicio: dataInicio,
      dataFim: dataFim || null,
      servidor: servidor.id,
      nome: servidor.nome,
      lotacao: servidor.lotacao,
      numeroDias: calcularDiasLicenca({ dataInicio, dataFim }),
    };

    try {
      const docRef = await addLicencaMedica(servidor.id, novaLicenca);

      if (docRef) {
        const licencaCompleta = {
          ...novaLicenca,
          id: docRef.id,
        };

        setLicencas((prevLicencas) => {
          const novasLicencas = [...prevLicencas, licencaCompleta];
          return novasLicencas.sort(
            (a, b) => new Date(a.dataInicio) - new Date(b.dataInicio)
          );
        });

        // Limpa os campos do formulário
        setServidorSelecionado('');
        setCategoriaLicenca('');
        setQuantidadeDias('');
        setMesSelecionado('');
        setDataInicio('');
        setDataFim('');

        alert('Licença médica registrada com sucesso!');
      }
    } catch (error) {
      console.error('Erro detalhado:', error);
      alert('Erro ao registrar licença médica. Por favor, tente novamente.');
    }
  };

  const handleDelete = async (index) => {
    try {
      // Pega a licença pelo índice
      const licencaParaRemover = licencas[index];

      if (!licencaParaRemover) {
        console.error('Licença não encontrada');
        return;
      }

      // Referência do documento no Firestore
      const licencaRef = doc(
        db,
        'servidores',
        licencaParaRemover.servidor,
        'licencasMedicas',
        licencaParaRemover.id
      );

      // Deleta o documento
      await deleteDoc(licencaRef);

      // Atualiza o estado local removendo a licença
      setLicencas(licencas.filter((_, i) => i !== index));

      console.log('Licença removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover licença:', error);
    }
  };

  const calcularDiasLicenca = (licenca) => {
    // Manipula dataInicio
    const dataInicio = licenca.dataInicio
      ? typeof licenca.dataInicio === 'string'
        ? new Date(licenca.dataInicio + 'T00:00:00')
        : new Date(licenca.dataInicio.seconds * 1000)
      : null;

    // Manipula dataFim
    const dataFim = licenca.dataFim
      ? typeof licenca.dataFim === 'string'
        ? new Date(licenca.dataFim + 'T23:59:59')
        : new Date(licenca.dataFim.seconds * 1000)
      : null;

    // Calcula a diferença de dias
    return dataInicio && dataFim
      ? Math.floor(
          (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1
      : 1;
  };

  const getTotaisPorServidor = () => {
    const totais = {};

    // Inicializa os totais para cada servidor
    servidores.forEach((servidor) => {
      totais[servidor.id] = {
        servidor: servidor.nome,
        matricula: servidor.matricula,
        lotacao: servidor.lotacao,
      };

      // Inicializa contadores para cada tipo de licença
      Object.values(CATEGORIAS_LICENCA).forEach((categoria) => {
        categoria.tipos.forEach((tipo) => {
          totais[servidor.id][tipo] = 0;
        });
      });
    });

    // Conta as licenças
    licencas.forEach((licenca) => {
      if (totais[licenca.servidor]) {
        const tipoAtestado = licenca.tipoAtestado;
        if (totais[licenca.servidor][tipoAtestado] !== undefined) {
          totais[licenca.servidor][tipoAtestado]++;
        }
      }
    });

    return Object.values(totais);
  };

  const getCategoria = (tipoAtestado) => {
    if (!tipoAtestado) return 'OUTROS';

    for (const [categoria, dados] of Object.entries(CATEGORIAS_LICENCA)) {
      if (dados.tipos.includes(tipoAtestado)) {
        return categoria;
      }
    }
    return 'OUTROS';
  };

  const getServidoresComMatriculas = (servidores) => {
    // Agrupa servidores por nome
    const servidoresPorNome = servidores.reduce((acc, servidor) => {
      if (!acc[servidor.nome]) {
        acc[servidor.nome] = [];
      }
      acc[servidor.nome].push(servidor);
      return acc;
    }, {});
    // Formata o nome com matrícula se necessário
    return servidores.map((servidor) => {
      const duplicatas = servidoresPorNome[servidor.nome];
      if (duplicatas.length > 1) {
        // Se tem mais de uma matrícula, mostra a matrícula atual
        return {
          ...servidor,
          nomeExibicao: `${servidor.nome} (${servidor.matricula})`,
        };
      }
      return {
        ...servidor,
        nomeExibicao: servidor.nome,
      };
    });
  };

  const CATEGORIAS_LICENCA = {
    SAUDE: {
      titulo: 'Licenças de Saúde',
      tipos: [
        'Atestado Médico (até 3 dias)',
        'Atestado Médico',
        'Atest. Comparec. (c/ comp)',
        'Atest. Comparec. (Dec. 34023)',
        'Licença Médica / Odontológica',
        'Licença Tratamento Saúde Fora',
        'Licença Doença Pessoa Familia',
        'Doação de Sangue',
      ],
    },
    LEGAIS: {
      titulo: 'Licenças Legais',
      tipos: [
        'Licença Adoção',
        'Licença Gala / Casamento',
        'Licença Nojo / Falecimento',
        'Licença Maternidade / Gestante',
        'Licença Paternidade',
        'Licença Prêmio por Assiduidade',
        'Amamentacão',
      ],
    },
    ADMINISTRATIVAS: {
      titulo: 'Ausências Administrativas',
      tipos: [
        'Feriado',
        'Ponto Facultativo',
        'Reunião Escolar (Bimestral)',
        'Abono Anual de Ponto',
        'Férias',
        'Servico Externo',
        'Esquecimento Crachá',
        'Recesso Natal/Ano Novo c/ Comp.',
      ],
    },
    INSTITUCIONAIS: {
      titulo: 'Disposições Institucionais',
      tipos: [
        'À Disposicão do Cons.de Saúde',
        'À Disposicão da Justica',
        'À Disposicão da Corregedoria',
        'À Disposicão da SUBSAUDE',
      ],
    },
    EVENTOS: {
      titulo: 'Eventos e Participações',
      tipos: [
        'Paralisacão/Assembleia (BH-)',
        'Congresso/Conferência/Cursos',
        'Disp. p/ Votacão-Eleicões',
        'Conv SEJUS (Eleicão C.Tutelar)',
        'Folga SEJUS (Eleicão C.Tutelar)',
      ],
    },
  };

  const licencasPorCategoria = licencas.reduce((acc, licenca) => {
    const categoriaKey = getCategoria(licenca.tipoAtestado);
    const categoria = CATEGORIAS_LICENCA[categoriaKey];

    if (categoria) {
      if (!acc[categoria.titulo]) {
        acc[categoria.titulo] = [];
      }
      acc[categoria.titulo].push(licenca);
    } else {
      if (!acc['Outros']) {
        acc['Outros'] = [];
      }
      acc['Outros'].push(licenca);
    }

    return acc;
  }, {});

  useEffect(() => {
    const table = document.querySelector(`.${styles.table}`);
    const scrollContent = document.querySelector(`.${styles.scrollContent}`);

    if (table && scrollContent) {
      scrollContent.style.width = `${table.scrollWidth}px`;
    }
  }, [activeTab]); // Atualiza quando mudar de tab

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <Navbar />
      </div>
      <h1 className={styles.licencasMedicas}>Licenças Médicas</h1>

      {/* Formulário de Registro */}
      <div className={styles.content}>
        <h2 className={styles.title_principal}>Registrar Licença Médica</h2>
        <form onSubmit={handleAddLicencaMedica} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Servidor:</label>
            <select
              value={servidorSelecionado}
              onChange={(e) => setServidorSelecionado(e.target.value)}
              required
            >
              <option value="">Selecione o servidor</option>
              {getServidoresComMatriculas(servidores).map((servidor) => (
                <option key={servidor.id} value={servidor.nome}>
                  {servidor.nomeExibicao}
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
            <label>Tipo de Licença:</label>
            <div ref={dropdownRef} className={styles.dropdownContainer}>
              <button
                type="button"
                className={styles.dropdownButton}
                onClick={() => setDropdownAberto(!dropdownAberto)}
              >
                {filtroTipos.length > 0
                  ? filtroTipos.join(', ')
                  : 'Selecione os tipos'}{' '}
              </button>

              {dropdownAberto && (
                <div className={styles.dropdownMenu}>
                  {Object.entries(CATEGORIAS_LICENCA).map(
                    ([catKey, catValue]) => (
                      <div key={catKey} className={styles.dropdownCategory}>
                        <strong>{catValue.titulo}</strong>
                        {catValue.tipos.map((tipo) => (
                          <label key={tipo} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={filtroTipos.includes(tipo)}
                              onChange={() => toggleTipo(tipo)}
                            />
                            {tipo}
                          </label>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Campos para Atestado Médico */}
          {categoriaLicenca && (
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

          <button type="submit" className={styles.submitButton}>
            Registrar Licença
          </button>
        </form>
      </div>

      {/* Sistema de Tabs e Visualização */}
      <div className={styles.totaisSection}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === 'mensal' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('mensal')}
          >
            Visão Mensal
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === 'categoria' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('categoria')}
          >
            Por Categoria
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === 'totais' ? styles.activeTab : ''
            }`}
            onClick={() => setActiveTab('totais')}
          >
            Totais Gerais
          </button>
        </div>

        {/* Conteúdo da Tab Mensal */}
        {activeTab === 'mensal' && (
          <>
            <h2 className={styles.title_principal}>
              Licenças Registradas no Mês Selecionado
            </h2>
            <div className={styles.headerActions}>
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
              {mesFiltro && (
                <button
                  onClick={gerarPDFVisaoMensal}
                  className={styles.gerarPdfButton}
                >
                  Gerar PDF
                </button>
              )}
            </div>

            {!mesFiltro ? (
              <div className={styles.mensagemSemDados}>
                <p>Selecione um mês para visualizar as licenças</p>
              </div>
            ) : licencas.filter((licenca) => licenca.mes === mesFiltro)
                .length === 0 ? (
              <div className={styles.mensagemSemDados}>
                <p>Nenhuma licença registrada para o mês selecionado</p>
              </div>
            ) : (
              <div className={styles.tabelaContainer}>
                <table
                  className={styles.tableMonthly}
                  id="tabelaLicencasMedicasMes"
                >
                  {licencasFiltradas.length > 0 ? (
                    <>
                      <thead>
                        <tr>
                          <th>Servidor</th>
                          <th>Matrícula</th>
                          <th>Lotação</th>
                          <th>Tipo de Atestado</th>
                          <th>Dias</th>
                          <th className="hide-pdf">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {licencasFiltradas.map((licenca, index) => {
                          const servidor = servidores.find(
                            (s) => s.id === licenca.servidor
                          );
                          return (
                            <tr key={index}>
                              <td>
                                {servidor?.nome || 'Servidor não encontrado'}
                              </td>
                              <td>{servidor?.matricula || '-'}</td>
                              <td>{servidor?.lotacao || '-'}</td>
                              <td>{licenca.tipoAtestado}</td>
                              <td>
                                {(() => {
                                  const dataInicio = licenca.dataInicio
                                    ? new Date(
                                        licenca.dataInicio
                                      ).toLocaleDateString()
                                    : 'Data inválida';

                                  const dataFim = licenca.dataFim
                                    ? new Date(
                                        licenca.dataFim
                                      ).toLocaleDateString()
                                    : null;

                                  const diffDias = dataFim
                                    ? Math.floor(
                                        (new Date(licenca.dataFim) -
                                          new Date(licenca.dataInicio)) /
                                          (1000 * 60 * 60 * 24)
                                      ) + 1
                                    : 1;

                                  return (
                                    <>
                                      {dataInicio}{' '}
                                      {dataFim ? `a ${dataFim}` : ''} (
                                      {diffDias}{' '}
                                      {diffDias === 1 ? 'dia' : 'dias'})
                                    </>
                                  );
                                })()}
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
                    </>
                  ) : (
                    <tbody>
                      <tr>
                        <td className={styles.mensagemSemDados} colSpan="6">
                          Nenhuma licença encontrada para os tipos selecionados.
                        </td>
                      </tr>
                    </tbody>
                  )}
                </table>
              </div>
            )}
          </>
        )}

        {/* Conteúdo da Tab Categoria */}

        {activeTab === 'categoria' && (
          <>
            <h2 className={styles.title_principal}>
              Visualização por Categoria
            </h2>
            <select
              className={styles.select}
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {Object.keys(CATEGORIAS_LICENCA).map((key) => (
                <option key={key} value={key}>
                  {CATEGORIAS_LICENCA[key].titulo}
                </option>
              ))}
            </select>

            {Object.entries(licencasPorCategoria).length === 0 ? (
              <div className={styles.mensagemSemDados}>
                <p>Nenhuma licença registrada no sistema</p>
              </div>
            ) : filtroCategoria &&
              Object.entries(licencasPorCategoria).filter(
                ([titulo]) =>
                  titulo === CATEGORIAS_LICENCA[filtroCategoria].titulo
              ).length === 0 ? (
              <div className={styles.mensagemSemDados}>
                <p>Nenhuma licença registrada para a categoria selecionada</p>
              </div>
            ) : (
              <div className={styles.categoriasContainer}>
                {Object.entries(licencasPorCategoria)
                  .filter(
                    ([titulo]) =>
                      !filtroCategoria ||
                      titulo === CATEGORIAS_LICENCA[filtroCategoria].titulo
                  )
                  .map(([titulo, licencasCategoria]) => (
                    <div key={titulo} className={styles.categoriaCard}>
                      <div
                        className={styles.categoriaHeader}
                        onClick={() =>
                          setCategoriaExpandida(
                            categoriaExpandida === titulo ? null : titulo
                          )
                        }
                      >
                        <h3>{titulo}</h3>
                        <div className={styles.categoriaInfo}>
                          <span>Total: {licencasCategoria.length}</span>
                          <button className={styles.expandButton}>
                            {categoriaExpandida === titulo ? '▼' : '▶'}
                          </button>
                        </div>
                      </div>

                      {categoriaExpandida === titulo && (
                        <table className={styles.tabelaCategoria}>
                          <thead>
                            <tr>
                              <th>Servidor</th>
                              <th>Tipo</th>
                              <th>Período</th>
                              <th>Dias</th>
                            </tr>
                          </thead>
                          <tbody>
                            {licencasCategoria.map((licenca) => (
                              <tr key={licenca.id}>
                                <td>{licenca.nome}</td>
                                <td>{licenca.tipoAtestado}</td>
                                <td>
                                  {licenca.dataInicio
                                    ? `${new Date(
                                        licenca.dataInicio
                                      ).toLocaleDateString()}${
                                        licenca.dataFim
                                          ? ` a ${new Date(
                                              licenca.dataFim
                                            ).toLocaleDateString()}`
                                          : ''
                                      }`
                                    : 'Data inválida'}
                                </td>
                                <td>{calcularDiasLicenca(licenca)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </>
        )}

        {/* Conteúdo da Tab Totais */}
        {activeTab === 'totais' && (
          <>
            <h2 className={styles.title_principal}>Totais Gerais</h2>
            <div style={{ width: '100%', maxWidth: '100vw' }}>
              <div className={styles.tabelaContainer}>
                <table className={styles.table} id="tabelaLicencasMedicasTotal">
                  <thead>
                    <tr className={styles.titles}>
                      <th>Servidor</th>
                      <th>Matrícula</th>
                      <th>Lotação</th>
                      {/* Uma coluna para cada tipo de licença */}
                      {Object.values(CATEGORIAS_LICENCA).flatMap((categoria) =>
                        categoria.tipos.map((tipo) => (
                          <th key={tipo}>{tipo}</th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {getTotaisPorServidor().map((linha, index) => (
                      <tr key={index}>
                        <td>{linha.servidor}</td>
                        <td>{linha.matricula}</td>
                        <td>{linha.lotacao}</td>
                        {Object.values(CATEGORIAS_LICENCA).flatMap(
                          (categoria) =>
                            categoria.tipos.map((tipo) => (
                              <td key={tipo}>{linha[tipo] || 0}</td>
                            ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3">
                        <strong>Total Geral</strong>
                      </td>
                      {Object.values(CATEGORIAS_LICENCA).flatMap((categoria) =>
                        categoria.tipos.map((tipo) => {
                          const total = licencas.filter(
                            (licenca) => licenca.tipoAtestado === tipo
                          ).length;
                          return (
                            <td key={tipo}>
                              <strong>{total}</strong>
                            </td>
                          );
                        })
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div
                className={styles.scrollContainer}
                onScroll={(e) => {
                  // Sincroniza o scroll da tabela com a barra
                  const tableContainer = document.querySelector(
                    `.${styles.tabelaContainer}`
                  );
                  if (tableContainer) {
                    tableContainer.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
              >
                <div
                  className={styles.scrollContent}
                  style={{
                    width:
                      document.querySelector(`.${styles.table}`)?.scrollWidth ||
                      '100%',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <div>
        <ScrollToTopButton />
      </div>
    </div>
  );
};

export default LicencasMedicas;
