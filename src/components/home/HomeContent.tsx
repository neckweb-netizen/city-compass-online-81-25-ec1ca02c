import {
  lazy,
  Suspense,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import { StoriesSection } from './StoriesSection';
import { SearchBar } from './SearchBar';
import { BannerSection } from './BannerSection';
import { CategoriesGrid } from './CategoriesGrid';
import { AondeIrButton } from './AondeIrButton';

import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { useHomeSectionsOrder } from '@/hooks/useHomeSectionsOrder';

const EnqueteSection = lazy(() =>
  import('./EnqueteSection').then((module) => ({
    default: module.EnqueteSection,
  })),
);

const LatestJobCoupons = lazy(() =>
  import('./LatestJobCoupons').then((module) => ({
    default: module.LatestJobCoupons,
  })),
);

const LatestCoupons = lazy(() =>
  import('./LatestCoupons').then((module) => ({
    default: module.LatestCoupons,
  })),
);

const LatestChannelPost = lazy(() =>
  import('./LatestChannelPost').then((module) => ({
    default: module.LatestChannelPost,
  })),
);

const PopularBusinesses = lazy(() =>
  import('./PopularBusinesses').then((module) => ({
    default: module.PopularBusinesses,
  })),
);

const FeaturedSection = lazy(() =>
  import('./FeaturedSection').then((module) => ({
    default: module.FeaturedSection,
  })),
);

const EventosSlider = lazy(() =>
  import('./EventosSlider').then((module) => ({
    default: module.EventosSlider,
  })),
);

const StatsSection = lazy(() =>
  import('./StatsSection').then((module) => ({
    default: module.StatsSection,
  })),
);

const FeaturedProducts = lazy(() =>
  import('./FeaturedProducts').then((module) => ({
    default: module.FeaturedProducts,
  })),
);

const VozDoPovoSection = lazy(() =>
  import('./VozDoPovoSection').then((module) => ({
    default: module.VozDoPovoSection,
  })),
);

const sectionComponents = {
  banner: () => <BannerSection secao="home" />,

  search: () => <SearchBar />,

  aonde_ir: () => <AondeIrButton />,

  stories: () => <StoriesSection />,

  categories: () => <CategoriesGrid />,

  enquetes: () => <EnqueteSection />,

  latest_job_coupons: () => (
    <LatestJobCoupons />
  ),

  latest_coupons: (cidadeId?: string) => (
    <LatestCoupons cidadeId={cidadeId || ''} />
  ),

  canal_informativo: () => (
    <LatestChannelPost />
  ),

  popular_businesses: () => (
    <PopularBusinesses />
  ),

  featured_section: (cidadeId?: string) => (
    <FeaturedSection cidadeId={cidadeId || ''} />
  ),

  eventos_slider: () => <EventosSlider />,

  stats_section: () => <StatsSection />,

  featured_products: () => (
    <FeaturedProducts />
  ),

  voz_do_povo: () => (
    <VozDoPovoSection />
  ),
};

interface HomeContentProps {
  extraSections?: Record<string, ReactNode>;
}

interface DeferredSectionProps {
  render: () => ReactNode;
}

const DeferredSection = ({
  render,
}: DeferredSectionProps) => {
  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const [shouldRender, setShouldRender] =
    useState(false);

  useEffect(() => {
    if (shouldRender) {
      return;
    }

    const element = containerRef.current;

    if (!element) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry.isIntersecting ||
          entry.intersectionRatio > 0
        ) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '700px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div ref={containerRef}>
      {shouldRender ? render() : null}
    </div>
  );
};

const SectionFallback = () => (
  <div
    className="min-h-20 w-full"
    aria-hidden="true"
  />
);

export const HomeContent = ({
  extraSections = {},
}: HomeContentProps) => {
  const { data: cidadePadrao } =
    useCidadePadrao();

  const {
    sections,
    isLoading,
  } = useHomeSectionsOrder();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto space-y-6 px-4 py-4 pb-20">
          <div className="animate-pulse space-y-6">
            <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:px-4">
              <div className="aspect-[970/250] w-full rounded-lg bg-muted" />
            </div>

            <div className="mx-2 rounded-lg bg-card p-4 sm:mx-4 lg:mx-6">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="h-6 w-32 rounded bg-muted" />
                <div className="h-5 w-16 rounded bg-muted" />
              </div>

              <div className="flex space-x-3 overflow-x-auto pb-4 sm:space-x-4">
                {Array.from({
                  length: 3,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="min-w-64 rounded-lg bg-muted sm:min-w-72 lg:min-w-80"
                  >
                    <div className="h-28 rounded-t-lg bg-muted/50 sm:h-32 lg:h-36" />

                    <div className="space-y-2 p-3 sm:p-4">
                      <div className="h-5 w-3/4 rounded bg-muted/50" />
                      <div className="h-4 w-1/2 rounded bg-muted/50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeSections =
    sections?.filter(
      (section) => section.ativo,
    ) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto space-y-6 px-4 py-4 pb-20">
        {activeSections.map(
          (section, index) => {
            if (
              Object.prototype.hasOwnProperty.call(
                extraSections,
                section.section_name,
              )
            ) {
              return (
                <div key={section.id}>
                  {
                    extraSections[
                      section.section_name
                    ]
                  }
                </div>
              );
            }

            const Component =
              sectionComponents[
                section.section_name as keyof typeof sectionComponents
              ];

            if (!Component) {
              return null;
            }

            const renderSection = () => (
              <Suspense
                fallback={<SectionFallback />}
              >
                {Component(cidadePadrao?.id)}
              </Suspense>
            );

            /*
             * As primeiras quatro seções são renderizadas
             * imediatamente.
             *
             * O restante só começa a carregar quando chega
             * a aproximadamente 700px da viewport.
             *
             * Isso reduz JS, imagens e requisições na
             * primeira renderização mobile.
             */
            if (index < 4) {
              return (
                <div key={section.id}>
                  {renderSection()}
                </div>
              );
            }

            return (
              <DeferredSection
                key={section.id}
                render={renderSection}
              />
            );
          },
        )}
      </div>
    </div>
  );
};
