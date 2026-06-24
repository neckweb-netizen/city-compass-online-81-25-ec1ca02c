import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HomeContent } from '@/components/home/HomeContent';
import { SearchContent } from '@/components/search/SearchContent';
import { CategoriesContent } from '@/components/categories/CategoriesContent';
import { CouponsContent } from '@/components/coupons/CouponsContent';
import { ProfileContent } from '@/components/profile/ProfileContent';

const Index = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent />;
      case 'search':
        return <SearchContent />;
      case 'categories':
        return <CategoriesContent />;
      case 'coupons':
        return <CouponsContent />;
      case 'profile':
        return <ProfileContent />;
      default:
        return <HomeContent />;
    }
  };

  return (
    <div className="w-full max-w-none overflow-x-hidden">
      {renderContent()}
    </div>
  );
};

export default Index;