import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PedidoRow {
  fornecedor: string;
  marca: string;
  referencia: string;
  codigo_barras?: string;
  descricao: string;
  cor: string;
  tamanho: string;
  quantidade: number;
  custo_unitario: number;
  data_pedido?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const arquivo_origem = formData.get('arquivo_origem') as string;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo enviado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processando arquivo XLSX de pedidos:', file.name);

    // Ler o arquivo como ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);

    // Para esta implementação inicial, vamos simular o processamento
    // Em uma implementação real, você usaria uma biblioteca como SheetJS
    
    // Simular dados extraídos do XLSX para teste
    const pedidosSimulados: PedidoRow[] = [
      {
        fornecedor: "Fornecedor Teste",
        marca: "Marca Teste",
        referencia: "REF001",
        codigo_barras: "1234567890123",
        descricao: "Vestido manga curta",
        cor: "Azul",
        tamanho: "4",
        quantidade: 10,
        custo_unitario: 55.00,
        data_pedido: new Date().toISOString().split('T')[0]
      }
    ];

    let processados = 0;
    let erros = 0;
    const detalhesErros: string[] = [];

    // Processar cada linha do pedido
    for (const pedido of pedidosSimulados) {
      try {
        // Buscar fornecedor pelo nome
        const { data: fornecedorData, error: fornecedorError } = await supabase
          .from('fornecedores')
          .select('id')
          .ilike('nome', `%${pedido.fornecedor}%`)
          .single();

        if (fornecedorError || !fornecedorData) {
          throw new Error(`Fornecedor não encontrado: ${pedido.fornecedor}`);
        }

        // Buscar marca pelo nome e fornecedor
        const { data: marcaData, error: marcaError } = await supabase
          .from('marcas')
          .select('id')
          .ilike('nome', `%${pedido.marca}%`)
          .eq('fornecedor_id', fornecedorData.id)
          .single();

        if (marcaError || !marcaData) {
          throw new Error(`Marca não encontrada: ${pedido.marca} para fornecedor ${pedido.fornecedor}`);
        }

        // Verificar se já existe um pedido similar
        const { data: existingPedido } = await supabase
          .from('pedidos_produtos')
          .select('id')
          .eq('referencia', pedido.referencia)
          .eq('marca_id', marcaData.id)
          .eq('cor', pedido.cor)
          .eq('tamanho', pedido.tamanho)
          .single();

        if (existingPedido) {
          // Atualizar pedido existente
          const { error: updateError } = await supabase
            .from('pedidos_produtos')
            .update({
              quantidade: pedido.quantidade,
              custo_unitario: pedido.custo_unitario,
              data_pedido: pedido.data_pedido,
              descricao: pedido.descricao,
              codigo_barras: pedido.codigo_barras || null,
              arquivo_origem: arquivo_origem
            })
            .eq('id', existingPedido.id);

          if (updateError) throw updateError;
        } else {
          // Inserir novo pedido
          const { error: insertError } = await supabase
            .from('pedidos_produtos')
            .insert({
              fornecedor_id: fornecedorData.id,
              marca_id: marcaData.id,
              referencia: pedido.referencia,
              codigo_barras: pedido.codigo_barras || null,
              descricao: pedido.descricao,
              cor: pedido.cor,
              tamanho: pedido.tamanho,
              quantidade: pedido.quantidade,
              custo_unitario: pedido.custo_unitario,
              data_pedido: pedido.data_pedido,
              arquivo_origem: arquivo_origem,
              status: 'pendente'
            });

          if (insertError) throw insertError;
        }

        processados++;
        console.log(`Pedido processado: ${pedido.referencia} - ${pedido.cor} - ${pedido.tamanho}`);

      } catch (error) {
        erros++;
        const errorMessage = `Erro na linha ${pedido.referencia}: ${error.message}`;
        detalhesErros.push(errorMessage);
        console.error(errorMessage);
      }
    }

    const resultado = {
      success: true,
      arquivo: file.name,
      processados,
      erros,
      total: pedidosSimulados.length,
      detalhes_erros: detalhesErros
    };

    console.log('Processamento concluído:', resultado);

    return new Response(
      JSON.stringify(resultado),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});