
import { EmpresaEventosList } from './EmpresaEventosList';
import { useAuth } from '@/hooks/useAuth';
import { useParams } from 'react-router-dom';
import { useEmpresaById } from '@/hooks/useEmpresas';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';

export const EmpresaEventos = () => {
  const { user } = useAuth();
  const params = useParams<{ id?: string; slug?: string }>();
  const empresaParam = params.id || params.slug;
  const { data: empresa } = useEmpresaById(empresaParam);
  const { empresa: minhaEmpresa } = useMinhaEmpresa();

  // Se não há parâmetro (dashboard próprio), usa a empresa do usuário logado
  const empresaAtual = empresaParam ? empresa : minhaEmpresa;

  // Verifica se o usuário é proprietário da empresa
  // Para dashboard próprio (/empresa-dashboard), sempre considera owner se há empresa
  const isOwner = user && empresaAtual && (
    empresaAtual.usuario_id === user.id || 
    (!empresaParam && !!minhaEmpresa) // Se está no dashboard próprio e tem empresa
  );

  if (!empresaAtual) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Carregando...
        </p>
      </div>
    );
  }

  return <EmpresaEventosList empresaId={empresaAtual.id} isOwner={isOwner} />;
};
