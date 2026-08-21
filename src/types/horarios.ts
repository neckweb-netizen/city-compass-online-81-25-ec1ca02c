export interface HorarioFuncionamento {
  [key: string]: {
    aberto: boolean;
    abertura: string;
    fechamento: string;
  };
}

export const diasSemana = [
  { key: 'segunda', nome: 'Segunda-feira' },
  { key: 'terca', nome: 'Terça-feira' },
  { key: 'quarta', nome: 'Quarta-feira' },
  { key: 'quinta', nome: 'Quinta-feira' },
  { key: 'sexta', nome: 'Sexta-feira' },
  { key: 'sabado', nome: 'Sábado' },
  { key: 'domingo', nome: 'Domingo' },
];

const googleDayKeys = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

export const criarHorarioPadrao = (aberto = true): HorarioFuncionamento =>
  Object.fromEntries(
    diasSemana.map(({ key }) => [key, { aberto, abertura: '08:00', fechamento: '18:00' }]),
  );

const formatGoogleTime = (value: unknown, fallback: string) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length !== 4) return fallback;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const normalizarHorarioFuncionamento = (
  value: unknown,
  defaultOpen = false,
): HorarioFuncionamento => {
  const source = value && typeof value === 'object' ? value as Record<string, any> : {};
  const normalized = criarHorarioPadrao(defaultOpen);
  const hasSystemFormat = diasSemana.some(({ key }) => source[key]);

  if (hasSystemFormat) {
    diasSemana.forEach(({ key }) => {
      const schedule = source[key];
      if (!schedule || typeof schedule !== 'object') return;
      normalized[key] = {
        aberto: Boolean(schedule.aberto ?? schedule.ativo),
        abertura: String(schedule.abertura || '08:00'),
        fechamento: String(schedule.fechamento || '18:00'),
      };
    });
    return normalized;
  }

  const periods = Array.isArray(source.periods) ? source.periods : [];
  if (periods.length > 0) {
    Object.keys(normalized).forEach((key) => { normalized[key].aberto = false; });
    periods.forEach((period: any) => {
      const day = Number(period?.open?.day);
      const key = googleDayKeys[day];
      if (!key) return;

      const opening = formatGoogleTime(period?.open?.time, '00:00');
      const closing = formatGoogleTime(period?.close?.time, '23:59');
      const current = normalized[key];
      normalized[key] = {
        aberto: true,
        abertura: current.aberto && current.abertura < opening ? current.abertura : opening,
        fechamento: current.aberto && current.fechamento > closing ? current.fechamento : closing,
      };
    });
    return normalized;
  }

  const weekdayText = Array.isArray(source.weekday_text) ? source.weekday_text : [];
  if (weekdayText.length > 0) {
    Object.keys(normalized).forEach((key) => { normalized[key].aberto = false; });
    weekdayText.forEach((line: unknown) => {
      const text = String(line).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const key = diasSemana.find(({ key: dayKey }) => text.startsWith(dayKey))?.key;
      if (!key || text.includes('fechado')) return;
      if (text.includes('24 horas')) {
        normalized[key] = { aberto: true, abertura: '00:00', fechamento: '23:59' };
        return;
      }
      const times = [...text.matchAll(/(\d{1,2}):(\d{2})/g)].map((match) => `${match[1].padStart(2, '0')}:${match[2]}`);
      if (times.length >= 2) normalized[key] = { aberto: true, abertura: times[0], fechamento: times[times.length - 1] };
    });
  }

  return normalized;
};
