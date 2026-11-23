import { GeradorCobranca } from './GeradorCobranca';

// Mantém a rota de Gestão de Cobranças e seu banner próprio,
// reutilizando a validação e os fluxos seguros do gerador manual.
export const GestaoCobrancas = () => <GeradorCobranca bannerSecao="gestao_cobrancas" />;

export default GestaoCobrancas;
