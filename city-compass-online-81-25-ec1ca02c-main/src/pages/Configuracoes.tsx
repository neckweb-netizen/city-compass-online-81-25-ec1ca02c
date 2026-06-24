import { ConfiguracoesDialog } from '@/components/profile/ConfiguracoesDialog';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Configuracoes() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setDialogOpen(true)}>
            Abrir Configurações
          </Button>
          <ConfiguracoesDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </CardContent>
      </Card>
    </div>
  );
}