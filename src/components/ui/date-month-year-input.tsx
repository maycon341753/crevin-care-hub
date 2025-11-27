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
  const [day, setDay] = useState('');

  useEffect(() => {
    if (value && value.includes('-')) {
      const [yearPart, monthPart, dayPart] = value.split('-');
      setMonth(monthPart || '');
      setYear(yearPart || '');
      setDay(dayPart || '');
    } else {
      setMonth('');
      setYear('');
      setDay('');
    }
  }, [value]);

  const updateValue = (newMonth: string, newYear: string, newDay: string) => {
    if (newMonth && newYear && newDay && newYear.length === 4) {
      const isoDate = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
      onChange(isoDate);
    } else {
      onChange('');
    }
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    const maxDays = year && newMonth ? new Date(Number(year), Number(newMonth), 0).getDate() : 31;
    const adjustedDay = day && Number(day) > maxDays ? String(maxDays).padStart(2, '0') : day;
    if (adjustedDay !== day) setDay(adjustedDay);
    updateValue(newMonth, year, adjustedDay);
  };

  const handleYearChange = (newYear: string) => {
    setYear(newYear);
    const maxDays = newYear && month ? new Date(Number(newYear), Number(month), 0).getDate() : 31;
    const adjustedDay = day && Number(day) > maxDays ? String(maxDays).padStart(2, '0') : day;
    if (adjustedDay !== day) setDay(adjustedDay);
    updateValue(month, newYear, adjustedDay);
  };

  const handleDayChange = (newDay: string) => {
    setDay(newDay);
    updateValue(month, year, newDay);
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
  const maxDays = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id}>
          {label} {required && '*'}
        </Label>
      )}
      <div className="grid grid-cols-3 gap-2 mt-1">
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

        <div>
          <Select value={day} onValueChange={handleDayChange}>
            <SelectTrigger>
              <SelectValue placeholder="Dia" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs text-muted-foreground text-center block mt-1">
            Dia
          </Label>
        </div>
      </div>
    </div>
  );
};

export default DateMonthYearInput;
