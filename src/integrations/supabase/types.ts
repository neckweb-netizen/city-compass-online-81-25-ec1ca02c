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
          usuario_id: string | null
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
          usuario_id?: string | null
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
          usuario_id?: string | null
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          atualizado_em: string
          criado_em: string
          cliente_usuario_id: string | null
          data_agendamento: string
          duracao_minutos: number
          empresa_id: string
          id: string
          nome_cliente: string
          observacoes: string | null
          servico: string
          servico_id: string | null
          status: string
          telefone_cliente: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          cliente_usuario_id?: string | null
          data_agendamento: string
          duracao_minutos?: number
          empresa_id: string
          id?: string
          nome_cliente: string
          observacoes?: string | null
          servico: string
          servico_id?: string | null
          status?: string
          telefone_cliente: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          cliente_usuario_id?: string | null
          data_agendamento?: string
          duracao_minutos?: number
          empresa_id?: string
          id?: string
          nome_cliente?: string
          observacoes?: string | null
          servico?: string
          servico_id?: string | null
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
          agendamento_antecedencia_minutos: number
          agendamento_dias_semana: number[]
          agendamento_hora_fim: string
          agendamento_hora_inicio: string
          agendamento_intervalo_minutos: number
          agendamento_max_dias: number
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
          agendamento_antecedencia_minutos?: number
          agendamento_dias_semana?: number[]
          agendamento_hora_fim?: string
          agendamento_hora_inicio?: string
          agendamento_intervalo_minutos?: number
          agendamento_max_dias?: number
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
          agendamento_antecedencia_minutos?: number
          agendamento_dias_semana?: number[]
          agendamento_hora_fim?: string
          agendamento_hora_inicio?: string
          agendamento_intervalo_minutos?: number
          agendamento_max_dias?: number
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
          id?: s}}ë¾­¢G§²ÚîÆ­yÕ}±½Í}•µÁÉ•Í…}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰•µÁÉ•Í…}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰Ù¥•Ý}•µÁÉ•Í…Í}•ÍÑ…Ñ¥ÍÑ¥…Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€ÍÕÁ½ÉÑ•}Í•ÍÍ½•Í}…Ñ¥Ù…Ìèì(€€€€€€€I½Üèì(€€€€€€€€€…ÑÕ…±¥é…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€½‘¥½}Ù…±¥‘…‘¼èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€‘ÕÙ¥‘…}±¥•¹Ñ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¹½µ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}Ñ•±•™½¹”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•Ñ…Á„èÍÑÉ¥¹œ(€€€€€€€€€•áÁ¥É…}•´èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€½‘¥½}Ù…±¥‘…‘¼üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€‘ÕÙ¥‘…}±¥•¹Ñ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¹½µ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}Ñ•±•™½¹”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•Ñ…Á„üèÍÑÉ¥¹œ(€€€€€€€€€•áÁ¥É…}•´üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€½‘¥½}Ù…±¥‘…‘¼üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€‘ÕÙ¥‘…}±¥•¹Ñ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¹½µ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}Ñ•±•™½¹”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•Ñ…Á„üèÍÑÉ¥¹œ(€€€€€€€€€•áÁ¥É…}•´üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€Ñ•±•™½¹”üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèmt(€€€€€ô(€€€€€ÕÍ•É}‰…‘•Ìèì(€€€€€€€I½Üèì(€€€€€€€€€‰…‘•}¥èÍÑÉ¥¹œ(€€€€€€€€€•…É¹•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½É•ÍÌè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€‰…‘•}¥èÍÑÉ¥¹œ(€€€€€€€€€•…É¹•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½É•ÍÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€‰…‘•}¥üèÍÑÉ¥¹œ(€€€€€€€€€•…É¹•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½É•ÍÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}‰…‘•Í}‰…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰‰…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰‰…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€ÕÍ•É}©½ÕÉ¹•äèì(€€€€€€€I½Üèì(€€€€€€€€€…Ñ¥½¹}Ñ…­•¸èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€µ•Ñ…‘…Ñ„è)Í½¸ð¹Õ±°(€€€€€€€€€Á…•}Ñ¥Ñ±”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€Í•ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€ÍÑ•Á}¹Õµ‰•Èè¹Õµ‰•È(€€€€€€€€€Ñ¥µ•}™É½µ}ÁÉ•Ù¥½ÕÍ}ÍÑ•Àè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ñ¥µ•ÍÑ…µÀèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€…Ñ¥½¹}Ñ…­•¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€µ•Ñ…‘…Ñ„üè)Í½¸ð¹Õ±°(€€€€€€€€€Á…•}Ñ¥Ñ±”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€Í•ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€ÍÑ•Á}¹Õµ‰•Èè¹Õµ‰•È(€€€€€€€€€Ñ¥µ•}™É½µ}ÁÉ•Ù¥½ÕÍ}ÍÑ•Àüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ñ¥µ•ÍÑ…µÀüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€…Ñ¥½¹}Ñ…­•¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€µ•Ñ…‘…Ñ„üè)Í½¸ð¹Õ±°(€€€€€€€€€Á…•}Ñ¥Ñ±”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}ÕÉ°üèÍÑÉ¥¹œ(€€€€€€€€€Í•ÍÍ¥½¹}¥üèÍÑÉ¥¹œ(€€€€€€€€€ÍÑ•Á}¹Õµ‰•Èüè¹Õµ‰•È(€€€€€€€€€Ñ¥µ•}™É½µ}ÁÉ•Ù¥½ÕÍ}ÍÑ•Àüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ñ¥µ•ÍÑ…µÀüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèmt(€€€€€ô(€€€€€ÕÍ•É}µ¥ÍÍ¥½¹Ìèì(€€€€€€€I½Üèì(€€€€€€€€€½µÁ±•Ñ•è‰½½±•…¸ð¹Õ±°(€€€€€€€€€½µÁ±•Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€µ¥ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€Á•É¥½‘}ÍÑ…ÉÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÁÉ½É•ÍÌè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€½µÁ±•Ñ•üè‰½½±•…¸ð¹Õ±°(€€€€€€€€€½µÁ±•Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€µ¥ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€Á•É¥½‘}ÍÑ…ÉÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÁÉ½É•ÍÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€½µÁ±•Ñ•üè‰½½±•…¸ð¹Õ±°(€€€€€€€€€½µÁ±•Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€µ¥ÍÍ¥½¹}¥üèÍÑÉ¥¹œ(€€€€€€€€€Á•É¥½‘}ÍÑ…ÉÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÁÉ½É•ÍÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}µ¥ÍÍ¥½¹Í}µ¥ÍÍ¥½¹}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰µ¥ÍÍ¥½¹}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰µ¥ÍÍ¥½¹Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€ÕÍ•É}Á½¥¹ÑÌèì(€€€€€€€I½Üèì(€€€€€€€€€…Ñ¥½¹}‘•ÍÉ¥ÁÑ¥½¸èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Ñ¥½¹}ÑåÁ”èÍÑÉ¥¹œ(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€€€É•™•É•¹•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•™•É•¹•}ÑåÁ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€…Ñ¥½¹}‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Ñ¥½¹}ÑåÁ”èÍÑÉ¥¹œ(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€Á½¥¹ÑÌüè¹Õµ‰•È(€€€€€€€€€É•™•É•¹•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•™•É•¹•}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€…Ñ¥½¹}‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Ñ¥½¹}ÑåÁ”üèÍÑÉ¥¹œ(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€Á½¥¹ÑÌüè¹Õµ‰•È(€€€€€€€€€É•™•É•¹•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•™•É•¹•}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèmt(€€€€€ô(€€€€€ÕÍ•É}É½±•Ìèì(€€€€€€€I½Üèì(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}‰äèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€É½±”è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰…ÁÁ}É½±”‰t(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}‰äüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€É½±”è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰…ÁÁ}É½±”‰t(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}‰äüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€É½±”üè…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰…ÁÁ}É½±”‰t(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèmt(€€€€€ô(€€€€€ÕÍ•É}Í•ÍÍ¥½¹Ìèì(€€€€€€€I½Üèì(€€€€€€€€€‰É½ÝÍ•ÈèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½¹Ù•ÉÍ¥½¹}ÑåÁ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½¹Ù•ÉÍ¥½¹}Ù…±Õ”è¹Õµ‰•Èð¹Õ±°(€€€€€€€€€½¹Ù•ÉÑ•è‰½½±•…¸ð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•Ù¥•}ÑåÁ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘ÕÉ…Ñ¥½¹}Í•½¹‘Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€•¹‘•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•¹ÑÉå}É•™•ÉÉ•ÈèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•¹ÑÉå}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•á¥Ñ}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¥Á}…‘‘É•ÍÌèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½ÌèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•Í}Ù¥Í¥Ñ•è¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Í•ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€ÍÑ…ÉÑ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}±¥­Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}ÍÉ½±±Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}…µÁ…¥¸èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}µ•‘¥Õ´èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Í½ÕÉ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€‰É½ÝÍ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½¹Ù•ÉÍ¥½¹}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½¹Ù•ÉÍ¥½¹}Ù…±Õ”üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€½¹Ù•ÉÑ•üè‰½½±•…¸ð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•Ù¥•}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘ÕÉ…Ñ¥½¹}Í•½¹‘Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€•¹‘•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•¹ÑÉå}É•™•ÉÉ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•¹ÑÉå}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•á¥Ñ}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€¥Á}…‘‘É•ÍÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½ÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•Í}Ù¥Í¥Ñ•üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Í•ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€ÍÑ…ÉÑ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}±¥­Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}ÍÉ½±±Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}…µÁ…¥¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}µ•‘¥Õ´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Í½ÕÉ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€‰É½ÝÍ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½¹Ù•ÉÍ¥½¹}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½¹Ù•ÉÍ¥½¹}Ù…±Õ”üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€½¹Ù•ÉÑ•üè‰½½±•…¸ð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•Ù¥•}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘ÕÉ…Ñ¥½¹}Í•½¹‘Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€•¹‘•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•¹ÑÉå}É•™•ÉÉ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•¹ÑÉå}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•á¥Ñ}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€¥Á}…‘‘É•ÍÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€½ÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•Í}Ù¥Í¥Ñ•üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Í•ÍÍ¥½¹}¥üèÍÑÉ¥¹œ(€€€€€€€€€ÍÑ…ÉÑ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}±¥­Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}ÍÉ½±±Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}…µÁ…¥¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}µ•‘¥Õ´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Í½ÕÉ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}Í•ÍÍ¥½¹Í}¥‘…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰¥‘…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÌèì(€€€€€€€I½Üèì(€€€€€€€€€‰É½ÝÍ•ÈèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€±¥­}Á½Í¥Ñ¥½¸è)Í½¸ð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÁ½µ}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•Ù¥•}ÑåÁ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}±…ÍÌèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}Ñ•áÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•Ù•¹Ñ}¹…µ”èÍÑÉ¥¹œ(€€€€€€€€€•Ù•¹Ñ}ÑåÁ”èÍÑÉ¥¹œ(€€€€€€€€€•Ù•¹Ñ½}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¥Á}…‘‘É•ÍÌèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ•Ñ…‘…Ñ„è)Í½¸ð¹Õ±°(€€€€€€€€€½ÌèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}±½…‘}Ñ¥µ”è¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Á…•}Ñ¥Ñ±”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½‘ÕÑ½}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•™•ÉÉ•ÈèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÉ••¹}É•Í½±ÕÑ¥½¸èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÉ½±±}‘•ÁÑ è¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Í•ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥µ•}½¹}Á…”è¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÍ•É}…•¹ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}…µÁ…¥¸èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}½¹Ñ•¹ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}µ•‘¥Õ´èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Í½ÕÉ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Ñ•É´èÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€‰É½ÝÍ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€±¥­}Á½Í¥Ñ¥½¸üè)Í½¸ð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÁ½µ}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•Ù¥•}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}±…ÍÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}Ñ•áÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•Ù•¹Ñ}¹…µ”èÍÑÉ¥¹œ(€€€€€€€€€•Ù•¹Ñ}ÑåÁ”èÍÑÉ¥¹œ(€€€€€€€€€•Ù•¹Ñ½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€¥Á}…‘‘É•ÍÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ•Ñ…‘…Ñ„üè)Í½¸ð¹Õ±°(€€€€€€€€€½ÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}±½…‘}Ñ¥µ”üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Á…•}Ñ¥Ñ±”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½‘ÕÑ½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•™•ÉÉ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÉ••¹}É•Í½±ÕÑ¥½¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÉ½±±}‘•ÁÑ üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Í•ÍÍ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥µ•}½¹}Á…”üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÍ•É}…•¹ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}…µÁ…¥¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}½¹Ñ•¹ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}µ•‘¥Õ´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Í½ÕÉ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Ñ•É´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€‰É½ÝÍ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€±¥­}Á½Í¥Ñ¥½¸üè)Í½¸ð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÁ½µ}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•Ù¥•}ÑåÁ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}±…ÍÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•±•µ•¹Ñ}Ñ•áÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•µÁÉ•Í…}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•Ù•¹Ñ}¹…µ”üèÍÑÉ¥¹œ(€€€€€€€€€•Ù•¹Ñ}ÑåÁ”üèÍÑÉ¥¹œ(€€€€€€€€€•Ù•¹Ñ½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€¥Á}…‘‘É•ÍÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ•Ñ…‘…Ñ„üè)Í½¸ð¹Õ±°(€€€€€€€€€½ÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}±½…‘}Ñ¥µ”üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Á…•}Ñ¥Ñ±”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á…•}ÕÉ°üèÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½‘ÕÑ½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•™•ÉÉ•ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÉ••¹}É•Í½±ÕÑ¥½¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÉ½±±}‘•ÁÑ üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Í•ÍÍ¥½¹}¥üèÍÑÉ¥¹œ(€€€€€€€€€Ñ¥µ•}½¹}Á…”üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€ÕÍ•É}…•¹ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÍ•É}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}…µÁ…¥¸üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}½¹Ñ•¹ÐüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}µ•‘¥Õ´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Í½ÕÉ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÕÑµ}Ñ•É´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÍ}¥‘…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰¥‘…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÍ}ÕÁ½µ}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰ÕÁ½µ}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰ÕÁ½¹Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÍ}•µÁÉ•Í…}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰•µÁÉ•Í…}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰•µÁÉ•Í…Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÍ}•µÁÉ•Í…}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰•µÁÉ•Í…}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰µÙ}•µÁÉ•Í…Í}Á½ÁÕ±…É•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÍ}•µÁÉ•Í…}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰•µÁÉ•Í…}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰Ù¥•Ý}•µÁÉ•Í…Í}•ÍÑ…Ñ¥ÍÑ¥…Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÍ}•Ù•¹Ñ½}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰•Ù•¹Ñ½}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰•Ù•¹Ñ½Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍ•É}ÑÉ…­¥¹}•Ù•¹ÑÍ}ÁÉ½‘ÕÑ½}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰ÁÉ½‘ÕÑ½}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰ÁÉ½‘ÕÑ½Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€ÕÍÕ…É¥½}•µÁÉ•Í…}…‘µ¥¸èì(€€€€€€€I½Üèì(€€€€€€€€€…Ñ¥Ù¼è‰½½±•…¸(€€€€€€€€€…ÑÉ¥‰Õ¥‘½}Á½ÈèÍÑÉ¥¹œ(€€€€€€€€€…ÑÕ…±¥é…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€•µÁÉ•Í…}¥èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€ÕÍÕ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€…Ñ¥Ù¼üè‰½½±•…¸(€€€€€€€€€…ÑÉ¥‰Õ¥‘½}Á½ÈèÍÑÉ¥¹œ(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€•µÁÉ•Í…}¥èÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€ÕÍÕ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€…Ñ¥Ù¼üè‰½½±•…¸(€€€€€€€€€…ÑÉ¥‰Õ¥‘½}Á½ÈüèÍÑÉ¥¹œ(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€•µÁÉ•Í…}¥üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€ÕÍÕ…É¥½}¥üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèmt(€€€€€ô(€€€€€ÕÍÕ…É¥½Ìèì(€€€€€€€I½Üèì(€€€€€€€€€…ÑÕ…±¥é…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€‰…‘•Í}½Õ¹Ðè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€ÕÉÉ•¹Ñ}±•Ù•°è¹Õµ‰•Èð¹Õ±°(€€€€€€€€€•µ…¥°èÍÑÉ¥¹œ(€€€€€€€€€™½Ñ½}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€±…ÍÑ}…Ñ¥Ù¥Ñå}‘…Ñ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ½¹Ñ¡±å}Á½¥¹ÑÌè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Á±…¹½}‘…Ñ…}Ù•¹¥µ•¹Ñ¼èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á±…¹½}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ•±•™½¹”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ¥Á½}½¹Ñ„è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰Ñ¥Á½}½¹Ñ„‰t(€€€€€€€€€Ñ½Ñ…±}Á½¥¹ÑÌè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ý••­±å}Á½¥¹ÑÌè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€‰…‘•Í}½Õ¹Ðüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€ÕÉÉ•¹Ñ}±•Ù•°üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€•µ…¥°èÍÑÉ¥¹œ(€€€€€€€€€™½Ñ½}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€±…ÍÑ}…Ñ¥Ù¥Ñå}‘…Ñ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ½¹Ñ¡±å}Á½¥¹ÑÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Á±…¹½}‘…Ñ…}Ù•¹¥µ•¹Ñ¼üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á±…¹½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ•±•™½¹”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ¥Á½}½¹Ñ„üè…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰Ñ¥Á½}½¹Ñ„‰t(€€€€€€€€€Ñ½Ñ…±}Á½¥¹ÑÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ý••­±å}Á½¥¹ÑÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€‰…‘•Í}½Õ¹Ðüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€ÕÉÉ•¹Ñ}±•Ù•°üè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€•µ…¥°üèÍÑÉ¥¹œ(€€€€€€€€€™½Ñ½}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€±…ÍÑ}…Ñ¥Ù¥Ñå}‘…Ñ”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ½¹Ñ¡±å}Á½¥¹ÑÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¹½µ”üèÍÑÉ¥¹œ(€€€€€€€€€Á±…¹½}‘…Ñ…}Ù•¹¥µ•¹Ñ¼üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á±…¹½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ•±•™½¹”üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ¥Á½}½¹Ñ„üè…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰Ñ¥Á½}½¹Ñ„‰t(€€€€€€€€€Ñ½Ñ…±}Á½¥¹ÑÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ý••­±å}Á½¥¹ÑÌüè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍÕ…É¥½Í}¥‘…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰¥‘…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰ÕÍÕ…É¥½Í}Á±…¹½}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰Á±…¹½}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰Á±…¹½Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€Ù……Í}•µÁÉ•¼èì(€€€€€€€I½Üèì(€€€€€€€€€…Ñ¥Ù¼è‰½½±•…¸(€€€€€€€€€…ÑÕ…±¥é…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€‰…¥ÉÉ½}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Ñ•½É¥…}¥èÍÑÉ¥¹œ(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œ(€€€€€€€€€½¹Ñ…Ñ½}…¹‘¥‘…ÑÕÉ„èÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}Á½ÈèÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÉ¥…¼èÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÑ…ÅÕ”è‰½½±•…¸(€€€€€€€€€™…¥á…}Í…±…É¥…°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€™½Éµ…}…¹‘¥‘…ÑÕÉ„èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€É•ÅÕ¥Í¥Ñ½ÌèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ¥Á½}Ù…„è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰Ñ¥Á½}Ù…„‰t(€€€€€€€€€Ñ¥ÑÕ±¼èÍÑÉ¥¹œ(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìè¹Õµ‰•È(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€…Ñ¥Ù¼üè‰½½±•…¸(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€‰…¥ÉÉ½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Ñ•½É¥…}¥èÍÑÉ¥¹œ(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œ(€€€€€€€€€½¹Ñ…Ñ½}…¹‘¥‘…ÑÕÉ„èÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}Á½ÈèÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÉ¥…¼èÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÑ…ÅÕ”üè‰½½±•…¸(€€€€€€€€€™…¥á…}Í…±…É¥…°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€™½Éµ…}…¹‘¥‘…ÑÕÉ„èÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€É•ÅÕ¥Í¥Ñ½ÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ¥Á½}Ù…„üè…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰Ñ¥Á½}Ù…„‰t(€€€€€€€€€Ñ¥ÑÕ±¼èÍÑÉ¥¹œ(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìüè¹Õµ‰•È(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€…Ñ¥Ù¼üè‰½½±•…¸(€€€€€€€€€…ÑÕ…±¥é…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€‰…¥ÉÉ½}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Ñ•½É¥…}¥üèÍÑÉ¥¹œ(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œ(€€€€€€€€€½¹Ñ…Ñ½}…¹‘¥‘…ÑÕÉ„üèÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}Á½ÈüèÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÉ¥…¼üèÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÑ…ÅÕ”üè‰½½±•…¸(€€€€€€€€€™…¥á…}Í…±…É¥…°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€™½Éµ…}…¹‘¥‘…ÑÕÉ„üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€É•ÅÕ¥Í¥Ñ½ÌüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ¥Á½}Ù…„üè…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰Ñ¥Á½}Ù…„‰t(€€€€€€€€€Ñ¥ÑÕ±¼üèÍÑÉ¥¹œ(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìüè¹Õµ‰•È(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Ù……Í}•µÁÉ•½}‰…¥ÉÉ½}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰‰…¥ÉÉ½}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰‰…¥ÉÉ½Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Ù……Í}•µÁÉ•½}…Ñ•½É¥…}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰…Ñ•½É¥…}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰…Ñ•½É¥…Í}½Á½ÉÑÕ¹¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Ù……Í}•µÁÉ•½}¥‘…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰¥‘…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Ù……Í}•µÁÉ•½}É¥…‘½}Á½É}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰É¥…‘½}Á½È‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰ÕÍÕ…É¥½Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€Ù½Ñ½Í}½µ•¹Ñ…É¥¼èì(€€€€€€€I½Üèì(€€€€€€€€€½µ•¹Ñ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥Á½}Ù½Ñ¼è¹Õµ‰•È(€€€€€€€€€ÕÍÕ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€½µ•¹Ñ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€Ñ¥Á½}Ù½Ñ¼è¹Õµ‰•È(€€€€€€€€€ÕÍÕ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€½µ•¹Ñ…É¥½}¥üèÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€Ñ¥Á½}Ù½Ñ¼üè¹Õµ‰•È(€€€€€€€€€ÕÍÕ…É¥½}¥üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Ù½Ñ½Í}½µ•¹Ñ…É¥½}½µ•¹Ñ…É¥½}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰½µ•¹Ñ…É¥½}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰½µ•¹Ñ…É¥½Í}ÁÉ½‰±•µ„ˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€Ù½Ñ½Í}ÁÉ½‰±•µ„èì(€€€€€€€I½Üèì(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½‰±•µ…}¥èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥Á½}Ù½Ñ¼è¹Õµ‰•È(€€€€€€€€€ÕÍÕ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½‰±•µ…}¥èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥Á½}Ù½Ñ¼è¹Õµ‰•È(€€€€€€€€€ÕÍÕ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œ(€€€€€€€€€¥üèÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½‰±•µ…}¥üèÍÑÉ¥¹œ(€€€€€€€€€Ñ¥Á½}Ù½Ñ¼üè¹Õµ‰•È(€€€€€€€€€ÕÍÕ…É¥½}¥üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Ù½Ñ½Í}ÁÉ½‰±•µ…}ÁÉ½‰±•µ…}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰ÁÉ½‰±•µ…}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰ÁÉ½‰±•µ…Í}¥‘…‘”ˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€ô(€€€Y¥•ÝÌèì(€€€€€µÙ}•µÁÉ•Í…Í}Á½ÁÕ±…É•Ìèì(€€€€€€€I½Üèì(€€€€€€€€€…Ñ•½É¥…}¹½µ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¹½µ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•ÍÑ…ÅÕ”è‰½½±•…¸ð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥µ…•µ}…Á…}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ•‘¥…}…Ù…±¥…½•Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¹½µ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Í½É•}Á½ÁÕ±…É¥‘…‘”è¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}…Ù…±¥…½•Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ù•É¥™¥…‘¼è‰½½±•…¸ð¹Õ±°(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰•µÁÉ•Í…Í}¥‘…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰¥‘…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€Í•ÉÙ¥½Í}…ÕÑ½¹½µ½Í}ÁÕ‰±¥¼èì(€€€€€€€I½Üèì(€€€€€€€€€…Ñ•½É¥…}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•ÍÉ¥…½}Í•ÉÙ¥¼èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€™½Ñ½}Á•É™¥±}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¹½µ•}ÁÉ•ÍÑ…‘½ÈèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÑ…ÑÕÍ}…ÁÉ½Ù……¼è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰ÍÑ…ÑÕÍ}Í•ÉÙ¥¼‰tð¹Õ±°(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€%¹Í•ÉÐèì(€€€€€€€€€…Ñ•½É¥…}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•ÍÉ¥…½}Í•ÉÙ¥¼üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€™½Ñ½}Á•É™¥±}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¹½µ•}ÁÉ•ÍÑ…‘½ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÑ…ÑÕÍ}…ÁÉ½Ù……¼üè(€€€€€€€€€€€ð…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰ÍÑ…ÑÕÍ}Í•ÉÙ¥¼‰t(€€€€€€€€€€€ð¹Õ±°(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€UÁ‘…Ñ”èì(€€€€€€€€€…Ñ•½É¥…}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•ÍÉ¥…½}Í•ÉÙ¥¼üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€™½Ñ½}Á•É™¥±}ÕÉ°üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥üèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¹½µ•}ÁÉ•ÍÑ…‘½ÈüèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÑ…ÑÕÍ}…ÁÉ½Ù……¼üè(€€€€€€€€€€€ð…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰ÍÑ…ÑÕÍ}Í•ÉÙ¥¼‰t(€€€€€€€€€€€ð¹Õ±°(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìüè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Í•ÉÙ¥½Í}…ÕÑ½¹½µ½Í}…Ñ•½É¥…}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰…Ñ•½É¥…}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰…Ñ•½É¥…Í}½Á½ÉÑÕ¹¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰Í•ÉÙ¥½Í}…ÕÑ½¹½µ½Í}¥‘…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰¥‘…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€€€Ù¥•Ý}•µÁÉ•Í…Í}•ÍÑ…Ñ¥ÍÑ¥…Ìèì(€€€€€€€I½Üèì(€€€€€€€€€…Ñ•½É¥…}¹½µ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥‘…‘•}¹½µ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€‘•ÍÑ…ÅÕ”è‰½½±•…¸ð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ•‘¥…}…Ù…±¥…½•Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€¹½µ”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Ñ½Ñ…±}…Ù…±¥…½•Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€€€Ù•É¥™¥…‘¼è‰½½±•…¸ð¹Õ±°(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìè¹Õµ‰•Èð¹Õ±°(€€€€€€€ô(€€€€€€€I•±…Ñ¥½¹Í¡¥ÁÌèl(€€€€€€€€€ì(€€€€€€€€€€€™½É•¥¹-•å9…µ”è€‰•µÁÉ•Í…Í}¥‘…‘•}¥‘}™­•äˆ(€€€€€€€€€€€½±Õµ¹Ìèl‰¥‘…‘•}¥‰t(€€€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€€€É•™•É•¹•‘I•±…Ñ¥½¸è€‰¥‘…‘•Ìˆ(€€€€€€€€€€€É•™•É•¹•‘½±Õµ¹Ìèl‰¥‰t(€€€€€€€€€ô°(€€€€€€€t(€€€€€ô(€€€ô(€€€Õ¹Ñ¥½¹Ìèì(€€€€€…‘‘}ÕÍ•É}Á½¥¹ÑÌèì(€€€€€€€ÉÌèì(€€€€€€€€€Á}…Ñ¥½¹}‘•ÍÉ¥ÁÑ¥½¸üèÍÑÉ¥¹œ(€€€€€€€€€Á}…Ñ¥½¹}ÑåÁ”èÍÑÉ¥¹œ(€€€€€€€€€Á}Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€€€Á}É•™•É•¹•}¥üèÍÑÉ¥¹œ(€€€€€€€€€Á}É•™•É•¹•}ÑåÁ”üèÍÑÉ¥¹œ(€€€€€€€€€Á}ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€…ÑÕ…±¥é…É}•ÍÑ…Ñ¥ÍÑ¥…Í}•µÁÉ•Í„èì(€€€€€€€ÉÌèì•µÁÉ•Í…}¥‘}Á…É…´èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€…ÑÕ…±¥é…É}¡½É…É¥½}™Õ¹¥½¹…µ•¹Ñ¼èì(€€€€€€€ÉÌèì•µÁÉ•Í…}¥‘}Á…É…´èÍÑÉ¥¹œì¡½É…É¥½Í}Á…É…´è)Í½¸ô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€…ÑÕ…±¥é…É}Í•ÍÍ…½}ÍÕÁ½ÉÑ”èì(€€€€€€€ÉÌèì(€€€€€€€€€Á}½‘¥¼èÍÑÉ¥¹œ(€€€€€€€€€Á}•µÁÉ•Í…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Á}•µÁÉ•Í…}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€€€Á}•Ñ…Á„üèÍÑÉ¥¹œ(€€€€€€€€€Á}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€½ÕÑ}½‘¥¼èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•µÁÉ•Í…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•µÁÉ•Í…}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•Ñ…Á„èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€ô(€€€€€…ÑÕ…±¥é…É}ÍÑ…ÑÕÍ}¥Ñ•´èì(€€€€€€€ÉÌèìÁ}¥Ñ•µ}¥èÍÑÉ¥¹œìÁ}¹½Ù½}ÍÑ…ÑÕÌèÍÑÉ¥¹œìÁ}ÕÍÕ…É¥½}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè)Í½¸(€€€€€ô(€€€€€‰ÕÍ…É}•µÁÉ•Í…Í}‘•ÍÑ…ÅÕ”èì(€€€€€€€ÉÌèì¥‘…‘•}¥‘}Á…É…´üèÍÑÉ¥¹œì±¥µ¥Ñ”üè¹Õµ‰•Èô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…Ñ•½É¥…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€•¹‘•É•¼èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¥µ…•µ}…Á…}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€µ•‘¥…}…Ù…±¥…½•Ìè¹Õµ‰•È(€€€€€€€€€¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ¥½É¥‘…‘•}‘•ÍÑ…ÅÕ”è¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}…Ù…±¥…½•Ìè¹Õµ‰•È(€€€€€€€€€Ù•É¥™¥…‘¼è‰½½±•…¸(€€€€€€€õmt(€€€€€ô(€€€€€‰ÕÍ…É}•µÁÉ•Í…Í}ÁÉ½á¥µ…Ìèì(€€€€€€€ÉÌèì(€€€€€€€€€…Ñ•½É¥…}¥‘}Á…É…´üèÍÑÉ¥¹œ(€€€€€€€€€¥‘…‘•}¥‘}Á…É…´üèÍÑÉ¥¹œ(€€€€€€€€€±…Ðè¹Õµ‰•È(€€€€€€€€€±¥µ¥Ñ”üè¹Õµ‰•È(€€€€€€€€€±¹œè¹Õµ‰•È(€€€€€€€€€É…¥½}­´üè¹Õµ‰•È(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…Ñ•½É¥…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÑ…ÅÕ”è‰½½±•…¸(€€€€€€€€€‘¥ÍÑ…¹¥…}­´è¹Õµ‰•È(€€€€€€€€€•¹‘•É•¼èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¥µ…•µ}…Á…}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€µ•‘¥…}…Ù…±¥…½•Ìè¹Õµ‰•È(€€€€€€€€€¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€€€Ñ½Ñ…±}…Ù…±¥…½•Ìè¹Õµ‰•È(€€€€€€€€€Ù•É¥™¥…‘¼è‰½½±•…¸(€€€€€€€õmt(€€€€€ô(€€€€€‰ÕÍ…É}•¹ÅÕ•Ñ•}…Ñ¥Ù„èì(€€€€€€€ÉÌè¹•Ù•È(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€‘•ÍÉ¥…¼èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€µÕ±Ñ¥Á±…}•Í½±¡„è‰½½±•…¸(€€€€€€€€€½Á½•Ìè)Í½¸(€€€€€€€€€É•ÍÕ±Ñ…‘½Ìè)Í½¸(€€€€€€€€€Ñ¥ÑÕ±¼èÍÑÉ¥¹œ(€€€€€€€€€Ñ½Ñ…±}Ù½Ñ½Ìè¹Õµ‰•È(€€€€€€€õmt(€€€€€ô(€€€€€‰ÕÍ…É}•Ù•¹Ñ½Í}Á•É¥½‘¼èì(€€€€€€€ÉÌèì(€€€€€€€€€¥‘…‘•}¥‘}Á…É…´èÍÑÉ¥¹œ(€€€€€€€€€‘…Ñ…}™¥µ}Á…É…´üèÍÑÉ¥¹œ(€€€€€€€€€‘…Ñ…}¥¹¥¥½}Á…É…´üèÍÑÉ¥¹œ(€€€€€€€€€±¥µ¥Ñ”üè¹Õµ‰•È(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…Ñ•½É¥…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€‘…Ñ…}™¥´èÍÑÉ¥¹œ(€€€€€€€€€‘…Ñ…}¥¹¥¥¼èÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÉ¥…¼èÍÑÉ¥¹œ(€€€€€€€€€•µÁÉ•Í…}¥èÍÑÉ¥¹œ(€€€€€€€€€•µÁÉ•Í…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€•¹‘•É•¼èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¥µ…•µ}‰…¹¹•ÈèÍÑÉ¥¹œ(€€€€€€€€€±½…°èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥ÑÕ±¼èÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€ô(€€€€€‰ÕÍ…É}±½…¥Í}½½±”èì(€€€€€€€ÉÌèì‰ÕÍ…}Ñ•Éµ¼èÍÑÉ¥¹œì½½±•}­•äèÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè)Í½¸(€€€€€ô(€€€€€‰ÕÍ…É}É•ÍÕ±Ñ…‘½}Í½ÉÑ•¥¼èì(€€€€€€€ÉÌèì…¹…±}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€‘…Ñ…}Í½ÉÑ•¥¼èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ•µ¥½Ìè)Í½¸(€€€€€€€õmt(€€€€€ô(€€€€€…±Õ±…Ñ•}ÕÍ•É}±•Ù•°èìÉÌèìÁ}Á½¥¹ÑÌè¹Õµ‰•ÈôìI•ÑÕÉ¹Ìè¹Õµ‰•Èô(€€€€€…±Õ±…Ñ•}ÕÍ•É}Ñ½Ñ…±}Á½¥¹ÑÌèì(€€€€€€€ÉÌèìÁ}ÕÍ•É}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè¹Õµ‰•È(€€€€€ô(€€€€€…¹}…ÍÍ¥¹}É½±”èì(€€€€€€€ÉÌèìÑ…É•Ñ}É½±”è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰Ñ¥Á½}½¹Ñ„‰tô(€€€€€€€I•ÑÕÉ¹Ìè‰½½±•…¸(€€€€€ô(€€€€€¡•­}…¹‘}…Ý…É‘}‰…‘•Ìèì(€€€€€€€ÉÌèìÁ}ÕÍ•É}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€±…¥µ}¹½Ñ¥™¥…Ñ¥½¹}…µÁ…¥¹Ìèì(€€€€€€€ÉÌèìÁ}…µÁ…¥¹}¥üèÍÑÉ¥¹œìÁ}±¥µ¥Ðüè¹Õµ‰•Èô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…Ñ¥½¹}±…‰•°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Ñ¥½¹}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€…Õ‘¥•¹•}ÑåÁ”èÍÑÉ¥¹œ(€€€€€€€€€…Ñ•½ÉäèÍÑÉ¥¹œ(€€€€€€€€€¡…¹¹•±Ìè)Í½¸(€€€€€€€€€½µÁ±•Ñ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œ(€€€€€€€€€É•…Ñ•‘}‰äèÍÑÉ¥¹œ(€€€€€€€€€¥½¹}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¥µ…•}ÕÉ°èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€±…ÍÑ}•ÉÉ½ÈèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€µ•ÍÍ…”èÍÑÉ¥¹œ(€€€€€€€€€µ•Ñ…‘…Ñ„è)Í½¸(€€€€€€€€€ÁÉ¥½É¥ÑäèÍÑÉ¥¹œ(€€€€€€€€€Í¡•‘Õ±•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÑ…ÉÑ•‘}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÑ…ÑÕÌèÍÑÉ¥¹œ(€€€€€€€€€Ñ…É•Ñ}ÕÍ•É}¥‘ÌèÍÑÉ¥¹mt(€€€€€€€€€Ñ¥Ñ±”èÍÑÉ¥¹œ(€€€€€€€€€Ñ½Ñ…±}‘•±¥Ù•É¥•Ìè¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}™…¥±•è¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}É•¥Á¥•¹ÑÌè¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}Í•¹Ðè¹Õµ‰•È(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐèÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€€€M•Ñ½™=ÁÑ¥½¹Ìèì(€€€€€€€€€™É½´è€ˆ¨ˆ(€€€€€€€€€Ñ¼è€‰¹½Ñ¥™¥…Ñ¥½¹}…µÁ…¥¹Ìˆ(€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€¥ÍM•Ñ½™I•ÑÕÉ¸èÑÉÕ”(€€€€€€€ô(€€€€€ô(€€€€€±…¥µ}¹½Ñ¥™¥…Ñ¥½¹}‘•±¥Ù•É¥•Ìèì(€€€€€€€ÉÌèìÁ}±¥µ¥Ðüè¹Õµ‰•Èô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…ÑÑ•µÁÑ}½Õ¹Ðè¹Õµ‰•È(€€€€€€€€€…µÁ…¥¹}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¡…¹¹•°èÍÑÉ¥¹œ(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œ(€€€€€€€€€‘•Ù¥•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•ÉÉ½É}½‘”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€•ÉÉ½É}µ•ÍÍ…”èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¹•áÑ}…ÑÑ•µÁÑ}…ÐèÍÑÉ¥¹œ(€€€€€€€€€¹½Ñ¥™¥…Ñ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ½Ù¥‘•É}µ•ÍÍ…•}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Í•¹Ñ}…ÐèÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€ÍÑ…ÑÕÌèÍÑÉ¥¹œ(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐèÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€€€M•Ñ½™=ÁÑ¥½¹Ìèì(€€€€€€€€€™É½´è€ˆ¨ˆ(€€€€€€€€€Ñ¼è€‰¹½Ñ¥™¥…Ñ¥½¹}‘•±¥Ù•É¥•Ìˆ(€€€€€€€€€¥Í=¹•Q½=¹”è™…±Í”(€€€€€€€€€¥ÍM•Ñ½™I•ÑÕÉ¸èÑÉÕ”(€€€€€€€ô(€€€€€ô(€€€€€±•…¹ÕÁ}•áÁ¥É•‘}Í•ÍÍ¥½¹ÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€±•…¹ÕÁ}É…Ñ•}±¥µ¥ÑÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€É•…Ñ•}É•ÍÁ½¹Í¥‰¥±¥Ñå}É•ÅÕ•ÍÑ}¹½Ñ¥™¥…Ñ¥½¸èì(€€€€€€€ÉÌèì(€€€€€€€€€Á}•µ…¥°üèÍÑÉ¥¹œ(€€€€€€€€€Á}•µÁÉ•Í…}¥èÍÑÉ¥¹œ(€€€€€€€€€Á}•µÁÉ•Í…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Á}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Á}½‰Í•ÉÙ…½•ÌüèÍÑÉ¥¹œ(€€€€€€€€€Á}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€€€Á}Ý¡…ÑÍ…ÁÀüèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹Ìè¹Õµ‰•È(€€€€€ô(€€€€€É¥…É}…•¹‘…µ•¹Ñ½}ÁÕ‰±¥¼èì(€€€€€€€ÉÌèì(€€€€€€€€€Á}‘…Ñ…}…•¹‘…µ•¹Ñ¼èÍÑÉ¥¹œ(€€€€€€€€€Á}•µÁÉ•Í…}¥èÍÑÉ¥¹œ(€€€€€€€€€Á}¹½µ•}±¥•¹Ñ”èÍÑÉ¥¹œ(€€€€€€€€€Á}½‰Í•ÉÙ…½•ÌüèÍÑÉ¥¹œ(€€€€€€€€€Á}Í•ÉÙ¥¼èÍÑÉ¥¹œ(€€€€€€€€€Á}Ñ•±•™½¹•}±¥•¹Ñ”èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹ÌèÍÑÉ¥¹œ(€€€€€ô(€€€€€±¥ÍÑ…É}¡½É…É¥½Í}…•¹‘…µ•¹Ñ¼èì(€€€€€€€ÉÌèìÁ}‘…Ñ„èÍÑÉ¥¹œìÁ}•µÁÉ•Í…}¥èÍÑÉ¥¹œìÁ}Í•ÉÙ¥¼èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì¡½É…É¥¼èÍÑÉ¥¹œõmt(€€€€€ô(€€€€€É¥…É}É•ÍÕ±Ñ…‘½}Í½ÉÑ•¥¼èì(€€€€€€€ÉÌèì(€€€€€€€€€…¹…±}¥èÍÑÉ¥¹œ(€€€€€€€€€‘…Ñ…}Í½ÉÑ•¥½}Á…É…´èÍÑÉ¥¹œ(€€€€€€€€€ÁÉ•µ¥½Í}Á…É…´è)Í½¸(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€‘•±•Ñ…É}•Ù•¹Ñ½Í}™¥¹…±¥é…‘½Í}…¹Ñ¥½ÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€‘•±•Ñ…É}É¥™…Í}•áÁ¥É…‘…ÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€•µÁÉ•Í…}•ÍÑ…}™…Ù½É¥Ñ…‘„èì(€€€€€€€ÉÌèì•µÁÉ•Í…}¥‘}Á…É…´èÍÑÉ¥¹œìÕÍÕ…É¥½}¥‘}Á…É…´èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè‰½½±•…¸(€€€€€ô(€€€€€•µÁÉ•Í…}Á½‘•}É••‰•É}…•¹‘…µ•¹Ñ¼èì(€€€€€€€ÉÌèìÁ}•µÁÉ•Í…}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè‰½½±•…¸(€€€€€ô(€€€€€•¹•ÉÉ…É}Í•ÍÍ…½}ÍÕÁ½ÉÑ”èì(€€€€€€€ÉÌèìÁ}Ñ•±•™½¹”èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€•ÍÑ…Ñ¥ÍÑ¥…Í}¥‘…‘”èì(€€€€€€€ÉÌèì¥‘…‘•}¥‘}Á…É…´èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…Ñ•½É¥…Í}…Ñ¥Ù…Ìè¹Õµ‰•È(€€€€€€€€€•µÁÉ•Í…Í}Ù•É¥™¥…‘…Ìè¹Õµ‰•È(€€€€€€€€€µ•‘¥…}•É…±}…Ù…±¥…½•Ìè¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}…Ù…±¥…½•Ìè¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}•µÁÉ•Í…Ìè¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}•Ù•¹Ñ½Ìè¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}Ù¥ÍÕ…±¥é…½•Ìè¹Õµ‰•È(€€€€€€€õmt(€€€€€ô(€€€€€™¥¹…±¥é…É}•Ù•¹Ñ½Í}•áÁ¥É…‘½ÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€É•…Ñ•}É…™™±•}Í¡½ÉÑ}ÕÉ°èì(€€€€€€€ÉÌèìÁ}É…™™±•}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÍÑÉ¥¹œ(€€€€€ô(€€€€€É•…Ñ•}Í¡½ÉÑ}ÕÉ°èì(€€€€€€€ÉÌèìÁ}½É¥¥¹…±}ÕÉ°èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÍÑÉ¥¹œ(€€€€€ô(€€€€€•¹•É…Ñ•}Í¡½ÉÑ}½‘”èìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÍÑÉ¥¹œô(€€€€€•É…É}½‘¥½}ÍÕÁ½ÉÑ”èìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÍÑÉ¥¹œô(€€€€€•Ñ}…‘µ¥¹}Í¥Ñ•}ÍÑ…ÑÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹Ìè)Í½¸ô(€€€€€•Ñ}ÕÉÉ•¹Ñ}ÕÍ•É}É½±”èìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÍÑÉ¥¹œô(€€€€€•Ñ}ÁÉ½‰±•µ…}…ÕÑ½É}¹½µ”èì(€€€€€€€ÉÌèìÕÍÕ…É¥½}¥‘}Á…É…´èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÍÑÉ¥¹œ(€€€€€ô(€€€€€•Ñ}ÁÕ‰±¥}±•…‘•É‰½…Éèì(€€€€€€€ÉÌèì±¥µ¥Ñ}½Õ¹Ðüè¹Õµ‰•Èô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€‰…‘•Í}½Õ¹Ðè¹Õµ‰•È(€€€€€€€€€ÕÉÉ•¹Ñ}±•Ù•°è¹Õµ‰•È(€€€€€€€€€¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€É…¹­}Á½Í¥Ñ¥½¸è¹Õµ‰•È(€€€€€€€€€Ñ½Ñ…±}Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€€€Ý••­±å}Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€õmt(€€€€€ô(€€€€€•Ñ}ÁÕ‰±¥}ÕÍ•É}ÁÉ½™¥±”èì(€€€€€€€ÉÌèìÕÍ•É}ÕÕ¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€‰…‘•Í}½Õ¹Ðè¹Õµ‰•È(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€ÕÉÉ•¹Ñ}±•Ù•°è¹Õµ‰•È(€€€€€€€€€™½Ñ½}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Ñ½Ñ…±}Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€€€Ý••­±å}Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€õmt(€€€€€ô(€€€€€•Ñ}Í•ÉÙ¥½Í}ÁÕ‰±¥½Ìèì(€€€€€€€ÉÌè¹•Ù•È(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…Ñ•½É¥…}¥èÍÑÉ¥¹œ(€€€€€€€€€¥‘…‘•}¥èÍÑÉ¥¹œ(€€€€€€€€€É•…Ñ•‘}…ÐèÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÉ¥…¼èÍÑÉ¥¹œ(€€€€€€€€€•µ…¥°èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¥µ…•µ}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€ÍÑ…ÑÕÍ}…ÁÉ½Ù……¼èÍÑÉ¥¹œ(€€€€€€€€€Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥ÑÕ±¼èÍÑÉ¥¹œ(€€€€€€€€€ÕÁ‘…Ñ•‘}…ÐèÍÑÉ¥¹œ(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€€€Ý¡…ÑÍ…ÁÀèÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€ô(€€€€€•Ñ}Í•ÉÙ¥½Í}Ý¥Ñ¡}Í•ÕÉ•}½¹Ñ…Ðèì(€€€€€€€ÉÌèì…Ñ•½É¥…}Í±ÕœüèÍÑÉ¥¹œìÍ•…É¡}Ñ•É´üèÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…Ñ•½É¥…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€É¥…‘½}•´èÍÑÉ¥¹œ(€€€€€€€€€‘•ÍÉ¥…½}Í•ÉÙ¥¼èÍÑÉ¥¹œ(€€€€€€€€€•µ…¥±}ÁÉ•ÍÑ…‘½ÈèÍÑÉ¥¹œ(€€€€€€€€€™½Ñ½}Á•É™¥±}ÕÉ°èÍÑÉ¥¹œ(€€€€€€€€€¥èÍÑÉ¥¹œ(€€€€€€€€€¹½µ•}ÁÉ•ÍÑ…‘½ÈèÍÑÉ¥¹œ(€€€€€€€€€ÍÑ…ÑÕÍ}…ÁÉ½Ù……¼è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰ÍÑ…ÑÕÍ}Í•ÉÙ¥¼‰t(€€€€€€€€€Ñ•±•™½¹•}ÁÉ•ÍÑ…‘½ÈèÍÑÉ¥¹œ(€€€€€€€€€ÕÍÕ…É¥½}¥èÍÑÉ¥¹œ(€€€€€€€€€Ù¥ÍÕ…±¥é…½•Ìè¹Õµ‰•È(€€€€€€€€€Ý¡…ÑÍ…ÁÁ}ÁÉ•ÍÑ…‘½ÈèÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€ô(€€€€€•Ñ}ÕÍ•É}ÁÉ¥µ…Éå}É½±”èì(€€€€€€€ÉÌèì}ÕÍ•É}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰…ÁÁ}É½±”‰t(€€€€€ô(€€€€€•Ñ}Ý••­±å}±•…‘•É‰½…Éèì(€€€€€€€ÉÌèì±¥µ¥Ñ}½Õ¹Ðüè¹Õµ‰•Èô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€‰…‘•Í}½Õ¹Ðè¹Õµ‰•È(€€€€€€€€€ÕÉÉ•¹Ñ}±•Ù•°è¹Õµ‰•È(€€€€€€€€€¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€Ñ½Ñ…±}Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€€€ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€€€Ý••­±å}Á½¥¹ÑÌè¹Õµ‰•È(€€€€€€€€€Ý••­±å}É…¹­}Á½Í¥Ñ¥½¸è¹Õµ‰•È(€€€€€€€õmt(€€€€€ô(€€€€€¡…Í}É½±”èì(€€€€€€€ÉÌèì(€€€€€€€€€}É½±”è…Ñ…‰…Í•l‰ÁÕ‰±¥Œ‰ul‰¹ÕµÌ‰ul‰…ÁÁ}É½±”‰t(€€€€€€€€€}ÕÍ•É}¥èÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹Ìè‰½½±•…¸(€€€€€ô(€€€€€¥µÁ½ÉÑ…É}‘•Ñ…±¡•Í}½½±”è(€€€€€€€ðìÉÌèì½½±•}­•äèÍÑÉ¥¹œìÁ}Á±…•}¥èÍÑÉ¥¹œôìI•ÑÕÉ¹Ìè)Í½¸ô(€€€€€€€ðì(€€€€€€€€€€€ÉÌèì(€€€€€€€€€€€€€½½±•}­•äèÍÑÉ¥¹œ(€€€€€€€€€€€€€Á}…Ñ•½É¥…}¥èÍÑÉ¥¹œ(€€€€€€€€€€€€€Á}Á±…•}¥èÍÑÉ¥¹œ(€€€€€€€€€€€ô(€€€€€€€€€€€I•ÑÕÉ¹Ìè)Í½¸(€€€€€€€€€ô(€€€€€¥¹É•µ•¹Ñ}ÕÉ±}±¥­ÌèìÉÌèì½‘”èÍÑÉ¥¹œôìI•ÑÕÉ¹ÌèÍÑÉ¥¹œô(€€€€€¥¹É•µ•¹Ñ…É}Ù¥ÍÕ…±¥é……½}ÁÉ½‰±•µ„èì(€€€€€€€ÉÌèìÁÉ½‰±•µ…}¥‘}Á…É…´èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€¥¹É•µ•¹Ñ…É}Ù¥ÍÕ…±¥é……½}Í•ÉÙ¥¼èì(€€€€€€€ÉÌèìÍ•ÉÙ¥½}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€¥¹É•µ•¹Ñ…É}Ù¥ÍÕ…±¥é……½}Ù…„èì(€€€€€€€ÉÌèìÙ……}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€¥Í}…‘µ¥¸èìÉÌèì}ÕÍ•É}¥èÍÑÉ¥¹œôìI•ÑÕÉ¹Ìè‰½½±•…¸ô(€€€€€±¥µÁ…É}Í•ÍÍ½•Í}•áÁ¥É…‘…ÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€±¥µÁ…É}ÕÉ±Í}½½±”èìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€¹½Éµ…±¥é…É}Ñ•±•™½¹”èìÉÌèìÁ}Ñ•±•™½¹”èÍÑÉ¥¹œôìI•ÑÕÉ¹ÌèÍÑÉ¥¹œô(€€€€€½‰Ñ•É}µ•Õ}±¥µ¥Ñ•}…É‘…Á¥½Ìèì(€€€€€€€ÉÌè¹•Ù•È(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€…É‘…Á¥½Í}ÕÍ…‘½Ìè¹Õµ‰•È(€€€€€€€€€±¥µ¥Ñ•}…É‘…Á¥½Ìè¹Õµ‰•È(€€€€€€€€€Á±…¹½}¥èÍÑÉ¥¹œð¹Õ±°(€€€€€€€€€Á±…¹½}¹½µ”èÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€ô(€€€€€É•Í½±Ù•}Í¡½ÉÑ}ÕÉ°èì(€€€€€€€ÉÌèìÁ}Í¡½ÉÑ}½‘”èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÍÑÉ¥¹œ(€€€€€ô(€€€€€½‰Ñ•É}Í•ÍÍ…½}ÍÕÁ½ÉÑ”èì(€€€€€€€ÉÌèìÁ}Ñ•±•™½¹”èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€½ÕÑ}½‘¥¼èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}‘ÕÙ¥‘„èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•µÁÉ•Í…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•µÁÉ•Í…}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•Ñ…Á„èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€ô(€€€€€É•™É•Í¡}•µÁÉ•Í…Í}Á½ÁÕ±…É•ÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€É•¥ÍÑ•É}¹½Ñ¥™¥…Ñ¥½¹}‘•Ù¥”èì(€€€€€€€ÉÌèì(€€€€€€€€€Á}‘•Ù¥•}¹…µ”üèÍÑÉ¥¹œ(€€€€€€€€€Á}Á±…Ñ™½É´üèÍÑÉ¥¹œ(€€€€€€€€€Á}É•¥ÍÑÉ…Ñ¥½¹}¥èÍÑÉ¥¹œ(€€€€€€€€€Á}Ñ…É•Ñ}ÑåÁ”üèÍÑÉ¥¹œ(€€€€€€€€€Á}ÕÍ•É}…•¹ÐüèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹ÌèÍÑÉ¥¹œ(€€€€€ô(€€€€€É•¥ÍÑÉ…É}‘ÕÙ¥‘…}ÍÕÁ½ÉÑ”èì(€€€€€€€ÉÌèìÁ}‘ÕÙ¥‘„èÍÑÉ¥¹œìÁ}Ñ•±•™½¹”èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€½ÕÑ}½‘¥¼èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}‘ÕÙ¥‘„èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•µÁÉ•Í…}¹½µ”èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•µÁÉ•Í…}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}•Ñ…Á„èÍÑÉ¥¹œ(€€€€€€€€€½ÕÑ}Ñ•±•™½¹”èÍÑÉ¥¹œ(€€€€€€€õmt(€€€€€ô(€€€€€É•Í•Ñ}µ½¹Ñ¡±å}Á½¥¹ÑÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€É•Í•Ñ}Ý••­±å}Á½¥¹ÑÌèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€Í…Ù•}½ÕÁ½¹}Ý¥Ñ¡}µ¥ÍÍ¥½¸èì(€€€€€€€ÉÌèìÁ}ÕÁ½µ}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€ÑÉ…­}•µÁÉ•Í…}Ù¥Í¥Ðèì(€€€€€€€ÉÌèìÁ}•µÁÉ•Í…}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€Õ¹É•¥ÍÑ•É}¹½Ñ¥™¥…Ñ¥½¹}‘•Ù¥”èì(€€€€€€€ÉÌèìÁ}É•¥ÍÑÉ…Ñ¥½¹}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè‰½½±•…¸(€€€€€ô(€€€€€ÕÁ‘…Ñ•}±•…‘•É‰½…ÉèìÉÌè¹•Ù•ÈìI•ÑÕÉ¹ÌèÕ¹‘•™¥¹•ô(€€€€€ÕÁ‘…Ñ•}µ¥ÍÍ¥½¹}ÁÉ½É•ÍÌèì(€€€€€€€ÉÌèìÁ}…Ñ¥½¹}­•äèÍÑÉ¥¹œìÁ}ÕÍ•É}¥èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹ÌèÕ¹‘•™¥¹•(€€€€€ô(€€€€€ÕÍ…É}ÕÁ½´èìÉÌèìÕÁ½µ}¥‘}Á…É…´èÍÑÉ¥¹œôìI•ÑÕÉ¹Ìè‰½½±•…¸ô(€€€€€ÕÍ•É}¡…Í}Á•Éµ¥ÍÍ¥½¸èì(€€€€€€€ÉÌèìÑ…É•Ñ}¥‘…‘•}¥üèÍÑÉ¥¹œìÑ…É•Ñ}ÕÍ•É}¥üèÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè‰½½±•…¸(€€€€€ô(€€€€€Ù…±¥‘…É}ÕÁ½´èì(€€€€€€€ÉÌèì½‘¥½}Á…É…´èÍÑÉ¥¹œì•µÁÉ•Í…}¥‘}Á…É…´èÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìèì(€€€€€€€€€ÕÁ½µ}¥èÍÑÉ¥¹œ(€€€€€€€€€µ•¹Í…•´èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥Á¼èÍÑÉ¥¹œ(€€€€€€€€€Ñ¥ÑÕ±¼èÍÑÉ¥¹œ(€€€€€€€€€Ù…±¥‘¼è‰½½±•…¸(€€€€€€€€€Ù…±½Èè¹Õµ‰•È(€€€€€€€õmt(€€€€€ô(€€€€€Ù•É¥™¥…É}±¥µ¥Ñ•}¹½Ñ¥™¥…½•Í}Ý¡…ÑÍ…ÁÀèì(€€€€€€€ÉÌèìÁ}•µÁÉ•Í…}¥èÍÑÉ¥¹œìÁ}Ñ¥Á½}¹½Ñ¥™¥……¼üèÍÑÉ¥¹œô(€€€€€€€I•ÑÕÉ¹Ìè)Í½¸(€€€€€ô(€€€€€Ù½Ñ…É}•¹ÅÕ•Ñ”èì(€€€€€€€ÉÌèì(€€€€€€€€€•¹ÅÕ•Ñ•}¥‘}Á…É…´èÍÑÉ¥¹œ(€€€€€€€€€¥Á}Á…É…´üèÍÑÉ¥¹œ(€€€€€€€€€½Á½•Í}¥¹‘¥•Ìè¹Õµ‰•Émt(€€€€€€€€€ÕÍ•É}…•¹Ñ}Á…É…´üèÍÑÉ¥¹œ(€€€€€€€ô(€€€€€€€I•ÑÕÉ¹Ìè‰½½±•…¸(€€€€€ô(€€€ô(€€€¹ÕµÌèì(€€€€€…ÁÁ}É½±”è(€€€€€€€ð€‰ÕÍÕ…É¥¼ˆ(€€€€€€€ð€‰É¥…‘½É}•µÁÉ•Í„ˆ(€€€€€€€ð€‰•µÁÉ•Í„ˆ(€€€€€€€ð€‰…‘µ¥¹}¥‘…‘”ˆ(€€€€€€€ð€‰…‘µ¥¹}•É…°ˆ(€€€€€ÁÉ¥½É¥‘…‘•}ÁÉ½‰±•µ„è€‰‰…¥á„ˆð€‰µ•‘¥„ˆð€‰…±Ñ„ˆð€‰ÕÉ•¹Ñ”ˆ(€€€€€ÍÑ…ÑÕÍ}…ÁÉ½Ù……¼è€‰Á•¹‘•¹Ñ”ˆð€‰…ÁÉ½Ù…‘¼ˆð€‰É•©•¥Ñ…‘¼ˆð€‰™¥¹…±¥é…‘¼ˆ(€€€€€ÍÑ…ÑÕÍ}ÁÉ½‰±•µ„è€‰…‰•ÉÑ¼ˆð€‰•µ}…¹…±¥Í”ˆð€‰É•Í½±Ù¥‘¼ˆð€‰™•¡…‘¼ˆ(€€€€€ÍÑ…ÑÕÍ}Í•ÉÙ¥¼è€‰Á•¹‘•¹Ñ”ˆð€‰…ÁÉ½Ù…‘¼ˆð€‰É•©•¥Ñ…‘¼ˆ(€€€€€Ñ¥Á½}…Ñ•½É¥„è€‰•µÁÉ•Í„ˆð€‰•Ù•¹Ñ¼ˆð€‰Í•ÉÙ¥¼ˆ(€€€€€Ñ¥Á½}½¹Ñ„è(€€€€€€€ð€‰…‘µ¥¹}•É…°ˆ(€€€€€€€ð€‰…‘µ¥¹}¥‘…‘”ˆ(€€€€€€€ð€‰•µÁÉ•Í„ˆ(€€€€€€€ð€‰ÕÍÕ…É¥¼ˆ(€€€€€€€ð€‰É¥…‘½É}•µÁÉ•Í„ˆ(€€€€€Ñ¥Á½}½¹Ñ•Õ‘½}…¹…°è€‰¹½Ñ¥¥„ˆð€‰Ù¥‘•¼ˆð€‰¥µ…•´ˆð€‰É•ÍÕ±Ñ…‘½}Í½ÉÑ•¥¼ˆ(€€€€€Ñ¥Á½}ÕÁ½´è€‰Á½É•¹Ñ…•´ˆð€‰Ù…±½É}™¥á¼ˆ(€€€€€Ñ¥Á½}Í•…½}‰…¹¹•Èè(€€€€€€€ð€‰¡½µ”ˆ(€€€€€€€ð€‰•µÁÉ•Í…Ìˆ(€€€€€€€ð€‰•Ù•¹Ñ½Ìˆ(€€€€€€€ð€‰…Ñ•½É¥…Ìˆ(€€€€€€€ð€‰‰ÕÍ„ˆ(€€€€€€€ð€‰…¹…±}Ù¥‘•¼ˆ(€€€€€€€ð€‰‘½µ¥¹¼ˆ(€€€€€€€ð€‰•É…‘½É}É¥™„ˆ(€€€€€€€ð€‰™•ÉÉ…µ•¹Ñ…Ìˆ(€€€€€€€ð€‰•É…‘½É}½‰É…¹„ˆ(€€€€€€€ð€‰É¥…‘½É}ÕÉÉ¥Õ±¼ˆ(€€€€€€€ð€‰•ÍÑ…½}½‰É…¹…Ìˆ(€€€€€€€ð€‰…±Õ±…‘½É…}½É…µ•¹Ñ¼ˆ(€€€€€€€ð€‰…±Õ±…‘½É…}µ…É•´ˆ(€€€€€€€ð€‰Í¥µÕ±…‘½É}É•Í¥Í…¼ˆ(€€€€€€€ð€‰±•¥Ñ½É}Ù½èˆ(€€€€€€€ð€‰…É‘…Á¥½}‘¥¥Ñ…°ˆ(€€€€€Ñ¥Á½}Ù…„è€‰±Ðˆð€‰Ñ•µÁ½É…É¥¼ˆð€‰•ÍÑ…¥¼ˆð€‰™É••±…¹”ˆ(€€€ô(€€€½µÁ½Í¥Ñ•QåÁ•Ìèì(€€€€€m|¥¸¹•Ù•Étè¹•Ù•È(€€€ô(€ô)ô()ÑåÁ”…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì€ô=µ¥Ðñ…Ñ…‰…Í”°€‰}}%¹Ñ•É¹…±MÕÁ…‰…Í”ˆø()ÑåÁ”•™…Õ±ÑM¡•µ„€ô…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±ÍmáÑÉ…Ðñ­•å½˜…Ñ…‰…Í”°€‰ÁÕ‰±¥Œˆùt()•áÁ½ÉÐÑåÁ”Q…‰±•Ìð(€•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì(€€€ð­•å½˜€¡•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰t€˜•™…Õ±ÑM¡•µ…l‰Y¥•ÝÌ‰t¤(€€€ðìÍ¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ìô°(€Q…‰±•9…µ”•áÑ•¹‘Ì•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€€€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì(€ô(€€€€ü­•å½˜€¡…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Q…‰±•Ì‰t€˜(€€€€€€€…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Y¥•ÝÌ‰t¤(€€€€è¹•Ù•È€ô¹•Ù•È°(ø€ô•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì)ô(€€ü€¡…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Q…‰±•Ì‰t€˜(€€€€€…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Y¥•ÝÌ‰t¥mQ…‰±•9…µ•t•áÑ•¹‘Ìì(€€€€€I½Üè¥¹™•ÈH(€€€ô(€€€€üH(€€€€è¹•Ù•È(€€è•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì­•å½˜€¡•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰t€˜(€€€€€€€•™…Õ±ÑM¡•µ…l‰Y¥•ÝÌ‰t¤(€€€€ü€¡•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰t€˜(€€€€€€€•™…Õ±ÑM¡•µ…l‰Y¥•ÝÌ‰t¥m•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ít•áÑ•¹‘Ìì(€€€€€€€I½Üè¥¹™•ÈH(€€€€€ô(€€€€€€üH(€€€€€€è¹•Ù•È(€€€€è¹•Ù•È()•áÁ½ÉÐÑåÁ”Q…‰±•Í%¹Í•ÉÐð(€•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì(€€€ð­•å½˜•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰t(€€€ðìÍ¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ìô°(€Q…‰±•9…µ”•áÑ•¹‘Ì•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€€€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì(€ô(€€€€ü­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Q…‰±•Ì‰t(€€€€è¹•Ù•È€ô¹•Ù•È°(ø€ô•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì)ô(€€ü…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Q…‰±•Ì‰umQ…‰±•9…µ•t•áÑ•¹‘Ìì(€€€€€%¹Í•ÉÐè¥¹™•È$(€€€ô(€€€€ü$(€€€€è¹•Ù•È(€€è•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì­•å½˜•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰t(€€€€ü•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰um•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ít•áÑ•¹‘Ìì(€€€€€€€%¹Í•ÉÐè¥¹™•È$(€€€€€ô(€€€€€€ü$(€€€€€€è¹•Ù•È(€€€€è¹•Ù•È()•áÁ½ÉÐÑåÁ”Q…‰±•ÍUÁ‘…Ñ”ð(€•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì(€€€ð­•å½˜•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰t(€€€ðìÍ¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ìô°(€Q…‰±•9…µ”•áÑ•¹‘Ì•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€€€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì(€ô(€€€€ü­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Q…‰±•Ì‰t(€€€€è¹•Ù•È€ô¹•Ù•È°(ø€ô•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì)ô(€€ü…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰Q…‰±•Ì‰umQ…‰±•9…µ•t•áÑ•¹‘Ìì(€€€€€UÁ‘…Ñ”è¥¹™•ÈT(€€€ô(€€€€üT(€€€€è¹•Ù•È(€€è•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì­•å½˜•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰t(€€€€ü•™…Õ±ÑM¡•µ…l‰Q…‰±•Ì‰um•™…Õ±ÑM¡•µ…Q…‰±•9…µ•=É=ÁÑ¥½¹Ít•áÑ•¹‘Ìì(€€€€€€€UÁ‘…Ñ”è¥¹™•ÈT(€€€€€ô(€€€€€€üT(€€€€€€è¹•Ù•È(€€€€è¹•Ù•È()•áÁ½ÉÐÑåÁ”¹ÕµÌð(€•™…Õ±ÑM¡•µ…¹Õµ9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì(€€€ð­•å½˜•™…Õ±ÑM¡•µ…l‰¹ÕµÌ‰t(€€€ðìÍ¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ìô°(€¹Õµ9…µ”•áÑ•¹‘Ì•™…Õ±ÑM¡•µ…¹Õµ9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€€€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì(€ô(€€€€ü­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…¹Õµ9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰¹ÕµÌ‰t(€€€€è¹•Ù•È€ô¹•Ù•È°(ø€ô•™…Õ±ÑM¡•µ…¹Õµ9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì)ô(€€ü…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ím•™…Õ±ÑM¡•µ…¹Õµ9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰¹ÕµÌ‰um¹Õµ9…µ•t(€€è•™…Õ±ÑM¡•µ…¹Õµ9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì­•å½˜•™…Õ±ÑM¡•µ…l‰¹ÕµÌ‰t(€€€€ü•™…Õ±ÑM¡•µ…l‰¹ÕµÌ‰um•™…Õ±ÑM¡•µ…¹Õµ9…µ•=É=ÁÑ¥½¹Ít(€€€€è¹•Ù•È()•áÁ½ÉÐÑåÁ”½µÁ½Í¥Ñ•QåÁ•Ìð(€AÕ‰±¥½µÁ½Í¥Ñ•QåÁ•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì(€€€ð­•å½˜•™…Õ±ÑM¡•µ…l‰½µÁ½Í¥Ñ•QåÁ•Ì‰t(€€€ðìÍ¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ìô°(€½µÁ½Í¥Ñ•QåÁ•9…µ”•áÑ•¹‘ÌAÕ‰±¥½µÁ½Í¥Ñ•QåÁ•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€€€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì(€ô(€€€€ü­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±ÍmAÕ‰±¥½µÁ½Í¥Ñ•QåÁ•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰½µÁ½Í¥Ñ•QåÁ•Ì‰t(€€€€è¹•Ù•È€ô¹•Ù•È°(ø€ôAÕ‰±¥½µÁ½Í¥Ñ•QåÁ•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ìì(€Í¡•µ„è­•å½˜…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±Ì)ô(€€ü…Ñ…‰…Í•]¥Ñ¡½ÕÑ%¹Ñ•É¹…±ÍmAÕ‰±¥½µÁ½Í¥Ñ•QåÁ•9…µ•=É=ÁÑ¥½¹Íl‰Í¡•µ„‰uul‰½µÁ½Í¥Ñ•QåÁ•Ì‰um½µÁ½Í¥Ñ•QåÁ•9…µ•t(€€èAÕ‰±¥½µÁ½Í¥Ñ•QåÁ•9…µ•=É=ÁÑ¥½¹Ì•áÑ•¹‘Ì­•å½˜•™…Õ±ÑM¡•µ…l‰½µÁ½Í¥Ñ•QåÁ•Ì‰t(€€€€ü•™…Õ±ÑM¡•µ…l‰½µÁ½Í¥Ñ•QåÁ•Ì‰umAÕ‰±¥½µÁ½Í¥Ñ•QåÁ•9…µ•=É=ÁÑ¥½¹Ít(€€€€è¹•Ù•È()•áÁ½ÉÐ½¹ÍÐ½¹ÍÑ…¹ÑÌ€ôì(€ÁÕ‰±¥Œèì(€€€¹ÕµÌèì(€€€€€…ÁÁ}É½±”èl(€€€€€€€€‰ÕÍÕ…É¥¼ˆ°(€€€€€€€€‰É¥…‘½É}•µÁÉ•Í„ˆ°(€€€€€€€€‰•µÁÉ•Í„ˆ°(€€€€€€€€‰…‘µ¥¹}¥‘…‘”ˆ°(€€€€€€€€‰…‘µ¥¹}•É…°ˆ°(€€€€€t°(€€€€€ÁÉ¥½É¥‘…‘•}ÁÉ½‰±•µ„èl‰‰…¥á„ˆ°€‰µ•‘¥„ˆ°€‰…±Ñ„ˆ°€‰ÕÉ•¹Ñ”‰t°(€€€€€ÍÑ…ÑÕÍ}…ÁÉ½Ù……¼èl‰Á•¹‘•¹Ñ”ˆ°€‰…ÁÉ½Ù…‘¼ˆ°€‰É•©•¥Ñ…‘¼ˆ°€‰™¥¹…±¥é…‘¼‰t°(€€€€€ÍÑ…ÑÕÍ}ÁÉ½‰±•µ„èl‰…‰•ÉÑ¼ˆ°€‰•µ}…¹…±¥Í”ˆ°€‰É•Í½±Ù¥‘¼ˆ°€‰™•¡…‘¼‰t°(€€€€€ÍÑ…ÑÕÍ}Í•ÉÙ¥¼èl‰Á•¹‘•¹Ñ”ˆ°€‰…ÁÉ½Ù…‘¼ˆ°€‰É•©•¥Ñ…‘¼‰t°(€€€€€Ñ¥Á½}…Ñ•½É¥„èl‰•µÁÉ•Í„ˆ°€‰•Ù•¹Ñ¼ˆ°€‰Í•ÉÙ¥¼‰t°(€€€€€Ñ¥Á½}½¹Ñ„èl(€€€€€€€€‰…‘µ¥¹}•É…°ˆ°(€€€€€€€€‰…‘µ¥¹}¥‘…‘”ˆ°(€€€€€€€€‰•µÁÉ•Í„ˆ°(€€€€€€€€‰ÕÍÕ…É¥¼ˆ°(€€€€€€€€‰É¥…‘½É}•µÁÉ•Í„ˆ°(€€€€€t°(€€€€€Ñ¥Á½}½¹Ñ•Õ‘½}…¹…°èl‰¹½Ñ¥¥„ˆ°€‰Ù¥‘•¼ˆ°€‰¥µ…•´ˆ°€‰É•ÍÕ±Ñ…‘½}Í½ÉÑ•¥¼‰t°(€€€€€Ñ¥Á½}ÕÁ½´èl‰Á½É•¹Ñ…•´ˆ°€‰Ù…±½É}™¥á¼‰t°(€€€€€Ñ¥Á½}Í•…½}‰…¹¹•Èèl(€€€€€€€€‰¡½µ”ˆ°(€€€€€€€€‰•µÁÉ•Í…Ìˆ°(€€€€€€€€‰•Ù•¹Ñ½Ìˆ°(€€€€€€€€‰…Ñ•½É¥…Ìˆ°(€€€€€€€€‰‰ÕÍ„ˆ°(€€€€€€€€‰…¹…±}Ù¥‘•¼ˆ°(€€€€€€€€‰‘½µ¥¹¼ˆ°(€€€€€€€€‰•É…‘½É}É¥™„ˆ°(€€€€€€€€‰™•ÉÉ…µ•¹Ñ…Ìˆ°(€€€€€€€€‰•É…‘½É}½‰É…¹„ˆ°(€€€€€€€€‰É¥…‘½É}ÕÉÉ¥Õ±¼ˆ°(€€€€€€€€‰•ÍÑ…½}½‰É…¹…Ìˆ°(€€€€€€€€‰…±Õ±…‘½É…}½É…µ•¹Ñ¼ˆ°(€€€€€€€€‰…±Õ±…‘½É…}µ…É•´ˆ°(€€€€€€€€‰Í¥µÕ±…‘½É}É•Í¥Í…¼ˆ°(€€€€€€€€‰±•¥Ñ½É}Ù½èˆ°(€€€€€€€€‰…É‘…Á¥½}‘¥¥Ñ…°ˆ°(€€€€€t°(€€€€€Ñ¥Á½}Ù…„èl‰±Ðˆ°€‰Ñ•µÁ½É…É¥¼ˆ°€‰•ÍÑ…¥¼ˆ°€‰™É••±…¹”‰t°(€€€ô°(€ô°)ô…Ì½¹ÍÐ(