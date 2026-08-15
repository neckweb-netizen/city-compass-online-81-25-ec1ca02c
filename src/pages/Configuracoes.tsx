import { ConfiguracoesDialog } from '@/components/profile/ConfiguracoesDialog';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Configuracoes() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(true);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) navigate('/profile');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">Gerencie notificações, aparência, senha e privacidade da sua conta.</p>
          <Button onClick={() => setDialogOpen(true)}>Abrir configurações</Button>
          <ConfiguracoesDialog open={dialogOpen} onOpenChange={handleOpenChange} />
        </CardContent>
      </Card>
    </div>
  );
}
