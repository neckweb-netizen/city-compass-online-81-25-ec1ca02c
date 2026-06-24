import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const CreateNotificationTest = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const { createNotification } = useNotifications();
  const { user } = useAuth();

  const handleCreateNotification = () => {
    if (!user?.id || !title.trim()) {
      toast.error('Usuário deve estar logado e título é obrigatório');
      return;
    }

    createNotification({
      user_id: user.id,
      title: title.trim(),
      message: message.trim() || undefined,
    });

    toast.success('Notificação criada!');
    setTitle('');
    setMessage('');
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Teste de Notificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Título da notificação"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Textarea
            placeholder="Mensagem (opcional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        <Button 
          onClick={handleCreateNotification}
          className="w-full"
          disabled={!title.trim()}
        >
          Criar Notificação Teste
        </Button>
      </CardContent>
    </Card>
  );
};