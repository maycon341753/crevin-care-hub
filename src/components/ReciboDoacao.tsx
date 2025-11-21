import { jsPDF } from 'jspdf';

interface DoacaoData {
  id: string;
  doador_nome: string;
  valor: number;
  data_doacao: string;
  forma_pagamento: string;
}

interface ReciboConfig {
  numeroRecibo: string;
  presidente?: string;
  setor?: string;
}

export const generateReciboDoacao = (doacao: DoacaoData, config: ReciboConfig) => {
  const doc = new jsPDF();
  
  // Configurações do documento
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 8;
  let currentY = 30;

  // Função para adicionar texto centralizado
  const addCenteredText = (text: string, y: number, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
    return y + lineHeight;
  };

  // Função para adicionar texto justificado
  const addJustifiedText = (text: string, y: number, fontSize = 11) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
    doc.text(lines, margin, y);
    return y + (lines.length * lineHeight);
  };

  // Cabeçalho estilizado com cores de marca
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(147, 51, 234); // purple-600 (barra de destaque)
  doc.rect(0, 26, pageWidth, 4, 'F');
  doc.setTextColor(255, 255, 255);
  currentY = 18;
  currentY = addCenteredText('COMUNIDADE DE RENOVAÇÃO, ESPERANÇA E VIDA NOVA - CREVIN - LAR DO IDOSO', currentY, 12, true);
  doc.setTextColor(255, 255, 255);
  currentY = addCenteredText('INSTITUIÇÃO FILANTRÓPICA - SEM FINS LUCRATIVOS', currentY, 9);
  currentY += 10;

  // Título do recibo + chip com número
  doc.setTextColor(0, 0, 0);
  currentY = addCenteredText('RECIBO DE DOAÇÃO', currentY, 16, true);
  // Chip do número do recibo
  doc.setDrawColor(79, 70, 229);
  doc.setFillColor(243, 244, 255);
  const chipWidth = 90;
  const chipX = (pageWidth - chipWidth) / 2;
  doc.roundedRect(chipX, currentY + 4, chipWidth, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text(`Recibo nº ${config.numeroRecibo}`, chipX + 6, currentY + 12);
  currentY += 25;

  // Formatação da data
  const dataDoacao = new Date(doacao.data_doacao);
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const dia = dataDoacao.getDate().toString().padStart(2, '0');
  const mes = meses[dataDoacao.getMonth()];
  const ano = dataDoacao.getFullYear();

  // Formatação do valor
  const valorFormatado = doacao.valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  // Corpo do recibo em box estilizado
  const textoRecibo = `Comunidade de Renovação, esperança e vida nova, também designada pela sigla CREVIN - LAR DO IDOSO, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº 01.600.253/0001-69, com sede na avenida floriano peixoto, quadra 63, lote 12, setor tradicional, CEP: 73330-083 - Planaltina - Distrito Federal, nesse ato representada por sua presidente, ZÉLIA DIAS DA SILVA, recebemos do Setor _________________ a importância de ${valorFormatado} referente à doação espontânea da sociedade, para manutenção da instituição.`;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, currentY - 6, pageWidth - margin * 2, 40, 2, 2, 'FD');
  currentY = addJustifiedText(textoRecibo, currentY, 11);
  currentY += 10;

  // Informações da doação com labels (robusto para valores ausentes)
  const doadorNome = (doacao.doador_nome ?? '').trim() || 'Anônimo';
  const formaPagamentoRaw = (doacao.forma_pagamento ?? '').trim();
  const formaPagamentoFmt = formaPagamentoRaw
    ? formaPagamentoRaw.charAt(0).toUpperCase() + formaPagamentoRaw.slice(1)
    : 'Não informado';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Doador:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(doadorNome, margin + 28, currentY);
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Forma de Pagamento:', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formaPagamentoFmt, margin + 58, currentY);
  currentY += 15;

  // Declaração de veracidade
  currentY = addJustifiedText('Por ser a expressão da verdade, firmo a presente.', currentY);
  currentY += 20;

  // Data e local
  currentY = addCenteredText(`Planaltina - DF, ${dia} de ${mes} de ${ano}`, currentY);
  currentY += 30;

  // Assinatura estilizada
  const lineY = currentY;
  doc.line(pageWidth / 2 - 40, lineY, pageWidth / 2 + 40, lineY);
  currentY += 10;
  currentY = addCenteredText('Presidente', currentY, 10);

  // Rodapé estilizado
  doc.setFillColor(243, 244, 255);
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(79, 70, 229);
  doc.text('Este recibo foi gerado automaticamente pelo sistema CREVIN Care Hub', margin, pageHeight - 8);
  doc.setTextColor(147, 51, 234);
  doc.text(`ID da Doação: ${doacao.id}`, pageWidth - margin - 60, pageHeight - 8);

  // Gerar nome do arquivo
  const nomeArquivo = `Recibo_Doacao_${config.numeroRecibo.replace(/\//g, '_')}_${doacao.doador_nome.replace(/\s+/g, '_')}.pdf`;

  // Salvar o PDF
  doc.save(nomeArquivo);
};

// Função para gerar número do recibo automaticamente
export const generateNumeroRecibo = (): string => {
  const agora = new Date();
  const ano = agora.getFullYear();
  
  // Buscar último número usado no localStorage ou começar do 1
  const chaveStorage = `ultimo_recibo_${ano}`;
  const ultimoNumero = parseInt(localStorage.getItem(chaveStorage) || '0');
  const novoNumero = ultimoNumero + 1;
  
  // Salvar novo número no localStorage
  localStorage.setItem(chaveStorage, novoNumero.toString());
  
  // Formatar número com zeros à esquerda
  const numeroFormatado = novoNumero.toString().padStart(3, '0');
  
  return `${numeroFormatado}/${ano}`;
};