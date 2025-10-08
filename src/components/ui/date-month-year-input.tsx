import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateMonthYearInputProps {
  id?: string;
  label?: string;
  value: string; // ISO (yyyy-mm-dd)
  onChange: (value: string) => void; // returns ISO
  required?: boolean;
  className?: string;
}

const DateMonthYearInput: React.FC<DateMonthYearInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  className = ""
}) => {
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (value && value.includes('-')) {
      const [yearPart, monthPart] = value.split('-');
      setMonth(monthPart || '');
      setYear(yearPart || '');
    } else {
      setMonth('');
      setYear('');
    }
  }, [value]);

  const updateValue = (newMonth: string, newYear: string) => {
    if (newMonth && newYear && newYear.length === 4) {
      const isoDate = `${newYear}-${newMonth.padStart(2, '0')}-01`;
      onChange(isoDate);
    } else {
      onChange('');
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    updateValue(newMonth, year);
  };

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    updateValue(month, newYear);
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

  const years = Array.from({ length: 120 }, (_, i) => `${new Date().getFullYear() - i}`);

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id}>
          {label} {required && '*'}
        </Label>
      )}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div>
          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger>
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs text-muted-foreground text-center block mt-1">
            Mês
          </Label>
        </div>

        <div>
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger>
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs text-muted-foreground text-center block mt-1">
            Ano
          </Label>
        </div>
      </div>
    </div>
  );
};

export default DateMonthYearInput;