import { format } from 'date-fns';
import ptBr from 'date-fns/locale/pt';

export const dateFormat = (date: Date): string => {
  return format(date, `dd MMM yyyy`, { locale: ptBr });
};
