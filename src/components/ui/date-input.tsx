import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder = "dd/mm/aaaa",
  className = ""
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Converte data ISO para formato brasileiro (dd/mm/yyyy)
  const formatToBrazilian = (isoDate: string): string => {
    if (!isoDate) return '';
    
    // Parse manual para evitar problemas de fuso horário
    const parts = isoDate.split('-');
    if (parts.length !== 3) return '';
    
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    
    // Valida se são números válidos
    if (isNaN(parseInt(year)) || isNaN(parseInt(month)) || isNaN(parseInt(day))) return '';
    
    return `${day}/${month}/${year}`;
  };

  // Converte formato brasileiro para ISO (yyyy-mm-dd)
  const formatToISO = (brazilianDate: string): string => {
    if (!brazilianDate) return '';
    
    // Remove caracteres não numéricos
    const numbers = brazilianDate.replace(/\D/g, '');
    
    if (numbers.length === 8) {
      const day = numbers.substring(0, 2);
      const month = numbers.substring(2, 4);
      const year = numbers.substring(4, 8);
      
      // Valida se a data é válida
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (date.getFullYear() == parseInt(year) && 
          date.getMonth() == parseInt(month) - 1 && 
          date.getDate() == parseInt(day)) {
        return `${year}-${month}-${day}`;
      }
    }
    
    return '';
  };

  // Aplica máscara dd/mm/yyyy
  const applyMask = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.substring(0, 2)}/${numbers.substring(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}/${numbers.substring(4, 8)}`;
    }
    
    return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}/${numbers.substring(4, 8)}`;
  };

  // Atualiza o valor de exibição quando o valor prop muda
  useEffect(() => {
    if (value) {
      setDisplayValue(formatToBrazilian(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const maskedValue = applyMask(inputValue);
    
    setDisplayValue(maskedValue);
    
    // Converte para ISO e chama onChange apenas se a data for válida
    const isoValue = formatToISO(maskedValue);
    onChange(isoValue);
  };

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id}>
          {label} {required && '*'}
        </Label>
      )}
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        maxLength={10}
      />
    </div>
  );
};

export default DateInput;