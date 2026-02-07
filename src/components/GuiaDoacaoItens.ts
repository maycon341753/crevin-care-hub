import { jsPDF } from 'jspdf';
import { formatBrazilianDate } from '@/lib/utils';

export interface GuiaItemData {
  protocolo?: string;
  doador_nome: string;
  doador_cpf: string;
  item_nome: string;
  quantidade: string;
  data_doacao: string;
}

export const generateGuiaDoacaoItens = (data: GuiaItemData) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header com cores de marca
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(147, 51, 234); // purple-600 (barra de destaque)
  doc.rect(0, 26, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Guia de Doação de Itens', 20, 18);

  // Chips de metadados (Data / Protocolo)
  const dataFormatada = formatBrazilianDate(data.data_doacao);
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(79, 70, 229);
  doc.setFillColor(243, 244, 255); // fundo claro
  // Data
  doc.roundedRect(20, 40, 70, 12, 2, 2, 'FD');
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Data: ${dataFormatada}`, 26, 48);
  // Protocolo
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(147, 51, 234);
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(pageWidth - 20 - 80, 40, 80, 12, 2, 2, 'FD');
  doc.setTextColor(147, 51, 234);
  doc.text(`Protocolo: ${data.protocolo ?? '—'}`, pageWidth - 20 - 74, 48);

  // Seção Dados do Doador
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Dados do Doador', 20, 70);
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setFillColor(250, 250, 250); // gray-50
  doc.roundedRect(20, 76, pageWidth - 40, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${data.doador_nome}`, 26, 85);
  doc.text(`CPF: ${data.doador_cpf}`, 26, 93);

  // Seção Itens
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Itens Doado(s)', 20, 115);
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(20, 121, pageWidth - 40, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Item: ${data.item_nome}`, 26, 130);
  doc.text(`Quantidade: ${data.quantidade}`, 26, 138);

  // Assinaturas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const assinaturaY = 170;
  // Responsável
  doc.line(20, assinaturaY, pageWidth / 2 - 10, assinaturaY);
  doc.text('Responsável', 20, assinaturaY + 8);
  // Doador
  doc.line(pageWidth / 2 + 10, assinaturaY, pageWidth - 20, assinaturaY);
  doc.text('Doador', pageWidth / 2 + 10, assinaturaY + 8);

  // Rodapé
  doc.setFillColor(243, 244, 255);
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');
  doc.setTextColor(79, 70, 229);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Documento gerado automaticamente pelo sistema CREVIN Care Hub', 20, pageHeight - 8);

  const nomeArquivo = `Guia_Doacao_Itens_${(data.protocolo ?? 'sem_protocolo').replace(/\//g, '_')}_${data.doador_nome.replace(/\s+/g, '_')}.pdf`;
  doc.save(nomeArquivo);
};