import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateSeparateInputProps {
  id?: string;
  label?: string;
  value: string; // Formato ISO (yyyy-mm-dd)
  onChange: (value: string) => void; // Retorna formato ISO
  required?: boolean;
  className?: string;
}

const DateSeparateInput: React.FC<DateSeparateInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  className = ""
}) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Converte data ISO para campos separados
  useEffect(() => {
    if (value && value.includes('-')) {
      const [yearPart, monthPart, dayPart] = value.split('-');
      setDay(dayPart || '');
      setMonth(monthPart || '');
      setYear(yearPart || '');
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  // Atualiza o valor quando os campos mudam
  const updateValue = (newDay: string, newMonth: string, newYear: string) => {
    if (newDay && newMonth && newYear && newYear.length === 4) {
      // Valida se a data é válida
      const date = new Date(parseInt(newYear), parseInt(newMonth) - 1, parseInt(newDay));
      if (date.getFullYear() == parseInt(newYear) && 
          date.getMonth() == parseInt(newMonth) - 1 && 
          date.getDate() == parseInt(newDay)) {
        const isoDate = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
        onChange(isoDate);
      } else {
        onChange(''); // Data inválida
      }
    } else {
      onChange(''); // Campos incompletos
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDay = e.target.value.replace(/\D/g, '').substring(0, 2);
    if (parseInt(newDay) <= 31) {
      setDay(newDay);
      updateValue(newDay, month, year);
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    updateValue(day, newMonth, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = e.target.value.replace(/\D/g, '').substring(0, 4);
    setYear(newYear);
    updateValue(day, month, newYear);
  };

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id}>
          {label} {required && '*'}
        </Label>
      )}
      <div className="grid grid-cols-3 gap-2 mt-1">
        <div>
          <Input
            id={`${id}_day`}
            type="text"
            value={day}
            onChange={handleDayChange}
            placeholder="Dia"
            maxLength={2}
            className="text-center"
          />
          <Label className="text-xs text-muted-foreground text-center block mt-1">
            Dia
          </Label>
        </div>
        
        <div>
          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((monthOption) => (
                <SelectItem key={monthOption.value} value={monthOption.value}>
                  {monthOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs text-muted-foreground text-center block mt-1">
            Mês
          </Label>
        </div>
        
        <div>
          <Input
            id={`${id}_year`}
            type="text"
            value={year}
            onChange={handleYearChange}
            placeholder="Ano"
            maxLength={4}
            className="text-center"
          />
          <Label className="text-xs text-muted-foreground text-center block mt-1">
            Ano
          </Label>
        </div>
      </div>
    </div>
  );
};

export default DateSeparateInput;