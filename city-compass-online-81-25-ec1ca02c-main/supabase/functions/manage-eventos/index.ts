import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Functions: {
      finalizar_eventos_expirados: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deletar_eventos_finalizados_antigos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    console.log('Iniciando gerenciamento automático de eventos...')

    // 1. Finalizar eventos expirados
    const { error: finalizeError } = await supabase.rpc('finalizar_eventos_expirados')
    
    if (finalizeError) {
      console.error('Erro ao finalizar eventos expirados:', finalizeError)
      throw finalizeError
    }

    console.log('Eventos expirados finalizados com sucesso')

    // 2. Deletar eventos finalizados há mais de 7 dias
    const { error: deleteError } = await supabase.rpc('deletar_eventos_finalizados_antigos')
    
    if (deleteError) {
      console.error('Erro ao deletar eventos antigos:', deleteError)
      throw deleteError
    }

    console.log('Eventos finalizados antigos deletados com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Gerenciamento de eventos executado com sucesso',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro no gerenciamento de eventos:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})