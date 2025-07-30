import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { xmlContent } = await req.json()

    if (!xmlContent) {
      throw new Error('XML content is required')
    }

    console.log('Processing XML content...')
    
    // Parse XML to extract NFe data
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlContent, 'application/xml')

    // Extract data from XML structure
    const infNFe = xmlDoc.querySelector('infNFe')
    const ide = xmlDoc.querySelector('ide')
    const emit = xmlDoc.querySelector('emit')
    const dest = xmlDoc.querySelector('dest')
    const total = xmlDoc.querySelector('total')
    const ICMSTot = xmlDoc.querySelector('ICMSTot')

    if (!infNFe || !ide || !emit || !total || !ICMSTot) {
      throw new Error('Invalid NFe XML structure')
    }

    const chaveAcesso = infNFe.getAttribute('Id')?.replace('NFe', '') || ''
    const numeroNfe = ide.querySelector('nNF')?.textContent || ''
    const serie = ide.querySelector('serie')?.textContent || ''
    const dataEmissao = ide.querySelector('dhEmi')?.textContent?.split('T')[0] || ''
    
    const cnpjEmitente = emit.querySelector('CNPJ')?.textContent || ''
    const nomeEmitente = emit.querySelector('xNome')?.textContent || ''
    
    const cnpjDestinatario = dest?.querySelector('CNPJ')?.textContent || ''
    const nomeDestinatario = dest?.querySelector('xNome')?.textContent || ''
    
    const valorTotal = parseFloat(ICMSTot.querySelector('vNF')?.textContent || '0')
    const valorICMS = parseFloat(ICMSTot.querySelector('vICMS')?.textContent || '0')
    const valorIPI = parseFloat(ICMSTot.querySelector('vIPI')?.textContent || '0')
    const valorPIS = parseFloat(ICMSTot.querySelector('vPIS')?.textContent || '0')
    const valorCOFINS = parseFloat(ICMSTot.querySelector('vCOFINS')?.textContent || '0')

    console.log('Extracted data:', {
      chaveAcesso,
      numeroNfe,
      serie,
      dataEmissao,
      cnpjEmitente,
      nomeEmitente,
      valorTotal
    })

    // Insert into nfe_data table
    const { data: nfeData, error: nfeError } = await supabase
      .from('nfe_data')
      .insert({
        numero_nfe: numeroNfe,
        serie: serie,
        chave_acesso: chaveAcesso,
        cnpj_emitente: cnpjEmitente,
        nome_emitente: nomeEmitente,
        cnpj_destinatario: cnpjDestinatario,
        nome_destinatario: nomeDestinatario,
        data_emissao: dataEmissao,
        valor_total: valorTotal,
        valor_icms: valorICMS,
        valor_ipi: valorIPI,
        valor_pis: valorPIS,
        valor_cofins: valorCOFINS,
        xml_content: xmlContent
      })
      .select()
      .single()

    if (nfeError) {
      console.error('Error inserting NFe data:', nfeError)
      throw nfeError
    }

    console.log('NFe data inserted successfully:', nfeData.id)

    // Create accounts payable entry
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 30) // Default 30 days

    const { data: apData, error: apError } = await supabase
      .from('ap_installments')
      .insert({
        nfe_id: nfeData.id,
        descricao: `NFe ${numeroNfe} - ${nomeEmitente}`,
        fornecedor: nomeEmitente,
        valor: valorTotal,
        data_vencimento: vencimento.toISOString().split('T')[0],
        categoria: 'NFe'
      })
      .select()
      .single()

    if (apError) {
      console.error('Error inserting AP installment:', apError)
      throw apError
    }

    console.log('AP installment created successfully:', apData.id)

    return new Response(
      JSON.stringify({
        success: true,
        nfeId: nfeData.id,
        apId: apData.id,
        message: 'NFe processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing NFe XML:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})