export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_agendamento: string
          empresa_id: string
          id: string
          nome_cliente: string
          observacoes: string | null
          servico: string
          status: string
          telefone_cliente: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_agendamento: string
          empresa_id: string
          id?: string
          nome_cliente: string
          observacoes?: string | null
          servico: string
          status?: string
          telefone_cliente: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_agendamento?: string
          empresa_id?: string
          id?: string
          nome_cliente?: string
          observacoes?: string | null
          servico?: string
          status?: string
          telefone_cliente?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          atualizado_em: string
          comentario: string | null
          criado_em: string
          empresa_id: string
          id: string
          imagens: string[] | null
          nota: number
          respondido_em: string | null
          resposta_empresa: string | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          comentario?: string | null
          criado_em?: string
          empresa_id: string
          id?: string
          imagens?: string[] | null
          nota: number
          respondido_em?: string | null
          resposta_empresa?: string | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          comentario?: string | null
          criado_em?: string
          empresa_id?: string
          id?: string
          imagens?: string[] | null
          nota?: number
          respondido_em?: string | null
          resposta_empresa?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      avisos_sistema: {
        Row: {
          ativo: boolean
          atualizado_em: string
          autor_id: string
          botoes: Json | null
          conteudo: string | null
          criado_em: string
          data_fim: string | null
          data_inicio: string | null
          id: string
          prioridade: number | null
          tipo_aviso: string
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          autor_id: string
          botoes?: Json | null
          conteudo?: string | null
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          prioridade?: number | null
          tipo_aviso?: string
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          autor_id?: string
          botoes?: Json | null
          conteudo?: string | null
          criado_em?: string
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          prioridade?: number | null
          tipo_aviso?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avisos_sistema_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      bairros: {
        Row: {
          ativo: boolean
          cidade_id: string
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cidade_id: string
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cidade_id?: string
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "bairros_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      banners_publicitarios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          imagem_url: string
          link_url: string | null
          ordem: number
          secao: Database["public"]["Enums"]["tipo_secao_banner"]
          tipo_midia: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          imagem_url: string
          link_url?: string | null
          ordem?: number
          secao?: Database["public"]["Enums"]["tipo_secao_banner"]
          tipo_midia?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          imagem_url?: string
          link_url?: string | null
          ordem?: number
          secao?: Database["public"]["Enums"]["tipo_secao_banner"]
          tipo_midia?: string | null
          titulo?: string
        }
        Relationships: []
      }
      canal_informativo: {
        Row: {
          ativo: boolean
          atualizado_em: string
          autor_id: string
          conteudo: string | null
          criado_em: string
          id: string
          link_externo: string | null
          tipo_conteudo: string
          titulo: string
          url_midia: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          autor_id: string
          conteudo?: string | null
          criado_em?: string
          id?: string
          link_externo?: string | null
          tipo_conteudo: string
          titulo: string
          url_midia?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          autor_id?: string
          conteudo?: string | null
          criado_em?: string
          id?: string
          link_externo?: string | null
          tipo_conteudo?: string
          titulo?: string
          url_midia?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          criado_em: string
          icone_url: string | null
          id: string
          nome: string
          slug: string
          tipo: Database["public"]["Enums"]["tipo_categoria"]
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          icone_url?: string | null
          id?: string
          nome: string
          slug: string
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          icone_url?: string | null
          id?: string
          nome?: string
          slug?: string
          tipo?: Database["public"]["Enums"]["tipo_categoria"]
        }
        Relationships: []
      }
      categorias_oportunidades: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          id: string
          nome: string
          slug: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome: string
          slug: string
          tipo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          id?: string
          nome?: string
          slug?: string
          tipo?: string
        }
        Relationships: []
      }
      categorias_problema: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cor: string | null
          criado_em: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      cidades: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          descricao: string | null
          estado: string
          id: string
          imagem_url: string | null
          nome: string
          slug: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          estado: string
          id?: string
          imagem_url?: string | null
          nome: string
          slug: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          estado?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      comentarios_problema: {
        Row: {
          ativo: boolean
          atualizado_em: string
          comentario_pai_id: string | null
          conteudo: string
          criado_em: string
          data_moderacao: string | null
          id: string
          imagens: string[] | null
          moderado: boolean
          moderado_por: string | null
          problema_id: string
          usuario_id: string
          votos_negativos: number
          votos_positivos: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          comentario_pai_id?: string | null
          conteudo: string
          criado_em?: string
          data_moderacao?: string | null
          id?: string
          imagens?: string[] | null
          moderado?: boolean
          moderado_por?: string | null
          problema_id: string
          usuario_id: string
          votos_negativos?: number
          votos_positivos?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          comentario_pai_id?: string | null
          conteudo?: string
          criado_em?: string
          data_moderacao?: string | null
          id?: string
          imagens?: string[] | null
          moderado?: boolean
          moderado_por?: string | null
          problema_id?: string
          usuario_id?: string
          votos_negativos?: number
          votos_positivos?: number
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_problema_comentario_pai_id_fkey"
            columns: ["comentario_pai_id"]
            isOneToOne: false
            referencedRelation: "comentarios_problema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_problema_problema_id_fkey"
            columns: ["problema_id"]
            isOneToOne: false
            referencedRelation: "problemas_cidade"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string
          chave: string
          criado_em: string
          descricao: string | null
          id: string
          valor: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string
          chave: string
          criado_em?: string
          descricao?: string | null
          id?: string
          valor: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string
          chave?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          valor?: string
        }
        Relationships: []
      }
      cupons: {
        Row: {
          ativo: boolean
          codigo: string
          criado_em: string
          data_fim: string
          data_inicio: string
          descricao: string | null
          empresa_id: string
          id: string
          quantidade_total: number | null
          quantidade_usada: number
          tipo: Database["public"]["Enums"]["tipo_cupom"]
          titulo: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          codigo: string
          criado_em?: string
          data_fim: string
          data_inicio?: string
          descricao?: string | null
          empresa_id: string
          id?: string
          quantidade_total?: number | null
          quantidade_usada?: number
          tipo?: Database["public"]["Enums"]["tipo_cupom"]
          titulo: string
          valor: number
        }
        Update: {
          ativo?: boolean
          codigo?: string
          criado_em?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          quantidade_total?: number | null
          quantidade_usada?: number
          tipo?: Database["public"]["Enums"]["tipo_cupom"]
          titulo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cupons_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_stories: {
        Row: {
          ativo: boolean
          atualizado_em: string
          botao_link: string | null
          botao_tipo: string | null
          botao_titulo: string | null
          criado_em: string
          duracao: number
          empresa_id: string | null
          id: string
          imagem_capa_url: string | null
          imagem_story_url: string
          nome_perfil_sistema: string | null
          ordem: number
          tipo_midia: string
          tipo_story: string
          url_midia: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          botao_link?: string | null
          botao_tipo?: string | null
          botao_titulo?: string | null
          criado_em?: string
          duracao?: number
          empresa_id?: string | null
          id?: string
          imagem_capa_url?: string | null
          imagem_story_url: string
          nome_perfil_sistema?: string | null
          ordem?: number
          tipo_midia?: string
          tipo_story?: string
          url_midia?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          botao_link?: string | null
          botao_tipo?: string | null
          botao_titulo?: string | null
          criado_em?: string
          duracao?: number
          empresa_id?: string | null
          id?: string
          imagem_capa_url?: string | null
          imagem_story_url?: string
          nome_perfil_sistema?: string | null
          ordem?: number
          tipo_midia?: string
          tipo_story?: string
          url_midia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_stories_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_stories_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresa_stories_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          agendamentos_ativo: boolean | null
          aprovado_por: string | null
          ativo: boolean
          atualizado_em: string
          categoria_id: string
          cidade_id: string
          criado_em: string
          data_aprovacao: string | null
          descricao: string | null
          destaque: boolean
          endereco: string | null
          horario_funcionamento: Json | null
          id: string
          imagem_capa_url: string | null
          link_radio: string | null
          localizacao: unknown
          nome: string
          observacoes_admin: string | null
          plano_atual_id: string | null
          plano_data_vencimento: string | null
          servicos_agendamento: string[] | null
          site: string | null
          slug: string
          status_aprovacao:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          telefone: string | null
          usuario_id: string | null
          verificado: boolean
        }
        Insert: {
          agendamentos_ativo?: boolean | null
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          categoria_id: string
          cidade_id: string
          criado_em?: string
          data_aprovacao?: string | null
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          horario_funcionamento?: Json | null
          id?: string
          imagem_capa_url?: string | null
          link_radio?: string | null
          localizacao?: unknown
          nome: string
          observacoes_admin?: string | null
          plano_atual_id?: string | null
          plano_data_vencimento?: string | null
          servicos_agendamento?: string[] | null
          site?: string | null
          slug: string
          status_aprovacao?:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          telefone?: string | null
          usuario_id?: string | null
          verificado?: boolean
        }
        Update: {
          agendamentos_ativo?: boolean | null
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          categoria_id?: string
          cidade_id?: string
          criado_em?: string
          data_aprovacao?: string | null
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          horario_funcionamento?: Json | null
          id?: string
          imagem_capa_url?: string | null
          link_radio?: string | null
          localizacao?: unknown
          nome?: string
          observacoes_admin?: string | null
          plano_atual_id?: string | null
          plano_data_vencimento?: string | null
          servicos_agendamento?: string[] | null
          site?: string | null
          slug?: string
          status_aprovacao?:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          telefone?: string | null
          usuario_id?: string | null
          verificado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "empresas_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_plano_atual_id_fkey"
            columns: ["plano_atual_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empresas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      enderecos_empresa: {
        Row: {
          ativo: boolean
          atualizado_em: string
          bairro: string | null
          cep: string | null
          cidade_id: string
          criado_em: string
          empresa_id: string
          endereco: string
          horario_funcionamento: Json | null
          id: string
          localizacao: unknown
          nome_identificacao: string
          principal: boolean
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade_id: string
          criado_em?: string
          empresa_id: string
          endereco: string
          horario_funcionamento?: Json | null
          id?: string
          localizacao?: unknown
          nome_identificacao: string
          principal?: boolean
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade_id?: string
          criado_em?: string
          empresa_id?: string
          endereco?: string
          horario_funcionamento?: Json | null
          id?: string
          localizacao?: unknown
          nome_identificacao?: string
          principal?: boolean
          telefone?: string | null
        }
        Relationships: []
      }
      enquetes: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          criado_por: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          multipla_escolha: boolean
          opcoes: Json
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          multipla_escolha?: boolean
          opcoes?: Json
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          multipla_escolha?: boolean
          opcoes?: Json
          titulo?: string
        }
        Relationships: []
      }
      estatisticas: {
        Row: {
          atualizado_em: string
          empresa_id: string
          id: string
          media_avaliacoes: number | null
          total_avaliacoes: number
          total_curtidas: number
          total_visualizacoes: number
        }
        Insert: {
          atualizado_em?: string
          empresa_id: string
          id?: string
          media_avaliacoes?: number | null
          total_avaliacoes?: number
          total_curtidas?: number
          total_visualizacoes?: number
        }
        Update: {
          atualizado_em?: string
          empresa_id?: string
          id?: string
          media_avaliacoes?: number | null
          total_avaliacoes?: number
          total_curtidas?: number
          total_visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "estatisticas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estatisticas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estatisticas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          aprovado_por: string | null
          ativo: boolean
          atualizado_em: string
          categoria_id: string | null
          cidade_id: string
          criado_em: string
          data_aprovacao: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          destaque: boolean | null
          empresa_id: string | null
          endereco: string | null
          gratuito: boolean | null
          hora_fim: string | null
          id: string
          imagem_banner: string | null
          imagem_url: string | null
          limite_participantes: number | null
          local: string | null
          participantes_confirmados: number | null
          preco: number | null
          status_aprovacao:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          titulo: string
        }
        Insert: {
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          categoria_id?: string | null
          cidade_id: string
          criado_em?: string
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          destaque?: boolean | null
          empresa_id?: string | null
          endereco?: string | null
          gratuito?: boolean | null
          hora_fim?: string | null
          id?: string
          imagem_banner?: string | null
          imagem_url?: string | null
          limite_participantes?: number | null
          local?: string | null
          participantes_confirmados?: number | null
          preco?: number | null
          status_aprovacao?:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          titulo: string
        }
        Update: {
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          categoria_id?: string | null
          cidade_id?: string
          criado_em?: string
          data_aprovacao?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          destaque?: boolean | null
          empresa_id?: string | null
          endereco?: string | null
          gratuito?: boolean | null
          hora_fim?: string | null
          id?: string
          imagem_banner?: string | null
          imagem_url?: string | null
          limite_participantes?: number | null
          local?: string | null
          participantes_confirmados?: number | null
          preco?: number | null
          status_aprovacao?:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          criado_em: string
          empresa_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      home_sections_order: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          display_name: string
          id: string
          ordem: number
          section_name: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          display_name: string
          id?: string
          ordem?: number
          section_name: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          display_name?: string
          id?: string
          ordem?: number
          section_name?: string
        }
        Relationships: []
      }
      lugares_publicos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cidade_id: string
          criado_em: string
          descricao: string | null
          destaque: boolean
          endereco: string | null
          horario_funcionamento: Json | null
          id: string
          imagem_url: string | null
          localizacao: unknown
          nome: string
          telefone: string | null
          tipo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cidade_id: string
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          horario_funcionamento?: Json | null
          id?: string
          imagem_url?: string | null
          localizacao?: unknown
          nome: string
          telefone?: string | null
          tipo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cidade_id?: string
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          horario_funcionamento?: Json | null
          id?: string
          imagem_url?: string | null
          localizacao?: unknown
          nome?: string
          telefone?: string | null
          tipo?: string
        }
        Relationships: []
      }
      menu_configuracoes: {
        Row: {
          apenas_admin: boolean
          ativo: boolean
          atualizado_em: string
          criado_em: string
          icone: string
          id: string
          nome_item: string
          ordem: number
          posicao_desktop: string
          posicao_mobile: string
          rota: string
        }
        Insert: {
          apenas_admin?: boolean
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          icone: string
          id?: string
          nome_item: string
          ordem?: number
          posicao_desktop?: string
          posicao_mobile?: string
          rota: string
        }
        Update: {
          apenas_admin?: boolean
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          icone?: string
          id?: string
          nome_item?: string
          ordem?: number
          posicao_desktop?: string
          posicao_mobile?: string
          rota?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          conteudo: string | null
          criada_em: string
          id: string
          lida: boolean
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          conteudo?: string | null
          criada_em?: string
          id?: string
          lida?: boolean
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo: string
          usuario_id: string
        }
        Update: {
          conteudo?: string | null
          criada_em?: string
          id?: string
          lida?: boolean
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      planos: {
        Row: {
          acesso_eventos: boolean
          ativo: boolean
          criado_em: string
          descricao: string | null
          id: string
          limite_cupons: number
          limite_produtos: number
          nome: string
          preco_mensal: number
          prioridade_destaque: number
          produtos_destaque_permitidos: number
          suporte_prioritario: boolean
        }
        Insert: {
          acesso_eventos?: boolean
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          limite_cupons?: number
          limite_produtos?: number
          nome: string
          preco_mensal?: number
          prioridade_destaque?: number
          produtos_destaque_permitidos?: number
          suporte_prioritario?: boolean
        }
        Update: {
          acesso_eventos?: boolean
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          limite_cupons?: number
          limite_produtos?: number
          nome?: string
          preco_mensal?: number
          prioridade_destaque?: number
          produtos_destaque_permitidos?: number
          suporte_prioritario?: boolean
        }
        Relationships: []
      }
      problemas_cidade: {
        Row: {
          aprovado_por: string | null
          ativo: boolean
          atualizado_em: string
          bairro: string | null
          categoria_id: string | null
          cidade_id: string
          criado_em: string
          data_aprovacao: string | null
          data_moderacao: string | null
          descricao: string
          endereco: string
          id: string
          imagens: string[] | null
          localizacao: unknown
          moderado: boolean
          moderado_por: string | null
          observacoes_moderacao: string | null
          prioridade: Database["public"]["Enums"]["prioridade_problema"]
          resolvido_em: string | null
          resolvido_por: string | null
          status: Database["public"]["Enums"]["status_problema"]
          status_aprovacao:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          titulo: string
          usuario_id: string
          visualizacoes: number
          votos_negativos: number
          votos_positivos: number
        }
        Insert: {
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          bairro?: string | null
          categoria_id?: string | null
          cidade_id: string
          criado_em?: string
          data_aprovacao?: string | null
          data_moderacao?: string | null
          descricao: string
          endereco: string
          id?: string
          imagens?: string[] | null
          localizacao?: unknown
          moderado?: boolean
          moderado_por?: string | null
          observacoes_moderacao?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_problema"]
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: Database["public"]["Enums"]["status_problema"]
          status_aprovacao?:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          titulo: string
          usuario_id: string
          visualizacoes?: number
          votos_negativos?: number
          votos_positivos?: number
        }
        Update: {
          aprovado_por?: string | null
          ativo?: boolean
          atualizado_em?: string
          bairro?: string | null
          categoria_id?: string | null
          cidade_id?: string
          criado_em?: string
          data_aprovacao?: string | null
          data_moderacao?: string | null
          descricao?: string
          endereco?: string
          id?: string
          imagens?: string[] | null
          localizacao?: unknown
          moderado?: boolean
          moderado_por?: string | null
          observacoes_moderacao?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_problema"]
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: Database["public"]["Enums"]["status_problema"]
          status_aprovacao?:
            | Database["public"]["Enums"]["status_aprovacao"]
            | null
          titulo?: string
          usuario_id?: string
          visualizacoes?: number
          votos_negativos?: number
          votos_positivos?: number
        }
        Relationships: [
          {
            foreignKeyName: "problemas_cidade_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problemas_cidade_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_problema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "problemas_cidade_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria_produto: string | null
          codigo_produto: string | null
          criado_em: string
          descricao: string | null
          destaque: boolean
          empresa_id: string
          estoque_disponivel: number | null
          galeria_imagens: string[] | null
          id: string
          imagem_principal_url: string | null
          link_compra: string | null
          link_whatsapp: string | null
          nome: string
          preco_original: number
          preco_promocional: number | null
          tags: string[] | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria_produto?: string | null
          codigo_produto?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          empresa_id: string
          estoque_disponivel?: number | null
          galeria_imagens?: string[] | null
          id?: string
          imagem_principal_url?: string | null
          link_compra?: string | null
          link_whatsapp?: string | null
          nome: string
          preco_original: number
          preco_promocional?: number | null
          tags?: string[] | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria_produto?: string | null
          codigo_produto?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          empresa_id?: string
          estoque_disponivel?: number | null
          galeria_imagens?: string[] | null
          id?: string
          imagem_principal_url?: string | null
          link_compra?: string | null
          link_whatsapp?: string | null
          nome?: string
          preco_original?: number
          preco_promocional?: number | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_produtos_empresa_id"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produtos_empresa_id"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_produtos_empresa_id"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      respostas_enquete: {
        Row: {
          criado_em: string
          enquete_id: string
          id: string
          ip_address: string | null
          opcao_indice: number
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string
          enquete_id: string
          id?: string
          ip_address?: string | null
          opcao_indice: number
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string
          enquete_id?: string
          id?: string
          ip_address?: string | null
          opcao_indice?: number
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      resultados_sorteio: {
        Row: {
          atualizado_em: string
          canal_informativo_id: string
          criado_em: string
          data_sorteio: string
          id: string
          premios: Json
        }
        Insert: {
          atualizado_em?: string
          canal_informativo_id: string
          criado_em?: string
          data_sorteio: string
          id?: string
          premios?: Json
        }
        Update: {
          atualizado_em?: string
          canal_informativo_id?: string
          criado_em?: string
          data_sorteio?: string
          id?: string
          premios?: Json
        }
        Relationships: [
          {
            foreignKeyName: "resultados_sorteio_canal_informativo_id_fkey"
            columns: ["canal_informativo_id"]
            isOneToOne: false
            referencedRelation: "canal_informativo"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seguidores_problema: {
        Row: {
          criado_em: string
          id: string
          problema_id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          problema_id: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          problema_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguidores_problema_problema_id_fkey"
            columns: ["problema_id"]
            isOneToOne: false
            referencedRelation: "problemas_cidade"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_agendamento: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          descricao: string | null
          duracao_minutos: number
          empresa_id: string
          id: string
          nome_servico: string
          preco: number | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          duracao_minutos?: number
          empresa_id: string
          id?: string
          nome_servico: string
          preco?: number | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          duracao_minutos?: number
          empresa_id?: string
          id?: string
          nome_servico?: string
          preco?: number | null
        }
        Relationships: []
      }
      servicos_autonomos: {
        Row: {
          aprovado_por: string | null
          atualizado_em: string
          bairros_atendimento: string[]
          categoria_id: string
          cidade_id: string
          criado_em: string
          data_aprovacao: string | null
          descricao_servico: string
          email_prestador: string
          foto_perfil_url: string | null
          id: string
          nome_prestador: string
          observacoes_admin: string | null
          status_aprovacao: Database["public"]["Enums"]["status_servico"]
          telefone_prestador: string | null
          usuario_id: string | null
          visualizacoes: number
          whatsapp_prestador: string | null
        }
        Insert: {
          aprovado_por?: string | null
          atualizado_em?: string
          bairros_atendimento: string[]
          categoria_id: string
          cidade_id: string
          criado_em?: string
          data_aprovacao?: string | null
          descricao_servico: string
          email_prestador: string
          foto_perfil_url?: string | null
          id?: string
          nome_prestador: string
          observacoes_admin?: string | null
          status_aprovacao?: Database["public"]["Enums"]["status_servico"]
          telefone_prestador?: string | null
          usuario_id?: string | null
          visualizacoes?: number
          whatsapp_prestador?: string | null
        }
        Update: {
          aprovado_por?: string | null
          atualizado_em?: string
          bairros_atendimento?: string[]
          categoria_id?: string
          cidade_id?: string
          criado_em?: string
          data_aprovacao?: string | null
          descricao_servico?: string
          email_prestador?: string
          foto_perfil_url?: string | null
          id?: string
          nome_prestador?: string
          observacoes_admin?: string | null
          status_aprovacao?: Database["public"]["Enums"]["status_servico"]
          telefone_prestador?: string | null
          usuario_id?: string | null
          visualizacoes?: number
          whatsapp_prestador?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_autonomos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_autonomos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_autonomos_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_autonomos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      short_urls: {
        Row: {
          clicks: number
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          original_url: string
          short_code: string
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          original_url: string
          short_code: string
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          original_url?: string
          short_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          created_at: string | null
          id: string
          onesignal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          onesignal_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          onesignal_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usuario_empresa_admin: {
        Row: {
          ativo: boolean
          atribuido_por: string
          atualizado_em: string
          criado_em: string
          empresa_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean
          atribuido_por: string
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean
          atribuido_por?: string
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          atualizado_em: string
          cidade_id: string | null
          criado_em: string
          email: string
          id: string
          nome: string
          plano_id: string | null
          telefone: string | null
          tipo_conta: Database["public"]["Enums"]["tipo_conta"]
        }
        Insert: {
          atualizado_em?: string
          cidade_id?: string | null
          criado_em?: string
          email: string
          id: string
          nome: string
          plano_id?: string | null
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta"]
        }
        Update: {
          atualizado_em?: string
          cidade_id?: string | null
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          plano_id?: string | null
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas_emprego: {
        Row: {
          ativo: boolean
          atualizado_em: string
          bairro_id: string | null
          categoria_id: string
          cidade_id: string
          contato_candidatura: string
          criado_em: string
          criado_por: string
          descricao: string
          destaque: boolean
          faixa_salarial: string | null
          forma_candidatura: string
          id: string
          requisitos: string | null
          tipo_vaga: Database["public"]["Enums"]["tipo_vaga"]
          titulo: string
          visualizacoes: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          bairro_id?: string | null
          categoria_id: string
          cidade_id: string
          contato_candidatura: string
          criado_em?: string
          criado_por: string
          descricao: string
          destaque?: boolean
          faixa_salarial?: string | null
          forma_candidatura: string
          id?: string
          requisitos?: string | null
          tipo_vaga?: Database["public"]["Enums"]["tipo_vaga"]
          titulo: string
          visualizacoes?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          bairro_id?: string | null
          categoria_id?: string
          cidade_id?: string
          contato_candidatura?: string
          criado_em?: string
          criado_por?: string
          descricao?: string
          destaque?: boolean
          faixa_salarial?: string | null
          forma_candidatura?: string
          id?: string
          requisitos?: string | null
          tipo_vaga?: Database["public"]["Enums"]["tipo_vaga"]
          titulo?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "vagas_emprego_bairro_id_fkey"
            columns: ["bairro_id"]
            isOneToOne: false
            referencedRelation: "bairros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_emprego_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_emprego_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_emprego_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      votos_comentario: {
        Row: {
          comentario_id: string
          criado_em: string
          id: string
          tipo_voto: number
          usuario_id: string
        }
        Insert: {
          comentario_id: string
          criado_em?: string
          id?: string
          tipo_voto: number
          usuario_id: string
        }
        Update: {
          comentario_id?: string
          criado_em?: string
          id?: string
          tipo_voto?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_comentario_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios_problema"
            referencedColumns: ["id"]
          },
        ]
      }
      votos_problema: {
        Row: {
          criado_em: string
          id: string
          problema_id: string
          tipo_voto: number
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          problema_id: string
          tipo_voto: number
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          problema_id?: string
          tipo_voto?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_problema_problema_id_fkey"
            columns: ["problema_id"]
            isOneToOne: false
            referencedRelation: "problemas_cidade"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_empresas_populares: {
        Row: {
          categoria_nome: string | null
          cidade_id: string | null
          cidade_nome: string | null
          destaque: boolean | null
          id: string | null
          imagem_capa_url: string | null
          media_avaliacoes: number | null
          nome: string | null
          score_popularidade: number | null
          total_avaliacoes: number | null
          verificado: boolean | null
          visualizacoes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos_autonomos_publico: {
        Row: {
          categoria_id: string | null
          cidade_id: string | null
          criado_em: string | null
          descricao_servico: string | null
          foto_perfil_url: string | null
          id: string | null
          nome_prestador: string | null
          status_aprovacao: Database["public"]["Enums"]["status_servico"] | null
          visualizacoes: number | null
        }
        Insert: {
          categoria_id?: string | null
          cidade_id?: string | null
          criado_em?: string | null
          descricao_servico?: string | null
          foto_perfil_url?: string | null
          id?: string | null
          nome_prestador?: string | null
          status_aprovacao?:
            | Database["public"]["Enums"]["status_servico"]
            | null
          visualizacoes?: number | null
        }
        Update: {
          categoria_id?: string | null
          cidade_id?: string | null
          criado_em?: string | null
          descricao_servico?: string | null
          foto_perfil_url?: string | null
          id?: string | null
          nome_prestador?: string | null
          status_aprovacao?:
            | Database["public"]["Enums"]["status_servico"]
            | null
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_autonomos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_autonomos_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      view_empresas_estatisticas: {
        Row: {
          categoria_nome: string | null
          cidade_id: string | null
          cidade_nome: string | null
          criado_em: string | null
          destaque: boolean | null
          id: string | null
          media_avaliacoes: number | null
          nome: string | null
          total_avaliacoes: number | null
          verificado: boolean | null
          visualizacoes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      atualizar_estatisticas_empresa: {
        Args: { empresa_id_param: string }
        Returns: undefined
      }
      atualizar_horario_funcionamento: {
        Args: { empresa_id_param: string; horarios_param: Json }
        Returns: undefined
      }
      buscar_empresas_destaque: {
        Args: { cidade_id_param?: string; limite?: number }
        Returns: {
          categoria_nome: string
          endereco: string
          id: string
          imagem_capa_url: string
          media_avaliacoes: number
          nome: string
          prioridade_destaque: number
          total_avaliacoes: number
          verificado: boolean
        }[]
      }
      buscar_empresas_proximas: {
        Args: {
          categoria_id_param?: string
          cidade_id_param?: string
          lat: number
          limite?: number
          lng: number
          raio_km?: number
        }
        Returns: {
          categoria_nome: string
          destaque: boolean
          distancia_km: number
          endereco: string
          id: string
          imagem_capa_url: string
          media_avaliacoes: number
          nome: string
          telefone: string
          total_avaliacoes: number
          verificado: boolean
        }[]
      }
      buscar_enquete_ativa: {
        Args: never
        Returns: {
          descricao: string
          id: string
          multipla_escolha: boolean
          opcoes: Json
          resultados: Json
          titulo: string
          total_votos: number
        }[]
      }
      buscar_eventos_periodo: {
        Args: {
          cidade_id_param: string
          data_fim_param?: string
          data_inicio_param?: string
          limite?: number
        }
        Returns: {
          categoria_nome: string
          data_fim: string
          data_inicio: string
          descricao: string
          empresa_id: string
          empresa_nome: string
          endereco: string
          id: string
          imagem_banner: string
          local: string
          titulo: string
        }[]
      }
      buscar_resultado_sorteio: {
        Args: { canal_id: string }
        Returns: {
          data_sorteio: string
          id: string
          premios: Json
        }[]
      }
      can_assign_role: {
        Args: { target_role: Database["public"]["Enums"]["tipo_conta"] }
        Returns: boolean
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      criar_resultado_sorteio: {
        Args: {
          canal_id: string
          data_sorteio_param: string
          premios_param: Json
        }
        Returns: undefined
      }
      deletar_eventos_finalizados_antigos: { Args: never; Returns: undefined }
      empresa_esta_favoritada: {
        Args: { empresa_id_param: string; usuario_id_param: string }
        Returns: boolean
      }
      estatisticas_cidade: {
        Args: { cidade_id_param: string }
        Returns: {
          categorias_ativas: number
          empresas_verificadas: number
          media_geral_avaliacoes: number
          total_avaliacoes: number
          total_empresas: number
          total_eventos: number
          total_visualizacoes: number
        }[]
      }
      finalizar_eventos_expirados: { Args: never; Returns: undefined }
      generate_short_code: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_admin_site_stats: { Args: never; Returns: Json }
      get_servicos_with_secure_contact: {
        Args: { categoria_slug?: string; search_term?: string }
        Returns: {
          categoria_nome: string
          criado_em: string
          descricao_servico: string
          email_prestador: string
          foto_perfil_url: string
          id: string
          nome_prestador: string
          status_aprovacao: Database["public"]["Enums"]["status_servico"]
          telefone_prestador: string
          usuario_id: string
          visualizacoes: number
          whatsapp_prestador: string
        }[]
      }
      increment_url_clicks: { Args: { code: string }; Returns: string }
      incrementar_visualizacao_problema: {
        Args: { problema_id_param: string }
        Returns: undefined
      }
      incrementar_visualizacao_servico: {
        Args: { servico_id: string }
        Returns: undefined
      }
      incrementar_visualizacao_vaga: {
        Args: { vaga_id: string }
        Returns: undefined
      }
      limpar_urls_google: { Args: never; Returns: undefined }
      refresh_empresas_populares: { Args: never; Returns: undefined }
      usar_cupom: { Args: { cupom_id_param: string }; Returns: boolean }
      user_has_permission: {
        Args: { target_cidade_id?: string; target_user_id?: string }
        Returns: boolean
      }
      validar_cupom: {
        Args: { codigo_param: string; empresa_id_param: string }
        Returns: {
          cupom_id: string
          mensagem: string
          tipo: string
          titulo: string
          valido: boolean
          valor: number
        }[]
      }
      votar_enquete: {
        Args: {
          enquete_id_param: string
          ip_param?: string
          opcoes_indices: number[]
          user_agent_param?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      prioridade_problema: "baixa" | "media" | "alta" | "urgente"
      status_aprovacao: "pendente" | "aprovado" | "rejeitado" | "finalizado"
      status_problema: "aberto" | "em_analise" | "resolvido" | "fechado"
      status_servico: "pendente" | "aprovado" | "rejeitado"
      tipo_categoria: "empresa" | "evento" | "servico"
      tipo_conta:
        | "admin_geral"
        | "admin_cidade"
        | "empresa"
        | "usuario"
        | "criador_empresa"
      tipo_conteudo_canal: "noticia" | "video" | "imagem" | "resultado_sorteio"
      tipo_cupom: "porcentagem" | "valor_fixo"
      tipo_secao_banner:
        | "home"
        | "empresas"
        | "eventos"
        | "categorias"
        | "busca"
        | "canal_video"
      tipo_vaga: "clt" | "temporario" | "estagio" | "freelance"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      prioridade_problema: ["baixa", "media", "alta", "urgente"],
      status_aprovacao: ["pendente", "aprovado", "rejeitado", "finalizado"],
      status_problema: ["aberto", "em_analise", "resolvido", "fechado"],
      status_servico: ["pendente", "aprovado", "rejeitado"],
      tipo_categoria: ["empresa", "evento", "servico"],
      tipo_conta: [
        "admin_geral",
        "admin_cidade",
        "empresa",
        "usuario",
        "criador_empresa",
      ],
      tipo_conteudo_canal: ["noticia", "video", "imagem", "resultado_sorteio"],
      tipo_cupom: ["porcentagem", "valor_fixo"],
      tipo_secao_banner: [
        "home",
        "empresas",
        "eventos",
        "categorias",
        "busca",
        "canal_video",
      ],
      tipo_vaga: ["clt", "temporario", "estagio", "freelance"],
    },
  },
} as const
