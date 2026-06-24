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