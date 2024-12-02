import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './GerarPDFButton.module.css'; // Crie um arquivo CSS para estilizar o botão, se necessário.

const GerarPDFButton = ({ tabelaId = 'tabela.pdf' }) => {
  const tabelaRef = useRef(null);

  const gerarPDF = async () => {
    const tabela = document.getElementById(tabelaId);
    if (!tabela) {
      return;
    }

    const hiddenElements = tabela.querySelectorAll('.hide-pdf');
    hiddenElements.forEach((el) => (el.style.display = 'none'));

    const canvas = await html2canvas(tabela, {
      scale: 2, // Aumentar a resolução
    });

    hiddenElements.forEach((el) => (el.style.display = ''));
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    });

    const margin = 20; // Margem em pixels
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 2 * margin; // Ajustar a largura considerando as margens
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // Manter a proporção

    if (imgHeight > pageHeight - 2 * margin) {
      // Caso a altura ultrapasse o limite da página
      const scaledHeight = pageHeight - 2 * margin;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      pdf.addImage(
        imgData,
        'PNG',
        (pageWidth - scaledWidth) / 2, // Centralizar horizontalmente
        margin,
        scaledWidth,
        scaledHeight
      );
    } else {
      // Quando a imagem se ajusta à altura disponível
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        (pageHeight - imgHeight) / 2, // Centralizar verticalmente
        imgWidth,
        imgHeight
      );
    }

    pdf.save('tabela.pdf');
  };

  return (
    <button className={styles.gerarPdfButton} onClick={gerarPDF}>
      Gerar PDF
    </button>
  );
};

export default GerarPDFButton;
