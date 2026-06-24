
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSection } from '@/components/admin/sections/DashboardSection';
import { EmpresasSection } from '@/components/admin/sections/EmpresasSection';
import { UsuariosSection } from '@/components/admin/sections/UsuariosSection';
import { CategoriasSection } from '@/components/admin/sections/CategoriasSection';
import { EventosSection } from '@/components/admin/sections/EventosSection';
import { CuponsSection } from '@/components/admin/sections/CuponsSection';
import { AvaliacoesSection } from '@/components/admin/sections/AvaliacoesSection';
import { PlanosSection } from '@/components/admin/sections/PlanosSection';
import { EstatisticasSection } from '@/components/admin/sections/EstatisticasSection';
import { ConfiguracoesSection } from '@/components/admin/sections/ConfiguracoesSection';
import { BannersSection } from '@/components/admin/sections/BannersSection';
import { AuditLogsSection } from '@/components/admin/sections/AuditLogsSection';
import { CanalInformativoSection } from '@/components/admin/sections/CanalInformativoSection';
import { MenuConfiguracoesSection } from '@/components/admin/sections/MenuConfiguracoesSection';
import { AvisosSistemaSection } from '@/components/admin/sections/AvisosSistemaSection';
import { EnquetesSection } from '@/components/admin/sections/EnquetesSection';
import { AdminHomeSections } from './AdminHomeSections';

interface AdminDashboardProps {
  activeSection?: string;
}

export const AdminDashboard = ({ activeSection = 'dashboard' }: AdminDashboardProps) => {
  console.log('📱 AdminDashboard - Active section:', activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection />;
      case 'empresas':
        return <EmpresasSection />;
      case 'usuarios':
        return <UsuariosSection />;
      case 'categorias':
        return <CategoriasSection />;
      case 'eventos':
        return <EventosSection />;
      case 'cupons':
        return <CuponsSection />;
      case 'avaliacoes':
        return <AvaliacoesSection />;
      case 'banners':
        return <BannersSection />;
      case 'canal-informativo':
        return <CanalInformativoSection />;
      case 'avisos-sistema':
        return <AvisosSistemaSection />;
      case 'enquetes':
        return <EnquetesSection />;
      case 'planos':
        return <PlanosSection />;
      case 'estatisticas':
        return <EstatisticasSection />;
      case 'audit-logs':
        return <AuditLogsSection />;
      case 'menu-configuracoes':
        return <MenuConfiguracoesSection />;
      case 'home-sections':
        return <AdminHomeSections />;
      case 'configuracoes':
        return <ConfiguracoesSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="space-y-6">
      {renderSection()}
    </div>
  );
};

export default AdminDashboard;
