import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Copy, Send, Check, DollarSign, Calendar, User, Phone, Key, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GeradorCobranca = () => {
  const navigate = useNavigate();

  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [nomeRecebedor, setNomeRecebedor] = useState('');
  const [tomMensagem, setTomMensagem] = useState<'amigavel' | 'normal' | 'vencido'>('amigavel');

  const [copiado, setCopiado] = useState(false);

  // FORMATAÇÃO DE TELEFONE
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 9) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    setTelefoneCliente(value);
  };

  // FORMATAÇÃO DE MOEDA (R$)
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setValor('');
      return;
    }
    const valorNumerico = (parseFloat(value) / 100).toFixed(2);
    setValor(valorNumerico.replace('.', ','));
  };

  // GERADOR DO TEXTO DE COBRANÇA
  const gerarTextoMensagem = () => {
    const cliente = nomeCliente.trim() ? nomeCliente.trim() : 'Cliente';
    const valorFormatado = valor ? `R$ ${valor}` : 'R$ 0,00';
    const servicoText = descricao.trim() ? `referente a *${descricao.trim()}*` : '';
    const vencimentoText = dataVencimento ? `com vencimento em *${dataVencimento.split('-').reverse().join('/')}*` : '';
    const recebedorText = nomeRecebedor.trim() ? ` (${nomeRecebedor.trim()})` : '';

    let saudacao = `Olá, *${cliente}*! Tudo bem?`;
    let corpo = '';

    if (tomMensagem === 'amigavel') {
      corpo = `${saudacao}\n\nPassando apenas para lembrar do pagamento ${servicoText} no valor de *${valorFormatado}* ${vencimentoText}.\n\nPara facilitar, você pode realizar o pagamento via PIX:`;
    } else if (tomMensagem === 'normal') {
      corpo = `${saudacao}\n\nSegue o resumo para pagamento ${servicoText}:\n\n💰 *Valor:* ${valorFormatado}\n📅 *Vencimento:* ${dataVencimento ? dataVencimento.split('-').reverse().join('/') : 'A combinar'}\n\nVocê pode efetuar a transferência através da chave PIX abaixo:`;
    } else {
      corpo = `${saudacao}\n\nIdentificamos que o pagamento ${servicoText} no valor de *${valorFormatado}* consta em aberto ${vencimentoText}.\n\nPedimos a gentileza de realizar a quitação via PIX utilizando os dados abaixo:`;
    }

    let chaveText = chavePix.trim() ? `\n\n🔑 *Chave PIX:* \`${chavePix.trim()}\`${recebedorText}` : '';
    let rodape = `\n\nQualquer dúvida ou caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem. Obrigado! 🙏`;

    return `${corpo}${chaveText}${rodape}`;
  };

  const textoFinal = gerarTextoMensagem();

  // COPIAR MENSAGEM
  const handleCopiar = () => {
    navigator.clipboard.writeText(textoFinal);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // ENVIAR NO WHATSAPP
  const handleEnviarWhatsApp = () => {
    const numLimpo = telefoneCliente.replace(/\D/g, '');
    const mensagemEncoded = encodeURIComponent(textoFinal);

    if (numLimpo) {
      window.open(`https://wa.me/55${numLimpo}?text=${mensagemEncoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${mensagemEncoded}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Ferramenta Gratuita
          </span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Gerador de Cobrança & Lembrete PIX.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Crie mensagens de cobrança profissionais e envie direto para o WhatsApp do seu cliente sem complicação.
          </p>
        </div>

        {/* CONTEÚDO PRINCIPAL (FORMULÁRIO + PREVIEW) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PAINEL DE ENTRADA (FORMULÁRIO) */}
          <Card className="border-border/60 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Dados da Cobrança
              </CardTitle>
              <CardDescription>
                Preencha as informações do serviço e do cliente
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nomeCliente" className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Nome do Cliente
                </Label>
                <Input
                  id="nomeCliente"
                  placeholder="Ex: João Silva"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefoneCliente" className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> WhatsApp do Cliente (opcional)
                </Label>
                <Input
                  id="telefoneCliente"
                  placeholder="(75) 99999-9999"
                  value={telefoneCliente}
                  onChange={handleTelefoneChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="valor" className="text-xs font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Valor (R$)
                  </Label>
                  <Input
                    id="valor"
                    placeholder="0,00"
                    value={valor}
                    onChange={handleValorChange}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="vencimento" className="text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Vencimento
                  </Label>
                  <Input
                    id="vencimento"
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descricao" className="text-xs font-semibold">
                  Descrição do Serviço / Produto
                </Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Manutenção de Ar-condicionado"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <hr className="border-border/40 my-2" />

              <div className="space-y-1.5">
                <Label htmlFor="chavePix" className="text-xs font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-muted-foreground" /> Sua Chave PIX
                </Label>
                <Input
                  id="chavePix"
                  placeholder="CPF, Telefone, E-mail ou Chave Aleatória"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nomeRecebedor" className="text-xs font-semibold">
                  Nome do Titular do PIX (opcional)
                </Label>
                <Input
                  id="nomeRecebedor"
                  placeholder="Ex: Maria Serviços LTDA"
                  value={nomeRecebedor}
                  onChange={(e) => setNomeRecebedor(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tomMensagem" className="text-xs font-semibold">
                  Tom da Mensagem
                </Label>
                <Select value={tomMensagem} onValueChange={(v: any) => setTomMensagem(v)}>
                  <SelectTrigger id="tomMensagem">
                    <SelectValue placeholder="Selecione o tom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amigavel">Amigável / Lembrete Educado</SelectItem>
                    <SelectItem value="normal">Direto & Formal</SelectItem>
                    <SelectItem value="vencido">Cobrança de Vencido / Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* PAINEL DE PREVIEW E AÇÕES */}
          <div className="space-y-4 flex flex-col justify-between">
            <Card className="border-border/60 shadow-lg flex-1 flex flex-col justify-between bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                  Pré-visualização da Mensagem
                </CardTitle>
                <CardDescription>
                  Assim é como a mensagem chegará no WhatsApp
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="bg-[#efeae2] dark:bg-[#111b21] p-4 rounded-xl border border-emerald-500/20 font-sans text-xs sm:text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed shadow-inner min-h-[220px]">
                  {textoFinal}
                </div>

                <div className="space-y-2 pt-2">
                  <Button 
                    onClick={handleEnviarWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar no WhatsApp</span>
                  </Button>

                  <Button 
                    onClick={handleCopiar}
                    variant="outline"
                    className="w-full border-border hover:bg-muted font-semibold h-10 rounded-xl flex items-center justify-center gap-2 text-xs"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-500">Copiado para a área de transferência!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Texto da Mensagem</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-center">
              <p className="text-[11px] text-muted-foreground">
                🔒 Nenhuma informação digitada é salva nos nossos servidores. Seus dados e de seus clientes estão 100% seguros.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GeradorCobranca;

