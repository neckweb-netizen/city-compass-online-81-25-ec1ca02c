
import { ProdutosList } from './ProdutosList';

interface EmpresaProdutosProps {
  empresaId: string;
}

export const EmpresaProdutos = ({ empresaId }: EmpresaProdutosProps) => {
  return <ProdutosList empresaId={empresaId} />;
};
