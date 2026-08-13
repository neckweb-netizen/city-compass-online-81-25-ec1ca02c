import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Printer, Plus, Trash2, User, Briefcase, GraduationCap, Sparkles, Award, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';

interface Experiencia {
  id: string;
  empresa: string;
  cidade: string;
  cargo: string;
  dataInicio: string;
  dataFim: string;
  descricao: string;
}

interface Formacao {
  id: string;
  descricao: string;
}

export const CriadorCurriculo = () => {
  const navigate = useNavigate();

  // ESTADOS INICIADOS TOTALMENTE VAZIOS (SEM AUTOCOMPLETAR)
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone1, setTelefone1] = useState('');
  const [telefone2, setTelefone2] = useState('');
  const [email, setEmail] = useState('');
  const [resumo, setResumo] = useState('');
  const [informacoesAdicionais, setInformacoesAdicionais] = useState('');

  const [formacoes, setFormacoes] = useState<Formacao[]>([
    { id: '1', descricao: '' }
  ]);

  const [experiencias, setExperiencias] = useState<Experiencia[]>([
    {
      id: '1',
      empresa: '',
      cidade: '',
      cargo: '',
      dataInicio: '',
      dataFim: '',
      descricao: ''
    }
  ]);

  // MANIPULAÇÃO DE EXPERIÊNCIAS
  const adicionarExperiencia = () => {
    setExperiencias([
      ...experiencias,
      { id: Date.now().toString(), empresa: '', cidade: '', cargo: '', dataInicio: '', dataFim: '', descricao: '' }
    ]);
  };

  const removerExperiencia = (id: string) => {
    if (experiencias.length > 1) {
      setExperiencias(experiencias.filter(exp => exp.id !== id));
    }
  };

  const atualizarExperiencia = (id: string, campo: keyof Experiencia, valor: string) => {
    setExperiencias(experiencias.map(exp => exp.id === id ? { ...exp, [campo]: valor } : exp));
  };

  // MANIPULAÇÃO DE FORMAÇÕES
  const adicionarFormacao = () => {
    setFormacoes([
      ...formacoes,
      { id: Date.now().toString(), descricao: '' }
    ]);
  };

  const removerFormacao = (id: string) => {
    if (formacoes.length > 1) {
      setFormacoes(formacoes.filter(form => form.id !== id));
    }
  };

  const atualizarFormacao = (id: string, valor: string) => {
    setFormacoes(formacoes.map(form => form.id === id ? { ...form, descricao: valor } : form));
  };

  // 1️⃣ BOTÃO IMPRIMIR: ABRE APENAS A TELA DE IMPRESSÃO
  const handleImprimir = () => {
    window.print();
  };

  // 2️⃣ BOTÃO BAIXAR DIRETO: GERADOR DE ARQUIVO E DOWNLOAD AUTOMÁTICO SEM TELA INTERMEDIÁRIA
  const handleBaixarDireto = () => {
    const folha = document.getElementById('folha-curriculo');
    if (!folha) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const rect = folha.getBoundingClientRect();

    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;

    if (!ctx) return;

    const data = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${folha.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    const img = new Image();
    const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);

    img.onload = () => {
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);

      const a = document.createElement('a');
      const nomeLimpo = nome.trim() ? `curriculo_${nome.toLowerCase().replace(/\s+/g, '_')}.png` : 'curriculo.png';
      a.download = nomeLimpo;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };

    img.src = svgUrl;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white print:m-0">
      
      {/* CSS DE IMPRESSÃO LIMPO */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          header, footer, nav, .no-print {
            display: none !important;
          }
          #folha-curriculo, #folha-curriculo * {
            visibility: visible !important;
          }
          #folha-curriculo {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm 15mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6 print:m-0 print:max-w-none">
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex items-center justify-between no-print">
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

        <ToolBanner secao="criador_curriculo" className="no-print" />

        <div className="text-center space-y-2 no-print">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Criador de Currículo PDF Profissional
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Preencha os campos abaixo, veja a pré-visualização ao lado e baixe seu arquivo.
          </p>
        </div>

        {/* FORMULÁRIO E PRÉ-VISUALIZAÇÃO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
          
          {/* PAINEL DE FORMULÁRIO */}
          <div className="space-y-6 no-print">
            
            {/* DADOS PESSOAIS */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="nome" className="text-xs">Nome Completo</Label>
                  <Input id="nome" placeholder="Ex: João da Silva Santos" value={nome} onChange={e => setNome(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="idade" className="text-xs">Idade e Data de Nascimento</Label>
                  <Input id="idade" placeholder="Ex: 25 anos (01/01/2000)" value={idade} onChange={e => setIdade(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="endereco" className="text-xs">Endereço Completo</Label>
                  <Input id="endereco" placeholder="Ex: Rua Exemplo, 100 - Bairro Centro" value={endereco} onChange={e => setEndereco(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="tel1" className="text-xs">Telefone Principal</Label>
                    <Input id="tel1" placeholder="Ex: (75) 99999-9999" value={telefone1} onChange={e => setTelefone1(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="tel2" className="text-xs">Celular / Contato 2</Label>
                    <Input id="tel2" placeholder="Ex: (75) 98888-8888" value={telefone2} onChange={e => setTelefone2(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs">E-mail</Label>
                  <Input id="email" type="email" placeholder="Ex: exemplo@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* RESUMO DE QUALIFICAÇÕES */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Resumo de Qualificações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  id="resumo" 
                  placeholder="Ex: Profissional dedicado, organizado e com facilidade para aprender novas atividades. Possuo boa comunicação, responsabilidade e foco em resultados..." 
                  value={resumo} 
                  onChange={e => setResumo(e.target.value)} 
                  className="text-xs h-28" 
                />
              </CardContent>
            </Card>

            {/* FORMAÇÃO EDUCACIONAL */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> Formação Educacional
                </CardTitle>
                <Button size="sm" variant="outline" onClick={adicionarFormacao} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {formacoes.map((form) => (
                  <div key={form.id} className="flex gap-2 items-center">
                    <Input 
                      placeholder="Ex: Ensino Médio completo" 
                      value={form.descricao} 
                      onChange={e => atualizarFormacao(form.id, e.target.value)} 
                      className="text-xs" 
                    />
                    {formacoes.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removerFormacao(form.id)} className="h-8 w-8 text-destructive shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* EXPERIÊNCIA PROFISSIONAL */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Experiência Profissional
                </CardTitle>
                <Button size="sm" variant="outline" onClick={adicionarExperiencia} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {experiencias.map((exp) => (
                  <div key={exp.id} className="p-3 border border-border/50 rounded-lg space-y-2 relative bg-muted/20">
                    {experiencias.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removerExperiencia(exp.id)} className="absolute top-2 right-2 h-6 w-6 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Empresa</Label>
                        <Input placeholder="Ex: Nome da Empresa LTDA" value={exp.empresa} onChange={e => atualizarExperiencia(exp.id, 'empresa', e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Cidade / Estado</Label>
                        <Input placeholder="Ex: Santo Antônio de Jesus - BA" value={exp.cidade} onChange={e => atualizarExperiencia(exp.id, 'cidade', e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Data de Início</Label>
                        <Input placeholder="Ex: 01/01/2022" value={exp.dataInicio} onChange={e => atualizarExperiencia(exp.id, 'dataInicio', e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Data de Término</Label>
                        <Input placeholder="Ex: 01/01/2024 ou Atual" value={exp.dataFim} onChange={e => atualizarExperiencia(exp.id, 'dataFim', e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px]">Cargo</Label>
                      <Input placeholder="Ex: Auxiliar Administrativo" value={exp.cargo} onChange={e => atualizarExperiencia(exp.id, 'cargo', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* INFORMAÇÕES ADICIONAIS */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input 
                  placeholder="Ex: Disponibilidade para início imediato" 
                  value={informacoesAdicionais} 
                  onChange={e => setInformacoesAdicionais(e.target.value)} 
                  className="text-xs" 
                />
              </CardContent>
            </Card>

            {/* ÚNICOS DOIS BOTÕES DA TELA */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                onClick={handleImprimir}
                variant="outline"
                className="w-full border-primary text-primary hover:bg-primary/10 font-bold h-12 rounded-xl flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" /> Imprimir
              </Button>

              <Button 
                onClick={handleBaixarDireto}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" /> Baixar PDF
              </Button>
            </div>
          </div>

          {/* PRÉ-VISUALIZAÇÃO / FOLHA FORMATADA A4 */}
          <div className="sticky top-6">
            <div className="flex items-center mb-2 no-print">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Pré-visualização do Currículo
              </span>
            </div>

            {/* DOCUMENTO FORMATADO A4 */}
            <div 
              id="folha-curriculo"
              className="bg-white text-gray-900 p-8 sm:p-10 rounded-lg shadow-2xl border border-gray-200 min-h-[750px] font-sans leading-relaxed text-sm"
            >
              {/* NOME COMPLETO */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
                {nome || 'NOME COMPLETO'}
              </h1>

              {/* DADOS PESSOAIS */}
              <div className="mb-6 space-y-0.5 text-xs text-gray-800">
                <div className="font-bold text-gray-900 text-sm uppercase mb-1">DADOS PESSOAIS</div>
                {idade ? <div>{idade}</div> : <div className="text-gray-400 italic">Idade e Data de Nascimento</div>}
                {endereco ? <div>{endereco}</div> : <div className="text-gray-400 italic">Endereço Completo</div>}
                {(telefone1 || telefone2) ? (
                  <div>
                    {telefone1 && `Tel.: ${telefone1}`}
                    {telefone1 && telefone2 && ' | '}
                    {telefone2 && `Cel.: ${telefone2}`}
                  </div>
                ) : (
                  <div className="text-gray-400 italic">Telefones de Contato</div>
                )}
                {email ? <div>E-mail: {email}</div> : <div className="text-gray-400 italic">E-mail</div>}
              </div>

              {/* RESUMO DE QUALIFICAÇÕES */}
              <div className="mb-6">
                <div className="font-bold text-gray-900 text-sm uppercase mb-1 border-b border-gray-300 pb-0.5">
                  RESUMO DE QUALIFICAÇÕES
                </div>
                {resumo ? (
                  <p className="text-xs text-gray-800 leading-normal whitespace-pre-wrap mt-1">
                    {resumo}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic mt-1">
                    Seu resumo de qualificações aparecerá aqui...
                  </p>
                )}
              </div>

              {/* FORMAÇÃO EDUCACIONAL */}
              <div className="mb-6">
                <div className="font-bold text-gray-900 text-sm uppercase mb-1 border-b border-gray-300 pb-0.5">
                  FORMAÇÃO EDUCACIONAL
                </div>
                {formacoes.some(f => f.descricao) ? (
                  <div className="space-y-1 text-xs text-gray-800 mt-1">
                    {formacoes.map((form) => (
                      form.descricao && <div key={form.id}>{form.descricao}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic mt-1">Sua formação aparecerá aqui...</div>
                )}
              </div>

              {/* EXPERIÊNCIA PROFISSIONAL */}
              <div className="mb-6">
                <div className="font-bold text-gray-900 text-sm uppercase mb-1 border-b border-gray-300 pb-0.5">
                  EXPERIÊNCIA PROFISSIONAL
                </div>
                {experiencias.some(e => e.empresa || e.cargo) ? (
                  <div className="space-y-3 mt-2">
                    {experiencias.map((exp) => (
                      (exp.empresa || exp.cargo) && (
                        <div key={exp.id} className="text-xs text-gray-800">
                          <div className="font-semibold text-gray-900">
                            {exp.empresa}
                            {exp.cidade && `, ${exp.cidade}`}
                            {(exp.dataInicio || exp.dataFim) && ` (${exp.dataInicio}${exp.dataInicio && exp.dataFim ? '-' : ''}${exp.dataFim})`}
                          </div>
                          {exp.cargo && <div className="text-gray-700 mt-0.5">{exp.cargo}</div>}
                          {exp.descricao && <p className="text-gray-600 mt-1">{exp.descricao}</p>}
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic mt-1">Sua experiência profissional aparecerá aqui...</div>
                )}
              </div>

              {/* INFORMAÇÕES ADICIONAIS */}
              <div>
                <div className="font-bold text-gray-900 text-sm uppercase mb-1 border-b border-gray-300 pb-0.5">
                  INFORMAÇÕES ADICIONAIS
                </div>
                {informacoesAdicionais ? (
                  <div className="text-xs text-gray-800 mt-1">
                    {informacoesAdicionais}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic mt-1">Informações adicionais...</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CriadorCurriculo;
