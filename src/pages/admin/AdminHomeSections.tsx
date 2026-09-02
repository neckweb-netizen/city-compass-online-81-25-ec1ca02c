import { useEffect, useState, type DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Gamepad2, LayoutList, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHomeSectionsOrder } from '@/hooks/useHomeSectionsOrder';
import { HOME_SECTIONS, isHomeSectionName, type HomeSection } from '@/lib/homeSections';

const signature = (sections: HomeSection[]) => JSON.stringify(sections.map(s => [s.section_name, s.ativo]));

export function AdminHomeSections() {
  const { sections, isLoading, isError, refetch, reorderSections } = useHomeSectionsOrder('admin');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  // A refetch must never overwrite an unsaved draft (including visibility edits).
  const [draft, setDraft] = useState<HomeSection[] | null>(null);
  const localSections = draft ?? sections ?? [];
  const hasChanges = signature(localSections) !== signature(sections ?? []);
  const hasPendingSections = localSections.some(s => s.id.startsWith('pending:'));
  const saving = reorderSections.isPending;

  useEffect(() => {
    if (!hasChanges) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasChanges]);

  const moveSection = (sectionId: string, targetIndex: number) => {
    if (saving) return;
    const index = localSections.findIndex(s => s.id === sectionId);
    if (index < 0 || targetIndex < 0 || targetIndex >= localSections.length) return;
    const next = [...localSections];
    const [removed] = next.splice(index, 1);
    next.splice(targetIndex, 0, removed);
    setDraft(next);
  };

  const handleDrop = (event: DragEvent, targetId: string) => {
    event.preventDefault();
    if (draggedItem && draggedItem !== targetId) {
      moveSection(draggedItem, localSections.findIndex(s => s.id === targetId));
    }
    setDraggedItem(null);
  };

  const save = () => {
    reorderSections.mutate(localSections, { onSuccess: () => setDraft(null) });
  };

  if (isLoading) return <div className="p-6" role="status">Carregando seções...</div>;
  if (isError && !sections) return (
    <Card><CardContent className="space-y-3 p-6">
      <p role="alert">Não foi possível carregar a configuração. Nenhuma alteração foi salva.</p>
      <Button onClick={() => void refetch()}>Tentar novamente</Button>
    </CardContent></Card>
  );

  return (
    <div className="space-y-5 pb-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Ordem das Seções</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize a página inicial, incluindo Dominó / Jogos.</p>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <Link to="/" target="_blank" rel="noopener noreferrer">Ver página inicial <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </header>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        Arraste os cards ou use as setas. Ative ou desative as seções e clique em <strong className="text-foreground">Salvar alterações</strong>.
        Seções sem conteúdo disponível podem não aparecer, mesmo estando ativadas. Ocultar uma seção não apaga seus dados.
      </div>

      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
        <p role="status" className="text-sm text-muted-foreground">
          {hasChanges ? 'Alterações ainda não salvas' : hasPendingSections ? 'Há seções novas para cadastrar' : 'Configuração salva'}
          <span className="ml-2">· {localSections.filter(s => s.ativo).length} ativas de {localSections.length}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {hasChanges && <Button variant="outline" disabled={saving} onClick={() => setDraft(null)}>Descartar</Button>}
          <Button onClick={save} disabled={saving || (!hasChanges && !hasPendingSections)}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </div>

      {isError && <p role="alert" className="text-sm text-destructive">A atualização da lista falhou. Seu rascunho foi mantido. Confira sua conexão antes de salvar.</p>}

      <div className="space-y-3">
        {localSections.map((section, index) => {
          const definition = isHomeSectionName(section.section_name) ? HOME_SECTIONS[section.section_name] : null;
          const title = section.section_name === 'stats_section' ? HOME_SECTIONS.stats_section.name : section.display_name;
          return (
            <Card key={section.id} data-section-name={section.section_name}
              className={`transition-opacity ${draggedItem === section.id ? 'opacity-50' : ''} ${section.ativo ? 'border-primary/25' : 'bg-muted/20'}`}
              draggable={!saving}
              onDragStart={(event) => {
                if (saving) { event.preventDefault(); return; }
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', section.id);
                setDraggedItem(section.id);
              }}
              onDragEnd={() => setDraggedItem(null)}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
              onDrop={(event) => handleDrop(event, section.id)}
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <GripVertical aria-hidden="true" className="mt-2 hidden h-5 w-5 shrink-0 cursor-grab text-muted-foreground sm:block" />
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    {section.section_name === 'jogos' ? <Gamepad2 className="h-5 w-5" /> : <LayoutList className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {definition?.description ?? 'Seção sem componente correspondente na versão atual. Sua configuração será preservada, mas não será exibida na inicial.'}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {section.id.startsWith('pending:') ? 'Nova seção · será cadastrada ao salvar' : section.atualizado_em ? `Atualizada em ${new Date(section.atualizado_em).toLocaleString('pt-BR')}` : 'Configuração existente'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 border-t pt-3 sm:border-0 sm:pt-0">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" aria-label={`Mover ${title} para cima`} disabled={saving || index === 0} onClick={() => moveSection(section.id, index - 1)}><ChevronUp className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" aria-label={`Mover ${title} para baixo`} disabled={saving || index === localSections.length - 1} onClick={() => moveSection(section.id, index + 1)}><ChevronDown className="h-4 w-4" /></Button>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    {section.ativo ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <span>{section.ativo ? 'Visível' : 'Oculta'}</span>
                    <Switch aria-label={`Exibir ${title}`} checked={section.ativo} disabled={saving || !definition}
                      onCheckedChange={(ativo) => setDraft(localSections.map(s => s.id === section.id ? { ...s, ativo } : s))} />
                  </label>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
