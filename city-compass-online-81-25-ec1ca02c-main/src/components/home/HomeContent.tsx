
import { useAuth } from "@/hooks/useAuth";
import { StoriesSection } from './StoriesSection';
import { SearchBar } from './SearchBar';
import { BannerSection } from './BannerSection';
import { FeaturedSection } from './FeaturedSection';
import { CategoriesGrid } from './CategoriesGrid';
import { EventosSlider } from './EventosSlider';
import { StatsSection } from './StatsSection';
import { LatestChannelPost } from './LatestChannelPost';
import { LatestCoupons } from './LatestCoupons';
import { LatestJobCoupons } from './LatestJobCoupons';
import { PopularBusinesses } from './PopularBusinesses';
import { FeaturedProducts } from './FeaturedProducts';
import { AondeIrButton } from './AondeIrButton';
import { EnqueteSection } from './EnqueteSection';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { useHomeSectionsOrder } from "@/hooks/useHomeSectionsOrder";

const sectionComponents = {
  banner: (cidadeId?: string) => <BannerSection secao="home" />,
  search: (cidadeId?: string) => <SearchBar />,
  aonde_ir: (cidadeId?: string) => <AondeIrButton />,
  stories: (cidadeId?: string) => <StoriesSection />,
  enquetes: (cidadeId?: string) => <EnqueteSection />,
  categories: (cidadeId?: string) => <CategoriesGrid />,
  latest_job_coupons: (cidadeId?: string) => <LatestJobCoupons />,
  latest_coupons: (cidadeId?: string) => <LatestCoupons cidadeId={cidadeId || ''} />,
  canal_informativo: (cidadeId?: string) => <LatestChannelPost />,
  popular_businesses: (cidadeId?: string) => <PopularBusinesses />,
  featured_section: (cidadeId?: string) => <FeaturedSection cidadeId={cidadeId || ''} />,
  eventos_slider: (cidadeId?: string) => <EventosSlider />,
  stats_section: (cidadeId?: string) => <StatsSection />,
  featured_products: (cidadeId?: string) => <FeaturedProducts />
};

export const HomeContent = () => {
  const { user } = useAuth();
  const { data: cidadePadrao } = useCidadePadrao();
  const { sections, isLoading } = useHomeSectionsOrder();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 space-y-6 pb-20">
          <div className="animate-pulse space-y-6">
            {/* Banner skeleton */}
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4">
              <div className="w-full aspect-[970/250] bg-muted rounded-lg"></div>
            </div>
            
            {/* Featured section skeleton */}
            <div className="mx-2 sm:mx-4 lg:mx-6 p-4 bg-card rounded-lg">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="h-6 bg-muted rounded w-32"></div>
                <div className="h-5 bg-muted rounded w-16"></div>
              </div>
              <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-64 sm:min-w-72 lg:min-w-80 bg-muted rounded-lg">
                    <div className="h-28 sm:h-32 lg:h-36 bg-muted/50 rounded-t-lg"></div>
                    <div className="p-3 sm:p-4 space-y-2">
                      <div className="h-5 bg-muted/50 rounded w-3/4"></div>
                      <div className="h-4 bg-muted/50 rounded w-1/2"></div>
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

  const activeSections = sections?.filter(section => section.ativo) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 space-y-6 pb-20">
        {activeSections.map((section) => {
          const Component = sectionComponents[section.section_name as keyof typeof sectionComponents];
          if (!Component) return null;
          
          return (
            <div key={section.id}>
              {Component(cidadePadrao?.id)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
