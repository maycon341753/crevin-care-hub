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

  // Cabeçalho - Logo e informações da CREVIN
  currentY = addCenteredText('COMUNIDADE DE RENOVAÇÃO, ESPERANÇA E VIDA NOVA - CREVIN - LAR DO IDOSO', currentY, 14, true);
  currentY += 5;
  
  currentY = addCenteredText('INSTITUIÇÃO FILANTRÓPICA - SEM FINS LUCRATIVOS', currentY, 10);
  currentY = addCenteredText('CNPJ: 01.600.253/0001-69 - CF/DF: 07.537.062/001-42', currentY, 10);
  currentY = addCenteredText('REGISTRO DE PESSOAS JURÍDICAS Nº 325, LIVRO A', currentY, 10);
  currentY = addCenteredText('2º OFÍCIO DE REGISTRO CIVIL DE PESSOAS JURÍDICAS - BRASÍLIA/DF', currentY, 10);
  currentY = addCenteredText('CEP: 73.330-083, QUADRA 63, LOTE 12, SETOR TRADICIONAL', currentY, 10);
  currentY = addCenteredText('UTILIDADE PÚBLICA FEDERAL - PORTARIA Nº 124, DE 14/05/2009', currentY, 10);
  
  currentY += 15;

  // Título do recibo
  currentY = addCenteredText(`RECIBO DOAÇÃO ${config.numeroRecibo}`, currentY, 16, true);
  currentY += 15;

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

  // Corpo do recibo - texto completo conforme especificação
  const textoRecibo = `Comunidade de Renovação, esperança e vida nova, também designada pela sigla CREVIN - LAR DO IDOSO, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº 01.600.253/0001-69, com sede na avenida floriano peixoto, quadra 63, lote 12, setor tradicional, CEP: 73330-083 - Planaltina - Distrito federal, nesse ato representada por sua presidente, ZÉLIA DIAS DA SILVA, recebemos do Setor _________________ a importância de ${valorFormatado} referente a doação espontânea da sociedade, para manutenção da instituição.`;

  currentY = addJustifiedText(textoRecibo, currentY);
  currentY += 15;

  // Informações da doação
  currentY = addJustifiedText(`Doador: ${doacao.doador_nome}`, currentY, 10);
  currentY = addJustifiedText(`Forma de Pagamento: ${doacao.forma_pagamento.charAt(0).toUpperCase() + doacao.forma_pagamento.slice(1)}`, currentY, 10);
  currentY += 15;

  // Declaração de veracidade
  currentY = addJustifiedText('Por ser a expressão da verdade, firmo a presente.', currentY);
  currentY += 20;

  // Data e local
  currentY = addCenteredText(`Planaltina - DF, ${dia} de ${mes} de ${ano}`, currentY);
  currentY += 30;

  // Linha para assinatura
  const lineY = currentY;
  doc.line(pageWidth / 2 - 40, lineY, pageWidth / 2 + 40, lineY);
  currentY += 10;
  currentY = addCenteredText('Presidente', currentY, 10);

  // Rodapé com informações adicionais
  currentY = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  currentY = addCenteredText('Este recibo foi gerado automaticamente pelo sistema CREVIN Care Hub', currentY, 8);
  currentY = addCenteredText(`ID da Doação: ${doacao.id}`, currentY, 8);

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