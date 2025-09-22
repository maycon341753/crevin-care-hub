import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar CPF
export const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Função para formatar telefone
export const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

// Função para formatar valor monetário brasileiro (entrada com vírgula)
export const formatCurrencyInput = (value: string): string => {
  // Remove tudo que não é dígito ou vírgula
  let numbers = value.replace(/[^\d,]/g, '');
  
  // Garante que só há uma vírgula
  const parts = numbers.split(',');
  if (parts.length > 2) {
    numbers = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limita a 2 casas decimais após a vírgula
  if (parts.length === 2 && parts[1].length > 2) {
    numbers = parts[0] + ',' + parts[1].substring(0, 2);
  }
  
  return numbers;
};

// Função para converter valor brasileiro (com vírgula) para número
export const parseBrazilianCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove espaços e substitui vírgula por ponto
  const cleanValue = value.trim().replace(',', '.');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Função para formatar número para exibição brasileira (com vírgula)
export const formatBrazilianCurrency = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};

// Função para validar formato de moeda brasileira
export const isValidBrazilianCurrency = (value: string): boolean => {
  if (!value) return true; // Campo vazio é válido
  
  // Regex para formato brasileiro: números opcionais, vírgula opcional, até 2 dígitos decimais
  const regex = /^\d+(?:,\d{1,2})?$/;
  return regex.test(value.trim());
};

// Função para formatar salário com separador de milhares (3.795,00)
export const formatSalaryInput = (value: string): string => {
  // Remove tudo que não é dígito ou vírgula
  let numbers = value.replace(/[^\d,]/g, '');
  
  // Garante que só há uma vírgula
  const parts = numbers.split(',');
  if (parts.length > 2) {
    numbers = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limita a 2 casas decimais após a vírgula
  if (parts.length === 2 && parts[1].length > 2) {
    numbers = parts[0] + ',' + parts[1].substring(0, 2);
  }
  
  // Adiciona separador de milhares na parte inteira
  if (parts[0]) {
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    numbers = integerPart + (parts[1] !== undefined ? ',' + parts[1] : '');
  }
  
  return numbers;
};

// Função para converter salário brasileiro para número
export const parseBrazilianSalary = (value: string): number => {
  if (!value) return 0;
  
  // Remove pontos (separadores de milhares) e substitui vírgula por ponto
  const cleanValue = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(cleanValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Função para formatar número para exibição de salário brasileiro (3.795,00)
export const formatBrazilianSalary = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função para validar formato de salário brasileiro
export const isValidBrazilianSalary = (value: string): boolean => {
  if (!value) return false;
  const regex = /^\d{1,3}(\.\d{3})*,\d{2}$/;
  return regex.test(value);
};

// Função para formatar data no padrão brasileiro DD/MM/AAAA
export const formatBrazilianDate = (date: string | Date): string => {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    // Se a data está no formato YYYY-MM-DD (sem timezone), trata como data local
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11 para meses
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Função para converter data do formato DD/MM/AAAA para ISO (AAAA-MM-DD)
export const parseBrazilianDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Se já está no formato ISO, retorna como está
  if (dateString.includes('-') && dateString.length === 10) {
    return dateString;
  }
  
  // Se está no formato DD/MM/AAAA, converte para ISO
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateString;
};
