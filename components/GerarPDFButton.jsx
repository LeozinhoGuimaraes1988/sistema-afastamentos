import React, { useRef } from 'react';
import styles from '../components/GerarPDFButton.module.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const GerarPDFButton = ({ dadosFiltrados }) => {
  const gerarPDF = () => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
      alert('Não há dados para gerar o PDF.');
      return;
    }

    const pdf = new jsPDF({
      orientation: 'landscape', // Orientação horizontal
      unit: 'mm',
      format: 'a4', // Tamanho padrão A4
    });

    // Adiciona título ao PDF
    pdf.setFontSize(14);
    pdf.text('Relatório de Afastamentos', 10, 10); // Texto no topo do PDF

    // Define as colunas da tabela
    const colunas = [
      { header: 'Nome', dataKey: 'nome' },
      { header: 'Cargo', dataKey: 'cargo' },
      { header: 'Lotação', dataKey: 'lotacao' },
      { header: 'Matrícula', dataKey: 'matricula' },
      { header: 'Férias', dataKey: 'ferias' },
      { header: 'Abonos', dataKey: 'abonos' },
      { header: 'Licenças-Prêmio', dataKey: 'licencasPremio' },
    ];

    // Processa os dados para a tabela
    const linhas = dadosFiltrados.map((servidor) => {
      // Processa períodos de férias
      const ferias = servidor.periodos
        ? servidor.periodos
            .filter((p) => p.tipo === 'ferias')
            .map((periodo) => {
              const dataInicio = periodo.dataInicio
                ? typeof periodo.dataInicio === 'string'
                  ? new Date(periodo.dataInicio + 'T00:00:00')
                  : new Date(periodo.dataInicio.seconds * 1000)
                : null;

              const dataFim = periodo.dataFim
                ? typeof periodo.dataFim === 'string'
                  ? new Date(periodo.dataFim + 'T23:59:59')
                  : new Date(periodo.dataFim.seconds * 1000)
                : null;

              return `${
                dataInicio?.toLocaleDateString() || 'Data inválida'
              } a ${dataFim?.toLocaleDateString() || 'Data inválida'}`;
            })
            .join(', ')
        : 'Sem períodos de férias registrados';

      // Processa abonos
      const abonos = servidor.periodos
        ? servidor.periodos
            .filter((p) => p.tipo === 'abono')
            .map((p) => {
              const dataAbono = p.data
                ? typeof p.data === 'string'
                  ? new Date(p.data + 'T00:00:00')
                  : new Date(p.data.seconds * 1000)
                : null;

              return dataAbono?.toLocaleDateString() || 'Data inválida';
            })
            .join(', ')
        : 'Sem abonos registrados';

      // Processa licenças-prêmio
      const licencasPremio = servidor.periodos
        ? servidor.periodos
            .filter((p) => p.tipo === 'licenca-premio')
            .map((p) => {
              const dataInicio = p.dataInicio
                ? typeof p.dataInicio === 'string'
                  ? new Date(p.dataInicio + 'T00:00:00')
                  : new Date(p.dataInicio.seconds * 1000)
                : null;

              const dataFim = p.dataFim
                ? typeof p.dataFim === 'string'
                  ? new Date(p.dataFim + 'T23:59:59')
                  : new Date(p.dataFim.seconds * 1000)
                : null;

              return `${
                dataInicio?.toLocaleDateString() || 'Data inválida'
              } a ${dataFim?.toLocaleDateString() || 'Data inválida'}`;
            })
            .join(', ')
        : 'Sem licenças-prêmio registradas';

      return {
        nome: servidor.nome,
        cargo: servidor.cargo,
        lotacao: servidor.lotacao,
        matricula: servidor.matricula,
        ferias: ferias || 'Sem afastamento registrado',
        abonos: abonos || 'Sem afastamento registrado',
        licencasPremio: licencasPremio || 'Sem afastamento registrado',
      };
    });

    // Adiciona a tabela ao PDF
    pdf.autoTable({
      head: [colunas.map((col) => col.header)], // Cabeçalhos
      body: linhas.map((linha) =>
        colunas.map((col) => linha[col.dataKey] || '')
      ), // Dados
      startY: 20, // Posição inicial da tabela
      margin: { left: 10, right: 10 }, // Margens laterais
      theme: 'grid', // Estilo de tabela
    });

    // Salva o arquivo PDF
    pdf.save('relatorio_afastamentos.pdf');
  };

  return (
    <button onClick={gerarPDF} className={styles.gerarPdfButton}>
      Gerar PDF
    </button>
  );
};

export default GerarPDFButton;
