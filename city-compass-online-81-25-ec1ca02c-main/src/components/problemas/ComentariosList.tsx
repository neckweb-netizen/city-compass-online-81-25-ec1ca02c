import { ComentarioCard } from './ComentarioCard';

interface Comentario {
  id: string;
  conteudo: string;
  votos_positivos: number;
  votos_negativos: number;
  criado_em: string;
  usuario?: {
    nome: string;
  };
}

interface ComentariosListProps {
  comentarios: Comentario[];
  onVotar?: (comentarioId: string, tipoVoto: 1 | -1) => void;
  canVote?: boolean;
}

export const ComentariosList = ({ comentarios, onVotar, canVote = false }: ComentariosListProps) => {
  return (
    <div className="space-y-3">
      {comentarios.map((comentario) => (
        <ComentarioCard
          key={comentario.id}
          comentario={comentario}
          onVotar={onVotar}
          canVote={canVote}
        />
      ))}
    </div>
  );
};
