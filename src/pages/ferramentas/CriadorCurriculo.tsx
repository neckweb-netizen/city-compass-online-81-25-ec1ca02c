import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Download, Plus, Trash2, User, Briefcase, GraduationCap, Sparkles, Phone, Mail, MapPin, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Experiencia {
  id: string;
  empresa: string;
  cargo: string;
  inicio: string;
  fim: string;
  descricao: string;
}

interface Formacao {
  id: string;
  instituicao: string;
  curso: string;
  conclusao: string;
}

export const CriadorCurriculo = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  // DADOS PESSOAIS
  const [nome, setNome] = useState('');
  const [cargoPretendido, setCargoPretendido] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [resumo, setResumo] = useState('');
  const [habilidades, setHabilidades] = useState('');

  // EXPERIÊNCIAS E FORMAÇÃO
  const [experiencias, setExperiencias] = useState<Experiencia[]>([
    { id: '1', empresa: '', cargo: '', inicio: '', fim: '', descricao: '' }
  ]);
  const [formacoes, setFormacoes] = useState<Formacao[]>([
    { id: '1', instituicao: '', curso: '', conclusao: '' }
  ]);

  // MANIPULAÇÃO DE EXPERIÊNCIAS
  const adicionarExperiencia = () => {
    setExperiencias([
      ...experiencias,
      { id: Date.now().toString(), empresa: '', cargo: '', inicio: '', fim: '', descricao: '' }
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
      { id: Date.now().toString(), instituicao: '', curso: '', conclusao: '' }
    ]);
  };

  const removerFormacao = (id: string) => {
    if (formacoes.length > 1) {
      setFormacoes(formacoes.filter(form => form.id !== id));
    }
  };

  const atualizarFormacao = (id: string, campo: keyof Formacao, valor: string) => {
    setFormacoes(formacoes.map(form => form.id === id ? { ...form, [campo]: valor } : form));
  };

  // FUNÇÃO DE IMPRESSÃO / SALVAR PDF
  const handleBaixarPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      <div className="max-w-5xl mx-auto space-y-6 print:m-0 print:max-w-none">
        
        {/* CABEÇALHO (ESCONDIDO NA IMPRESSÃO) */}
        <div className="flex items-center justify-between print:hidden">
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

        <div className="text-center space-y-2 print:hidden">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Criador de Currículo PDF Profissional
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Preencha seus dados, escolha suas experiências e baixe seu currículo pronto para enviar para as vagas.
          </p>
        </div>

        {/* LAYOUT PRINCIPAL: FORMULÁRIO (ESQUERDA) E PRÉ-VISUALIZAÇÃO (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block">
          
          {/* PAINEL DE ENTRADA (FORMULÁRIO) - ESCONDIDO NA IMPRESSÃO */}
          <div className="space-y-6 print:hidden">
            
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
                  <Input id="nome" placeholder="Ex: João da Silva" value={nome} onChange={e => setNome(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="cargoPretendido" className="text-xs">Cargo Pretendido / Área</Label>
                  <Input id="cargoPretendido" placeholder="Ex: Auxiliar Administrativo" value={cargoPretendido} onChange={e => setCargoPretendido(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="email" className="text-xs">E-mail</Label>
                    <Input id="email" type="email" placeholder="joao@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="telefone" className="text-xs">Telefone / WhatsApp</Label>
                    <Input id="telefone" placeholder="(75) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cidade" className="text-xs">Cidade e Estado</Label>
                  <Input id="cidade" placeholder="Ex: Santo Antônio de Jesus - BA" value={cidade} onChange={e => setCidade(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="resumo" className="text-xs">Resumo Profissional</Label>
                  <Textarea id="resumo" placeholder="Breve resumo das suas qualificações e objetivos..." value={resumo} onChange={e => setResumo(e.target.value)} className="text-xs h-20" />
                </div>
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
                {experiencias.map((exp, index) => (
                  <div key={exp.id} className="p-3 border border-border/50 rounded-lg space-y-2 relative bg-muted/20">
                    {experiencias.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removerExperiencia(exp.id)} className="absolute top-2 right-2 h-6 w-6 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Empresa</Label>
                        <Input placeholder="Nome da empresa" value={exp.empresa} onChange={e => atualizarExperiencia(exp.id, 'empresa', e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Cargo</Label>
                        <Input placeholder="Seu cargo" value={exp.cargo} onChange={e => atualizarExperiencia(exp.id, 'cargo', e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Início</Label>
                        <Input placeholder="Ex: Jan/2022" value={exp.inicio} onChange={e => atualizarExperiencia(exp.id, 'inicio', e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Fim / Atual</Label>
                        <Input placeholder="Ex: Atual" value={exp.fim} onChange={e => atualizarExperiencia(exp.id, 'fim', e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px]">Principais Atividades</Label>
                      <Input placeholder="Descreva brevemente o que fazia" value={exp.descricao} onChange={e => atualizarExperiencia(exp.id, 'descricao', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FORMAÇÃO ACADÊMICA */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> Formação Acadêmica
                </CardTitle>
                <Button size="sm" variant="outline" onClick={adicionarFormacao} className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formacoes.map((form) => (
                  <div key={form.id} className="p-3 border border-border/50 rounded-lg space-y-2 relative bg-muted/20">
                    {formacoes.length > 1 && (
                      <Button size="icon" variant="ghost" onClick={() => removerFormacao(form.id)} className="absolute top-2 right-2 h-6 w-6 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Instituição</Label>
                        <Input placeholder="Escola / Faculdade" value={form.instituicao} onChange={e => atualizarFormacao(form.id, 'instituicao', e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Curso</Label>
                        <Input placeholder="Ex: Ensino Médio / Administração" value={form.curso} onChange={e => atualizarFormacao(form.id, 'curso', e.target.value)} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px]">Ano de Conclusão</Label>
                      <Input placeholder="Ex: 2023" value={form.conclusao} onChange={e => atualizarFormacao(form.id, 'conclusao', e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* HABILIDADES */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" /> Habilidades & Cursos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Ex: Informática Básica, Informática Avançada, CNH B, Atendimento ao Cliente" value={habilidades} onChange={e => setHabilidades(e.target.value)} className="text-xs" />
              </CardContent>
            </Card>

            <Button onClick={handleBaixarPDF} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg">
              <Download className="w-5 h-5" /> Baixar Currículo em PDF
            </Button>
          </div>

          {/* PRÉ-VISUALIZAÇÃO / FOLHA A4 PARA IMPRESSÃO */}
          <div className="sticky top-6 print:static">
            <div className="flex justify-between items-center mb-2 print:hidden">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pré-visualização do PDF</span>
              <Button size="sm" onClick={handleBaixarPDF} className="h-8 text-xs gap-1">
                <Download className="w-3.5 h-3.5" /> Baixar PDF
              </Button>
            </div>

            {/* DOCUMENTO FORMATADO A4 */}
            <div 
              ref={printRef}
              className="bg-white text-gray-900 p-8 rounded-lg shadow-2xl border border-gray-200 min-h-[700px] font-sans print:shadow-none print:border-none print:p-0 print:w-full"
            >
              {/* CABEÇALHO DO CURRÍCULO */}
              <div className="border-b-2 border-primary pb-4 mb-4">
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {nome || 'SEU NOME COMPLETO'}
                </h1>
                <p className="text-sm font-bold text-primary mt-0.5">
                  {cargoPretendido || 'CARGO PRETENDIDO'}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-2">
                  {cidade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cidade}</span>}
                  {telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {telefone}</span>}
                  {email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {email}</span>}
                </div>
              </div>

              {/* RESUMO */}
              {resumo && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-1.5">
                    Resumo Profissional
                  </h2>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{resumo}</p>
                </div>
              )}

              {/* EXPERIÊNCIA */}
              {experiencias.some(e => e.empresa || e.cargo) && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
                    Experiência Profissional
                  </h2>
                  <div className="space-y-3">
                    {experiencias.map((exp) => (
                      (exp.empresa || exp.cargo) && (
                        <div key={exp.id} className="text-xs">
                          <div className="flex justify-between items-baseline font-bold text-gray-900">
                            <span>{exp.cargo || 'Cargo'} - {exp.empresa || 'Empresa'}</span>
                            <span className="text-[10px] text-gray-500">{exp.inicio} {exp.inicio && exp.fim && '-'} {exp.fim}</span>
                          </div>
                          {exp.descricao && <p className="text-gray-600 mt-0.5">{exp.descricao}</p>}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* FORMAÇÃO */}
              {formacoes.some(f => f.instituicao || f.curso) && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
                    Formação Acadêmica
                  </h2>
                  <div className="space-y-2">
                    {formacoes.map((form) => (
                      (form.instituicao || form.curso) && (
                        <div key={form.id} className="text-xs flex justify-between items-baseline">
                          <div>
                            <span className="font-bold text-gray-900">{form.curso}</span>
                            <span className="text-gray-600"> - {form.instituicao}</span>
                          </div>
                          {form.conclusao && <span className="text-[10px] text-gray-500">Conclusão: {form.conclusao}</span>}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* HABILIDADES */}
              {habilidades && (
                <div>
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-1.5">
                    Habilidades e Qualificações
                  </h2>
                  <p className="text-xs text-gray-700">{habilidades}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CriadorCurriculo;
