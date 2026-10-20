import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bike,
  Droplets,
  Flame,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';

type QuickCategory = 'moto-taxi' | 'gas-agua';

interface CategoryRow {
  id: string;
  nome: string;
  slug: string;
}

interface CompanyRow {
  id: string;
  nome: string;
  slug: string | null;
  endereco: string | null;
  telefone: string | null;
  categoria_id: string;
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const identifyCategory = (category: CategoryRow): QuickCategory | null => {
  const normalized = normalizeText(`${category.nome} ${category.slug || ''}`);
  const compact = normalized.replace(/\s/g, '');

  if (compact.includes('mototaxi')) return 'moto-taxi';
  if (normalized.includes('gas') && normalized.includes('agua')) return 'gas-agua';
  return null;
};

const normalizeBrazilianPhone = (value: string | null) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits;
  return null;
};

const CompanyContactCard = ({ company }: { company: CompanyRow }) => {
  const contact = normalizeBrazilianPhone(company.telefone);
  const message = encodeURIComponent(`Olá! Encontrei ${company.nome} no Chame Aqui do SAJ TEM.`);

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Store className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <Link
            to={`/local/${company.slug || company.id}`}
            className="line-clamp-2 font-bold text-foreground transition-colors hover:text-primary"
          >
            {company.nome}
          </Link>

          {company.endereco && (
            <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{company.endereco}</span>
            </p>
          )}

          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Phone className="h-3.5 w-3.5 text-primary" />
            {company.telefone}
          </p>
        </div>
      </div>

      {contact && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button asChild size="sm" className="min-h-11 bg-emerald-600 text-white hover:bg-emerald-700">
            <a
              href={`https://wa.me/${contact}?text=${message}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chamar ${company.nome} pelo WhatsApp`}
            >
              <MessageCircle className="mr-1.5 h-4 w-4" />
              WhatsApp
            </a>
          </Button>

          <Button asChild size="sm" variant="outline" className="min-h-11">
            <a href={`tel:+${contact}`} aria-label={`Ligar para ${company.nome}`}>
              <Phone className="mr-1.5 h-4 w-4" />
              Ligar
            </a>
          </Button>
        </div>
      )}
    </article>
  );
};

const EmptyCategory = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
    <Store className="mx-auto mb-3 h-9 w-9 text-muted-foreground/60" />
    <p className="font-semibold text-foreground">Nenhuma empresa disponível em {label}</p>
    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
      Assim que a categoria for criada e uma empresa ativa com telefone for vinculada, ela aparecerá aqui automaticamente.
    </p>
  </div>
);

export const ChameAquiButton = () => {
  const [open, setOpen] = useState(false);
  const { data: city } = useCidadePadrao();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['chame-aqui', city?.id],
    enabled: open && Boolean(city?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const cityId = city?.id;
      if (!cityId) {
        return {
          companies: [] as CompanyRow[],
          categoryGroups: { 'moto-taxi': [], 'gas-agua': [] } as Record<QuickCategory, string[]>,
        };
      }

      const { data: categories, error: categoriesError } = await supabase
        .from('categorias')
        .select('id, nome, slug')
        .eq('ativo', true)
        .order('nome');

      if (categoriesError) throw categoriesError;

      const categoryGroups = (categories || []).reduce<Record<QuickCategory, string[]>>(
        (groups, category) => {
          const type = identifyCategory(category as CategoryRow);
          if (type) groups[type].push(category.id);
          return groups;
        },
        { 'moto-taxi': [], 'gas-agua': [] },
      );

      const categoryIds = [...categoryGroups['moto-taxi'], ...categoryGroups['gas-agua']];
      if (categoryIds.length === 0) {
        return { companies: [] as CompanyRow[], categoryGroups };
      }

      const { data: companies, error: companiesError } = await supabase
        .from('empresas')
        .select('id, nome, slug, endereco, telefone, categoria_id')
        .eq('cidade_id', cityId)
        .eq('ativo', true)
        .eq('status_aprovacao', 'aprovado')
        .in('categoria_id', categoryIds)
        .not('telefone', 'is', null)
        .neq('telefone', '')
        .order('destaque', { ascending: false })
        .order('nome');

      if (companiesError) throw companiesError;
      const companiesWithValidContact = ((companies || []) as CompanyRow[]).filter((company) =>
        normalizeBrazilianPhone(company.telefone),
      );

      return { companies: companiesWithValidContact, categoryGroups };
    },
  });

  const companies = data?.companies || [];
  const motoTaxiCompanies = companies.filter((company) =>
    data?.categoryGroups['moto-taxi'].includes(company.categoria_id),
  );
  const gasWaterCompanies = companies.filter((company) =>
    data?.categoryGroups['gas-agua'].includes(company.categoria_id),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700">
          <PhoneCall className="mr-2 h-4 w-4" />
          Chame aqui
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto p-0">
        <div className="border-b border-border/60 bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-primary/10 px-5 py-5 sm:px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <PhoneCall className="h-5 w-5" />
              </span>
              Chame aqui
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm">
              Encontre serviços rápidos em {city?.nome || 'Santo Antônio de Jesus'} e fale diretamente com a empresa.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/60 p-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-4 h-11 w-full" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center text-sm text-destructive">
              Não foi possível carregar os contatos agora. Tente novamente em instantes.
            </div>
          ) : (
            <Tabs defaultValue="moto-taxi" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1">
                <TabsTrigger value="moto-taxi" className="min-h-12 gap-2 rounded-xl px-2 text-xs sm:text-sm">
                  <Bike className="h-4 w-4" />
                  Moto-Táxi
                  <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px]">{motoTaxiCompanies.length}</span>
                </TabsTrigger>
                <TabsTrigger value="gas-agua" className="min-h-12 gap-2 rounded-xl px-2 text-xs sm:text-sm">
                  <span className="flex items-center -space-x-1">
                    <Flame className="h-4 w-4" />
                    <Droplets className="h-4 w-4" />
                  </span>
                  Gás e Água
                  <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px]">{gasWaterCompanies.length}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="moto-taxi" className="mt-4">
                {motoTaxiCompanies.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {motoTaxiCompanies.map((company) => <CompanyContactCard key={company.id} company={company} />)}
                  </div>
                ) : (
                  <EmptyCategory label="Moto-Táxi" />
                )}
              </TabsContent>

              <TabsContent value="gas-agua" className="mt-4">
                {gasWaterCompanies.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {gasWaterCompanies.map((company) => <CompanyContactCard key={company.id} company={company} />)}
                  </div>
                ) : (
                  <EmptyCategory label="Gás e Água" />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
