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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achados_perdidos: {
        Row: {
          categoria: string
          contato_nome: string
          contato_telefone: string
          created_at: string
          descricao: string
          id: string
          local_fato: string
          status: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          categoria: string
          contato_nome: string
          contato_telefone: string
          created_at?: string
          descricao: string
          id?: string
          local_fato: string
          status?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          categoria?: string
          contato_nome?: string
          contato_telefone?: string
          created_at?: string
          descricao?: string
          id?: string
          local_fato?: string
          status?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
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
      badges: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
          points_reward: number | null
          rarity: string | null
          requirement_count: number | null
          requirement_type: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          points_reward?: number | null
          rarity?: string | null
          requirement_count?: number | null
          requirement_type?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          points_reward?: number | null
          rarity?: string | null
          requirement_count?: number | null
          requirement_type?: string | null
        }
        Relationships: []
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
          codigo_html: string | null
          criado_em: string
          id: string
          imagem_url: string | null
          link_url: string | null
          ordem: number
          secao: Database["public"]["Enums"]["tipo_secao_banner"]
          tipo_midia: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          codigo_html?: string | null
          criado_em?: string
          id?: string
          imagem_url?: string | null
          link_url?: string | null
          ordem?: number
          secao?: Database["public"]["Enums"]["tipo_secao_banner"]
          tipo_midia?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          codigo_html?: string | null
          criado_em?: string
          id?: string
          imagem_url?: string | null
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
      cobrancas_usuario: {
        Row: {
          chave_pix: string | null
          cliente: string
          created_at: string
          descricao: string | null
          id: string
          observacoes: string | null
          status: string | null
          telefone: string | null
          user_id: string
          valor: string
          vencimento: string | null
        }
        Insert: {
          chave_pix?: string | null
          cliente: string
          created_at?: string
          descricao?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          user_id: string
          valor: string
          vencimento?: string | null
        }
        Update: {
          chave_pix?: string | null
          cliente?: string
          created_at?: string
          descricao?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
          telefone?: string | null
          user_id?: string
          valor?: string
          vencimento?: string | null
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
          google_analytics_id: string | null
          id: string
          link_termos: string | null
          manutencao: boolean | null
          mensagem_manutencao: string | null
          meta_pixel_id: string | null
          seo_descricao: string | null
          seo_tags: string | null
          seo_titulo: string | null
          texto_rodape: string | null
          updated_at: string | null
          whatsapp_suporte: string | null
        }
        Insert: {
          google_analytics_id?: string | null
          id?: string
          link_termos?: string | null
          manutencao?: boolean | null
          mensagem_manutencao?: string | null
          meta_pixel_id?: string | null
          seo_descricao?: string | null
          seo_tags?: string | null
          seo_titulo?: string | null
          texto_rodape?: string | null
          updated_at?: string | null
          whatsapp_suporte?: string | null
        }
        Update: {
          google_analytics_id?: string | null
          id?: string
          link_termos?: string | null
          manutencao?: boolean | null
          mensagem_manutencao?: string | null
          meta_pixel_id?: string | null
          seo_descricao?: string | null
          seo_tags?: string | null
          seo_titulo?: string | null
          texto_rodape?: string | null
          updated_at?: string | null
          whatsapp_suporte?: string | null
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          attribution_model: string | null
          conversion_type: string
          conversion_value: number | null
          created_at: string | null
          empresa_id: string | null
          evento_id: string | null
          first_touch_source: string | null
          id: string
          last_touch_source: string | null
          metadata: Json | null
          produto_id: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          attribution_model?: string | null
          conversion_type: string
          conversion_value?: number | null
          created_at?: string | null
          empresa_id?: string | null
          evento_id?: string | null
          first_touch_source?: string | null
          id?: string
          last_touch_source?: string | null
          metadata?: Json | null
          produto_id?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          attribution_model?: string | null
          conversion_type?: string
          conversion_value?: number | null
          created_at?: string | null
          empresa_id?: string | null
          evento_id?: string | null
          first_touch_source?: string | null
          id?: string
          last_touch_source?: string | null
          metadata?: Json | null
          produto_id?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
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
      domino_estatisticas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          derrotas: number
          id: string
          partidas_jogadas: number
          usuario_id: string
          vitorias: number
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          derrotas?: number
          id?: string
          partidas_jogadas?: number
          usuario_id: string
          vitorias?: number
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          derrotas?: number
          id?: string
          partidas_jogadas?: number
          usuario_id?: string
          vitorias?: number
        }
        Relationships: [
          {
            foreignKeyName: "domino_estatisticas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      domino_fila: {
        Row: {
          entrou_em: string
          id: string
          usuario_id: string | null
        }
        Insert: {
          entrou_em?: string
          id?: string
          usuario_id?: string | null
        }
        Update: {
          entrou_em?: string
          id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      domino_salas: {
        Row: {
          atualizado_em: string
          criado_em: string
          historico_jogadas: Json | null
          id: string
          jogador_1_id: string | null
          jogador_2_id: string | null
          mesa_ponta_direita: number | null
          mesa_ponta_esquerda: number | null
          numero_sala: number
          passadas_count: number | null
          status: string
          vez_usuario_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          historico_jogadas?: Json | null
          id?: string
          jogador_1_id?: string | null
          jogador_2_id?: string | null
          mesa_ponta_direita?: number | null
          mesa_ponta_esquerda?: number | null
          numero_sala: number
          passadas_count?: number | null
          status?: string
          vez_usuario_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          historico_jogadas?: Json | null
          id?: string
          jogador_1_id?: string | null
          jogador_2_id?: string | null
          mesa_ponta_direita?: number | null
          mesa_ponta_esquerda?: number | null
          numero_sala?: number
          passadas_count?: number | null
          status?: string
          vez_usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domino_salas_jogador_1_id_fkey"
            columns: ["jogador_1_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domino_salas_jogador_2_id_fkey"
            columns: ["jogador_2_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domino_salas_vez_usuario_id_fkey"
            columns: ["vez_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
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
          codigo_suporte: string | null
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
          personalizacao_pagina: Json | null
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
          codigo_suporte?: string | null
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
          personalizacao_pagina?: Json | null
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
          codigo_suporte?: string | null
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
          personalizacao_pagina?: Json | null
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
      estatisticas_pwa: {
        Row: {
          criado_at: string
          evento: string
          id: string
          plataforma: string | null
        }
        Insert: {
          criado_at?: string
          evento: string
          id?: string
          plataforma?: string | null
        }
        Update: {
          criado_at?: string
          evento?: string
          id?: string
          plataforma?: string | null
        }
        Relationships: []
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
      gamification_levels: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          level: number
          max_points: number | null
          min_points: number
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          level: number
          max_points?: number | null
          min_points: number
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          level?: number
          max_points?: number | null
          min_points?: number
          name?: string
        }
        Relationships: []
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
      leaderboard_cache: {
        Row: {
          badges_count: number | null
          current_level: number | null
          last_updated: string | null
          monthly_points: number | null
          rank_position: number | null
          total_points: number | null
          user_id: string
          weekly_points: number | null
          weekly_rank_position: number | null
        }
        Insert: {
          badges_count?: number | null
          current_level?: number | null
          last_updated?: string | null
          monthly_points?: number | null
          rank_position?: number | null
          total_points?: number | null
          user_id: string
          weekly_points?: number | null
          weekly_rank_position?: number | null
        }
        Update: {
          badges_count?: number | null
          current_level?: number | null
          last_updated?: string | null
          monthly_points?: number | null
          rank_position?: number | null
          total_points?: number | null
          user_id?: string
          weekly_points?: number | null
          weekly_rank_position?: number | null
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
      missions: {
        Row: {
          action_key: string
          color: string | null
          created_at: string | null
          description: string
          end_date: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          points: number
          start_date: string | null
          target_count: number | null
          title: string
          type: string
        }
        Insert: {
          action_key: string
          color?: string | null
          created_at?: string | null
          description: string
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          start_date?: string | null
          target_count?: number | null
          title: string
          type?: string
        }
        Update: {
          action_key?: string
          color?: string | null
          created_at?: string | null
          description?: string
          end_date?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          start_date?: string | null
          target_count?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      notificacoes_whatsapp_log: {
        Row: {
          destinatario_telefone: string
          empresa_id: string
          enviado_em: string
          erro_mensagem: string | null
          id: string
          payload: Json | null
          sucesso: boolean
          tipo_notificacao: string
        }
        Insert: {
          destinatario_telefone: string
          empresa_id: string
          enviado_em?: string
          erro_mensagem?: string | null
          id?: string
          payload?: Json | null
          sucesso?: boolean
          tipo_notificacao: string
        }
        Update: {
          destinatario_telefone?: string
          empresa_id?: string
          enviado_em?: string
          erro_mensagem?: string | null
          id?: string
          payload?: Json | null
          sucesso?: boolean
          tipo_notificacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_whatsapp_log_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_whatsapp_log_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_whatsapp_log_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          action_label: string | null
          action_url: string | null
          audience_type: string
          category: string
          channels: Json
          completed_at: string | null
          created_at: string
          created_by: string
          icon_url: string | null
          id: string
          image_url: string | null
          last_error: string | null
          message: string
          metadata: Json
          priority: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          target_user_ids: string[]
          title: string
          total_deliveries: number
          total_failed: number
          total_recipients: number
          total_sent: number
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          audience_type?: string
          category?: string
          channels?: Json
          completed_at?: string | null
          created_at?: string
          created_by: string
          icon_url?: string | null
          id?: string
          image_url?: string | null
          last_error?: string | null
          message: string
          metadata?: Json
          priority?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_user_ids?: string[]
          title: string
          total_deliveries?: number
          total_failed?: number
          total_recipients?: number
          total_sent?: number
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          audience_type?: string
          category?: string
          channels?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string
          icon_url?: string | null
          id?: string
          image_url?: string | null
          last_error?: string | null
          message?: string
          metadata?: Json
          priority?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_user_ids?: string[]
          title?: string
          total_deliveries?: number
          total_failed?: number
          total_recipients?: number
          total_sent?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          attempt_count: number
          campaign_id: string | null
          channel: string
          created_at: string
          device_id: string | null
          error_code: string | null
          error_message: string | null
          id: string
          next_attempt_at: string
          notification_id: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          campaign_id?: string | null
          channel?: string
          created_at?: string
          device_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          next_attempt_at?: string
          notification_id: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          campaign_id?: string | null
          channel?: string
          created_at?: string
          device_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          next_attempt_at?: string
          notification_id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "notification_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_devices: {
        Row: {
          created_at: string
          device_name: string | null
          enabled: boolean
          id: string
          last_seen_at: string
          platform: string
          registration_id: string
          revoked_at: string | null
          target_type: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          enabled?: boolean
          id?: string
          last_seen_at?: string
          platform?: string
          registration_id: string
          revoked_at?: string | null
          target_type?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          enabled?: boolean
          id?: string
          last_seen_at?: string
          platform?: string
          registration_id?: string
          revoked_at?: string | null
          target_type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_internal_settings: {
        Row: {
          created_at: string
          secret_value: string
          setting_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          secret_value: string
          setting_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          secret_value?: string
          setting_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          community_enabled: boolean
          created_at: string
          events_enabled: boolean
          in_app_enabled: boolean
          marketing_enabled: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          system_enabled: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_enabled?: boolean
          created_at?: string
          events_enabled?: boolean
          in_app_enabled?: boolean
          marketing_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_enabled?: boolean
          created_at?: string
          events_enabled?: boolean
          in_app_enabled?: boolean
          marketing_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_enabled?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          campaign_id: string | null
          category: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          message: string | null
          metadata: Json
          priority: string
          read: boolean
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          campaign_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          metadata?: Json
          priority?: string
          read?: boolean
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          campaign_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          metadata?: Json
          priority?: string
          read?: boolean
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos_planos: {
        Row: {
          atualizado_em: string
          comprovante_url: string | null
          criado_em: string
          data_pagamento: string
          data_vencimento: string
          empresa_id: string
          forma_pagamento: string
          id: string
          observacoes: string | null
          plano_id: string
          status: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          comprovante_url?: string | null
          criado_em?: string
          data_pagamento?: string
          data_vencimento: string
          empresa_id: string
          forma_pagamento: string
          id?: string
          observacoes?: string | null
          plano_id: string
          status?: string
          valor: number
        }
        Update: {
          atualizado_em?: string
          comprovante_url?: string | null
          criado_em?: string
          data_pagamento?: string
          data_vencimento?: string
          empresa_id?: string
          forma_pagamento?: string
          id?: string
          observacoes?: string | null
          plano_id?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_planos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_planos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_planos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_planos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          acesso_eventos: boolean
          ativo: boolean
          badge_verificacao: boolean
          criado_em: string
          descricao: string | null
          dias_destaque: number
          estatisticas_avancadas: boolean
          id: string
          limite_agendamentos_mes: number
          limite_cupons: number
          limite_enderecos: number
          limite_fotos_galeria: number
          limite_notificacoes_whatsapp_mes: number
          limite_produtos: number
          limite_vagas: number
          nome: string
          personalizacao_pagina: boolean
          plano_personalizado: boolean
          preco_mensal: number
          prioridade_busca: number
          prioridade_destaque: number
          prioridade_ranking: number
          produtos_destaque_permitidos: number
          responder_avaliacoes: boolean
          seo_otimizado: boolean
          suporte_prioritario: boolean
          whatsapp_contato: string | null
        }
        Insert: {
          acesso_eventos?: boolean
          ativo?: boolean
          badge_verificacao?: boolean
          criado_em?: string
          descricao?: string | null
          dias_destaque?: number
          estatisticas_avancadas?: boolean
          id?: string
          limite_agendamentos_mes?: number
          limite_cupons?: number
          limite_enderecos?: number
          limite_fotos_galeria?: number
          limite_notificacoes_whatsapp_mes?: number
          limite_produtos?: number
          limite_vagas?: number
          nome: string
          personalizacao_pagina?: boolean
          plano_personalizado?: boolean
          preco_mensal?: number
          prioridade_busca?: number
          prioridade_destaque?: number
          prioridade_ranking?: number
          produtos_destaque_permitidos?: number
          responder_avaliacoes?: boolean
          seo_otimizado?: boolean
          suporte_prioritario?: boolean
          whatsapp_contato?: string | null
        }
        Update: {
          acesso_eventos?: boolean
          ativo?: boolean
          badge_verificacao?: boolean
          criado_em?: string
          descricao?: string | null
          dias_destaque?: number
          estatisticas_avancadas?: boolean
          id?: string
          limite_agendamentos_mes?: number
          limite_cupons?: number
          limite_enderecos?: number
          limite_fotos_galeria?: number
          limite_notificacoes_whatsapp_mes?: number
          limite_produtos?: number
          limite_vagas?: number
          nome?: string
          personalizacao_pagina?: boolean
          plano_personalizado?: boolean
          preco_mensal?: number
          prioridade_busca?: number
          prioridade_destaque?: number
          prioridade_ranking?: number
          produtos_destaque_permitidos?: number
          responder_avaliacoes?: boolean
          seo_otimizado?: boolean
          suporte_prioritario?: boolean
          whatsapp_contato?: string | null
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
      rifas_usuarios: {
        Row: {
          chave_pix: string | null
          created_at: string
          data_sorteio: string
          hora_sorteio: string
          id: string
          numeros: Json
          premio: string
          qtd_numeros: string
          titulo: string
          user_id: string | null
          valor_numero: string
        }
        Insert: {
          chave_pix?: string | null
          created_at?: string
          data_sorteio: string
          hora_sorteio: string
          id?: string
          numeros?: Json
          premio: string
          qtd_numeros: string
          titulo: string
          user_id?: string | null
          valor_numero: string
        }
        Update: {
          chave_pix?: string | null
          created_at?: string
          data_sorteio?: string
          hora_sorteio?: string
          id?: string
          numeros?: Json
          premio?: string
          qtd_numeros?: string
          titulo?: string
          user_id?: string | null
          valor_numero?: string
        }
        Relationships: []
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
          link_type: string
          original_url: string
          resource_id: string | null
          short_code: string
          updated_at: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_type?: string
          original_url: string
          resource_id?: string | null
          short_code: string
          updated_at?: string
        }
        Update: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          link_type?: string
          original_url?: string
          resource_id?: string | null
          short_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      suporte_logs: {
        Row: {
          atendente: string | null
          codigo_usado: string
          criado_em: string | null
          empresa_id: string | null
          finalizado_em: string | null
          id: string
          mensagem: string | null
          metadata: Json | null
          status: string | null
          tipo_atendimento: string | null
        }
        Insert: {
          atendente?: string | null
          codigo_usado: string
          criado_em?: string | null
          empresa_id?: string | null
          finalizado_em?: string | null
          id?: string
          mensagem?: string | null
          metadata?: Json | null
          status?: string | null
          tipo_atendimento?: string | null
        }
        Update: {
          atendente?: string | null
          codigo_usado?: string
          criado_em?: string | null
          empresa_id?: string | null
          finalizado_em?: string | null
          id?: string
          mensagem?: string | null
          metadata?: Json | null
          status?: string | null
          tipo_atendimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suporte_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suporte_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suporte_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
        ]
      }
      suporte_sessoes_ativas: {
        Row: {
          atualizado_em: string
          codigo_validado: string | null
          criado_em: string
          duvida_cliente: string | null
          empresa_id: string | null
          empresa_nome: string | null
          empresa_telefone: string | null
          etapa: string
          expira_em: string
          id: string
          telefone: string
        }
        Insert: {
          atualizado_em?: string
          codigo_validado?: string | null
          criado_em?: string
          duvida_cliente?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          empresa_telefone?: string | null
          etapa?: string
          expira_em?: string
          id?: string
          telefone: string
        }
        Update: {
          atualizado_em?: string
          codigo_validado?: string | null
          criado_em?: string
          duvida_cliente?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          empresa_telefone?: string | null
          etapa?: string
          expira_em?: string
          id?: string
          telefone?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journey: {
        Row: {
          action_taken: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          page_title: string | null
          page_url: string
          session_id: string
          step_number: number
          time_from_previous_step: number | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page_title?: string | null
          page_url: string
          session_id: string
          step_number: number
          time_from_previous_step?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page_title?: string | null
          page_url?: string
          session_id?: string
          step_number?: number
          time_from_previous_step?: number | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string
          period_start: string | null
          progress: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          period_start?: string | null
          progress?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          period_start?: string | null
          progress?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          action_description: string | null
          action_type: string
          created_at: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          action_description?: string | null
          action_type: string
          created_at?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          action_description?: string | null
          action_type?: string
          created_at?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          cidade_id: string | null
          conversion_type: string | null
          conversion_value: number | null
          converted: boolean | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          entry_referrer: string | null
          entry_url: string | null
          exit_url: string | null
          id: string
          ip_address: string | null
          os: string | null
          pages_visited: number | null
          session_id: string
          started_at: string | null
          total_clicks: number | null
          total_scrolls: number | null
          updated_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          cidade_id?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_referrer?: string | null
          entry_url?: string | null
          exit_url?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          pages_visited?: number | null
          session_id: string
          started_at?: string | null
          total_clicks?: number | null
          total_scrolls?: number | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          cidade_id?: string | null
          conversion_type?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          entry_referrer?: string | null
          entry_url?: string | null
          exit_url?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          pages_visited?: number | null
          session_id?: string
          started_at?: string | null
          total_clicks?: number | null
          total_scrolls?: number | null
          updated_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tracking_events: {
        Row: {
          browser: string | null
          cidade_id: string | null
          click_position: Json | null
          created_at: string | null
          cupom_id: string | null
          device_type: string | null
          element_class: string | null
          element_id: string | null
          element_text: string | null
          empresa_id: string | null
          event_name: string
          event_type: string
          evento_id: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          os: string | null
          page_load_time: number | null
          page_title: string | null
          page_url: string
          produto_id: string | null
          referrer: string | null
          screen_resolution: string | null
          scroll_depth: number | null
          session_id: string
          time_on_page: number | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          cidade_id?: string | null
          click_position?: Json | null
          created_at?: string | null
          cupom_id?: string | null
          device_type?: string | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          empresa_id?: string | null
          event_name: string
          event_type: string
          evento_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          os?: string | null
          page_load_time?: number | null
          page_title?: string | null
          page_url: string
          produto_id?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          scroll_depth?: number | null
          session_id: string
          time_on_page?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          cidade_id?: string | null
          click_position?: Json | null
          created_at?: string | null
          cupom_id?: string | null
          device_type?: string | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          empresa_id?: string | null
          event_name?: string
          event_type?: string
          evento_id?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          os?: string | null
          page_load_time?: number | null
          page_title?: string | null
          page_url?: string
          produto_id?: string | null
          referrer?: string | null
          screen_resolution?: string | null
          scroll_depth?: number | null
          session_id?: string
          time_on_page?: number | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tracking_events_cidade_id_fkey"
            columns: ["cidade_id"]
            isOneToOne: false
            referencedRelation: "cidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tracking_events_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tracking_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tracking_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "mv_empresas_populares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tracking_events_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "view_empresas_estatisticas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tracking_events_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tracking_events_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
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
          badges_count: number | null
          cidade_id: string | null
          criado_em: string
          current_level: number | null
          email: string
          foto_url: string | null
          id: string
          last_activity_date: string | null
          monthly_points: number | null
          nome: string
          plano_id: string | null
          telefone: string | null
          tipo_conta: Database["public"]["Enums"]["tipo_conta"]
          total_points: number | null
          weekly_points: number | null
        }
        Insert: {
          atualizado_em?: string
          badges_count?: number | null
          cidade_id?: string | null
          criado_em?: string
          current_level?: number | null
          email: string
          foto_url?: string | null
          id: string
          last_activity_date?: string | null
          monthly_points?: number | null
          nome: string
          plano_id?: string | null
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta"]
          total_points?: number | null
          weekly_points?: number | null
        }
        Update: {
          atualizado_em?: string
          badges_count?: number | null
          cidade_id?: string | null
          criado_em?: string
          current_level?: number | null
          email?: string
          foto_url?: string | null
          id?: string
          last_activity_date?: string | null
          monthly_points?: number | null
          nome?: string
          plano_id?: string | null
          telefone?: string | null
          tipo_conta?: Database["public"]["Enums"]["tipo_conta"]
          total_points?: number | null
          weekly_points?: number | null
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
      add_user_points: {
        Args: {
          p_action_description?: string
          p_action_type: string
          p_points: number
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      atualizar_estatisticas_empresa: {
        Args: { empresa_id_param: string }
        Returns: undefined
      }
      atualizar_horario_funcionamento: {
        Args: { empresa_id_param: string; horarios_param: Json }
        Returns: undefined
      }
      atualizar_sessao_suporte: {
        Args: {
          p_codigo: string
          p_empresa_nome: string
          p_empresa_telefone: string
          p_etapa?: string
          p_telefone: string
        }
        Returns: {
          out_codigo: string
          out_empresa_nome: string
          out_empresa_telefone: string
          out_etapa: string
          out_telefone: string
        }[]
      }
      atualizar_status_item: {
        Args: { p_item_id: string; p_novo_status: string; p_usuario_id: string }
        Returns: Json
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
      buscar_locais_google: {
        Args: { busca_termo: string; google_key: string }
        Returns: Json
      }
      buscar_resultado_sorteio: {
        Args: { canal_id: string }
        Returns: {
          data_sorteio: string
          id: string
          premios: Json
        }[]
      }
      calculate_user_level: { Args: { p_points: number }; Returns: number }
      calculate_user_total_points: {
        Args: { p_user_id: string }
        Returns: number
      }
      can_assign_role: {
        Args: { target_role: Database["public"]["Enums"]["tipo_conta"] }
        Returns: boolean
      }
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      claim_notification_campaigns: {
        Args: { p_campaign_id?: string; p_limit?: number }
        Returns: {
          action_label: string | null
          action_url: string | null
          audience_type: string
          category: string
          channels: Json
          completed_at: string | null
          created_at: string
          created_by: string
          icon_url: string | null
          id: string
          image_url: string | null
          last_error: string | null
          message: string
          metadata: Json
          priority: string
          scheduled_at: string | null
          started_at: string | null
          status: string
          target_user_ids: string[]
          title: string
          total_deliveries: number
          total_failed: number
          total_recipients: number
          total_sent: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_campaigns"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_notification_deliveries: {
        Args: { p_limit?: number }
        Returns: {
          attempt_count: number
          campaign_id: string | null
          channel: string
          created_at: string
          device_id: string | null
          error_code: string | null
          error_message: string | null
          id: string
          next_attempt_at: string
          notification_id: string
          provider_message_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notification_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      create_responsibility_request_notification: {
        Args: {
          p_email?: string
          p_empresa_id: string
          p_empresa_nome: string
          p_nome: string
          p_observacoes?: string
          p_telefone: string
          p_whatsapp?: string
        }
        Returns: number
      }
      criar_agendamento_publico: {
        Args: {
          p_data_agendamento: string
          p_empresa_id: string
          p_nome_cliente: string
          p_observacoes?: string
          p_servico: string
          p_telefone_cliente: string
        }
        Returns: string
      }
      criar_resultado_sorteio: {
        Args: {
          canal_id: string
          data_sorteio_param: string
          premios_param: Json
        }
        Returns: undefined
      }
      deletar_eventos_finalizados_antigos: { Args: never; Returns: undefined }
      deletar_rifas_expiradas: { Args: never; Returns: undefined }
      empresa_esta_favoritada: {
        Args: { empresa_id_param: string; usuario_id_param: string }
        Returns: boolean
      }
      empresa_pode_receber_agendamento: {
        Args: { p_empresa_id: string }
        Returns: boolean
      }
      encerrar_sessao_suporte: {
        Args: { p_telefone: string }
        Returns: undefined
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
      create_raffle_short_url: {
        Args: { p_raffle_id: string }
        Returns: string
      }
      generate_short_code: { Args: never; Returns: string }
      gerar_codigo_suporte: { Args: never; Returns: string }
      get_admin_site_stats: { Args: never; Returns: Json }
      get_current_user_role: { Args: never; Returns: string }
      get_problema_autor_nome: {
        Args: { usuario_id_param: string }
        Returns: string
      }
      get_public_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          badges_count: number
          current_level: number
          nome: string
          rank_position: number
          total_points: number
          user_id: string
          weekly_points: number
        }[]
      }
      get_public_user_profile: {
        Args: { user_uuid: string }
        Returns: {
          badges_count: number
          criado_em: string
          current_level: number
          foto_url: string
          id: string
          nome: string
          total_points: number
          weekly_points: number
        }[]
      }
      get_servicos_publicos: {
        Args: never
        Returns: {
          categoria_id: string
          cidade_id: string
          created_at: string
          descricao: string
          email: string
          id: string
          imagem_url: string
          status_aprovacao: string
          telefone: string
          titulo: string
          updated_at: string
          user_id: string
          whatsapp: string
        }[]
      }
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
      get_user_primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_weekly_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          badges_count: number
          current_level: number
          nome: string
          total_points: number
          user_id: string
          weekly_points: number
          weekly_rank_position: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      importar_detalhes_google:
        | { Args: { google_key: string; p_place_id: string }; Returns: Json }
        | {
            Args: {
              google_key: string
              p_categoria_id: string
              p_place_id: string
            }
            Returns: Json
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      limpar_sessoes_expiradas: { Args: never; Returns: undefined }
      limpar_urls_google: { Args: never; Returns: undefined }
      normalizar_telefone: { Args: { p_telefone: string }; Returns: string }
      resolve_short_url: {
        Args: { p_short_code: string }
        Returns: string
      }
      obter_sessao_suporte: {
        Args: { p_telefone: string }
        Returns: {
          out_codigo: string
          out_duvida: string
          out_empresa_nome: string
          out_empresa_telefone: string
          out_etapa: string
          out_telefone: string
        }[]
      }
      refresh_empresas_populares: { Args: never; Returns: undefined }
      register_notification_device: {
        Args: {
          p_device_name?: string
          p_platform?: string
          p_registration_id: string
          p_target_type?: string
          p_user_agent?: string
        }
        Returns: string
      }
      registrar_duvida_suporte: {
        Args: { p_duvida: string; p_telefone: string }
        Returns: {
          out_codigo: string
          out_duvida: string
          out_empresa_nome: string
          out_empresa_telefone: string
          out_etapa: string
          out_telefone: string
        }[]
      }
      reset_monthly_points: { Args: never; Returns: undefined }
      reset_weekly_points: { Args: never; Returns: undefined }
      save_coupon_with_mission: {
        Args: { p_cupom_id: string }
        Returns: undefined
      }
      track_empresa_visit: {
        Args: { p_empresa_id: string }
        Returns: undefined
      }
      unregister_notification_device: {
        Args: { p_registration_id: string }
        Returns: boolean
      }
      update_leaderboard: { Args: never; Returns: undefined }
      update_mission_progress: {
        Args: { p_action_key: string; p_user_id: string }
        Returns: undefined
      }
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
      verificar_limite_notificacoes_whatsapp: {
        Args: { p_empresa_id: string; p_tipo_notificacao?: string }
        Returns: Json
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
      app_role:
        | "usuario"
        | "criador_empresa"
        | "empresa"
        | "admin_cidade"
        | "admin_geral"
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
        | "domino"
        | "gerador_rifa"
        | "ferramentas"
        | "gerador_cobranca"
        | "criador_curriculo"
        | "gestao_cobrancas"
        | "calculadora_orcamento"
        | "calculadora_margem"
        | "simulador_rescisao"
        | "leitor_voz"
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
      app_role: [
        "usuario",
        "criador_empresa",
        "empresa",
        "admin_cidade",
        "admin_geral",
      ],
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
        "domino",
        "gerador_rifa",
        "ferramentas",
        "gerador_cobranca",
        "criador_curriculo",
        "gestao_cobrancas",
        "calculadora_orcamento",
        "calculadora_margem",
        "simulador_rescisao",
        "leitor_voz",
      ],
      tipo_vaga: ["clt", "temporario", "estagio", "freelance"],
    },
  },
} as const
