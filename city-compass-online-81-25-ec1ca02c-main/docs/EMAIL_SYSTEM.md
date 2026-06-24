# Sistema de Emails com Resend

Este documento explica como usar o sistema de emails integrado com Resend no projeto Saj Tem.

## Configuração

### 1. Conta Resend
- ✅ Criar conta em https://resend.com
- ✅ Validar domínio em https://resend.com/domains
- ✅ Criar API key em https://resend.com/api-keys
- ✅ Configurar `RESEND_API_KEY` como secret no Supabase

### 2. Edge Functions Criadas

#### `send-welcome-email`
Envia email de boas-vindas para novos usuários.
```typescript
// Exemplo de uso
const { sendWelcomeEmail } = useEmailService();

await sendWelcomeEmail({
  email: "usuario@email.com",
  nome: "João Silva",
  tipo_conta: "empresa" // opcional: 'usuario' | 'empresa'
});
```

#### `send-empresa-notification`
Notifica sobre aprovação/rejeição de empresas.
```typescript
await sendEmpresaNotification({
  email: "empresa@email.com",
  nome_usuario: "Maria Santos",
  nome_empresa: "Loja da Maria",
  status: "aprovado", // 'aprovado' | 'rejeitado'
  observacoes: "Observações do admin" // opcional
});
```

#### `send-event-notification`
Notifica sobre status de eventos.
```typescript
await sendEventNotification({
  email: "organizador@email.com",
  nome_usuario: "Carlos",
  titulo_evento: "Festival de Música",
  data_evento: "2024-12-25T20:00:00Z",
  local_evento: "Praça Central",
  status: "aprovado", // 'aprovado' | 'rejeitado'
  observacoes: "Evento aprovado!" // opcional
});
```

#### `send-contact-email`
Envia emails de contato (usuário + admin).
```typescript
await sendContactEmail({
  nome: "Pedro Oliveira",
  email: "pedro@email.com",
  telefone: "(75) 99999-9999", // opcional
  assunto: "Dúvida sobre cadastro",
  mensagem: "Como faço para cadastrar minha empresa?"
});
```

## Hook useEmailService

O hook `useEmailService` centraliza todas as funções de email:

```typescript
import { useEmailService } from '@/hooks/useEmailService';

const MyComponent = () => {
  const {
    sendWelcomeEmail,
    sendEmpresaNotification,
    sendEventNotification,
    sendContactEmail
  } = useEmailService();

  // Usar as funções conforme necessário
};
```

## Componentes Disponíveis

### ContactForm
Formulário completo de contato já integrado:
```typescript
import { ContactForm } from '@/components/contact/ContactForm';

// Usar em qualquer página
<ContactForm />
```

### ContactPage
Página completa de contato com informações:
```typescript
import { ContactPage } from '@/pages/ContactPage';
```

## Integração com Triggers do Banco

### Para notificar aprovações/rejeições automáticas:

```sql
-- Exemplo de trigger para empresas
CREATE OR REPLACE FUNCTION notify_empresa_status()
RETURNS trigger AS $$
BEGIN
  -- Chamar edge function quando status mudar
  IF OLD.status_aprovacao IS DISTINCT FROM NEW.status_aprovacao THEN
    PERFORM net.http_post(
      'https://your-project.supabase.co/functions/v1/send-empresa-notification',
      json_build_object(
        'email', (SELECT email FROM usuarios WHERE id = NEW.usuario_id),
        'nome_usuario', (SELECT nome FROM usuarios WHERE id = NEW.usuario_id),
        'nome_empresa', NEW.nome,
        'status', NEW.status_aprovacao,
        'observacoes', NEW.observacoes_admin
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Templates de Email

Todos os emails seguem um padrão visual consistente:
- Logo do Saj Tem no cabeçalho
- Design responsivo
- Cores da marca
- Informações de contato no rodapé

## Logs e Monitoramento

Para verificar logs das edge functions:
1. Acesse o dashboard do Supabase
2. Vá em Functions > [nome-da-funcao] > Logs

## Personalização

Para personalizar os templates:
1. Edite os arquivos em `supabase/functions/[funcao]/index.ts`
2. Modifique o HTML dos emails
3. Ajuste textos e estilos conforme necessário

## Próximos Passos

- [ ] Configurar domínio personalizado no Resend
- [ ] Implementar templates mais avançados com React Email
- [ ] Adicionar analytics de abertura/clique
- [ ] Implementar sistema de newsletters