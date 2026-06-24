
import { EmpresaCuponsList } from './EmpresaCuponsList';

interface EmpresaCuponsProps {
  empresaId: string;
  isOwner?: boolean;
}

export const EmpresaCupons = ({ empresaId, isOwner = false }: EmpresaCuponsProps) => {
  return <EmpresaCuponsList empresaId={empresaId} isOwner={isOwner} />;
};
