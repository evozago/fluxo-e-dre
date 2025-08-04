import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { xmlContent } = await req.json()

    if (!xmlContent) {
      throw new Error('XML content is required')
    }

    console.log('Processing XML content...')
    
    // Helper function to extract text from XML using regex
    function extractValue(xml: string, tag: string): string {
      const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`)
      const match = xml.match(regex)
      return match ? match[1].trim() : ''
    }

    // Helper function to extract attribute value
    function extractAttribute(xml: string, element: string, attribute: string): string {
      const regex = new RegExp(`<${element}[^>]*${attribute}="([^"]*)"`)
      const match = xml.match(regex)
      return match ? match[1] : ''
    }

    // Extract data from XML using regex
    const chaveAcesso = extractAttribute(xmlContent, 'infNFe', 'Id').replace('NFe', '')
    const numeroNfe = extractValue(xmlContent, 'nNF')
    const serie = extractValue(xmlContent, 'serie')
    const dataEmissaoFull = extractValue(xmlContent, 'dhEmi')
    const dataEmissao = dataEmissaoFull.split('T')[0]
    
    // Emitente data
    const cnpjEmitente = extractValue(xmlContent, 'CNPJ')
    const nomeEmitente = extractValue(xmlContent, 'xNome')
    
    // Destinatário data (buscar após o emit)
    const destSection = xmlContent.split('<dest>')[1]?.split('</dest>')[0] || ''
    const cnpjDestinatario = extractValue(destSection, 'CNPJ')
    const nomeDestinatario = extractValue(destSection, 'xNome')
    
    // Valores totais
    const valorTotal = parseFloat(extractValue(xmlContent, 'vNF') || '0')
    const valorICMS = parseFloat(extractValue(xmlContent, 'vICMS') || '0')
    const valorIPI = parseFloat(extractValue(xmlContent, 'vIPI') || '0')
    const valorPIS = parseFloat(extractValue(xmlContent, 'vPIS') || '0')
    const valorCOFINS = parseFloat(extractValue(xmlContent, 'vCOFINS') || '0')

    if (!chaveAcesso || !numeroNfe || !cnpjEmitente) {
      throw new Error('Dados essenciais da NFe não encontrados no XML')
    }

    console.log('Extracted data:', {
      chaveAcesso,
      numeroNfe,
      serie,
      dataEmissao,
      cnpjEmitente,
      nomeEmitente,
      valorTotal
    })

    // Check if NFe already exists
    const { data: existingNfe } = await supabase
      .from('nfe_data')
      .select('id')
      .eq('chave_acesso', chaveAcesso)
      .maybeSingle()

    let nfeData
    
    if (existingNfe) {
      console.log('NFe already exists, using existing record:', existingNfe.id)
      nfeData = existingNfe
    } else {
      // Insert new NFe data
      const { data: newNfeData, error: nfeError } = await supabase
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
      
      nfeData = newNfeData
    }

    console.log('NFe data inserted successfully:', nfeData.id)

    // Create or update fornecedor automatically
    let fornecedorId = null
    if (cnpjEmitente && nomeEmitente) {
      const { data: existingFornecedor } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('cnpj_cpf', cnpjEmitente)
        .maybeSingle()

      if (existingFornecedor) {
        fornecedorId = existingFornecedor.id
        console.log('Using existing fornecedor:', fornecedorId)
      } else {
        const { data: newFornecedor, error: fornecedorError } = await supabase
          .from('fornecedores')
          .insert({
            nome: nomeEmitente,
            cnpj_cpf: cnpjEmitente,
            ativo: true
          })
          .select()
          .single()

        if (fornecedorError) {
          console.error('Error creating fornecedor:', fornecedorError)
        } else {
          fornecedorId = newFornecedor.id
          console.log('Created new fornecedor:', fornecedorId)
        }
      }
    }

    // Extract duplicatas (installments) from XML
    const dupRegex = /<dup>[\s\S]*?<\/dup>/g
    const duplicatas = xmlContent.match(dupRegex) || []
    
    const installments = []
    const totalParcelas = duplicatas.length > 0 ? duplicatas.length : 1
    
    if (duplicatas.length > 0) {
      // Process each duplicata
      for (let i = 0; i < duplicatas.length; i++) {
        const dup = duplicatas[i]
        const nDup = extractValue(dup, 'nDup')
        const dVenc = extractValue(dup, 'dVenc')
        const vDup = parseFloat(extractValue(dup, 'vDup') || '0')
        const numeroParcela = i + 1
        
        if (dVenc && vDup > 0) {
          // Check if installment already exists for this NFe
          const { data: existingInstallment } = await supabase
            .from('ap_installments')
            .select('id')
            .eq('nfe_id', nfeData.id)
            .eq('descricao', `NFe ${numeroNfe} - Parcela ${String(numeroParcela).padStart(3, '0')} - ${nomeEmitente}`)
            .maybeSingle()
          
          if (existingInstallment) {
            console.log('Installment already exists, skipping:', existingInstallment.id)
            installments.push(existingInstallment.id)
            continue
          }

          // Get default entity (first one found) to comply with NOT NULL constraint
          const { data: entities } = await supabase
            .from('entidades')
            .select('id')
            .eq('ativo', true)
            .limit(1)
          
          const entidadeId = entities?.[0]?.id
          
          if (!entidadeId) {
            throw new Error('Nenhuma entidade ativa encontrada. É necessário ter pelo menos uma entidade cadastrada.')
          }

          const { data: apData, error: apError } = await supabase
            .from('ap_installments')
            .insert({
              nfe_id: nfeData.id,
              descricao: `NFe ${numeroNfe} - Parcela ${String(numeroParcela).padStart(3, '0')} - ${nomeEmitente}`,
              fornecedor: nomeEmitente,
              valor: vDup,
              valor_total_titulo: valorTotal,
              data_vencimento: dVenc,
              categoria: 'NFe',
              entidade_id: entidadeId,
              numero_documento: numeroNfe,
              numero_parcela: numeroParcela,
              total_parcelas: totalParcelas
            })
            .select()
            .single()

          if (apError) {
            console.error('Error inserting AP installment:', apError)
            throw apError
          }
          
          installments.push(apData.id)
        }
      }
    } else {
      // Check if single installment already exists for this NFe
      const { data: existingInstallment } = await supabase
        .from('ap_installments')
        .select('id')
        .eq('nfe_id', nfeData.id)
        .eq('descricao', `NFe ${numeroNfe} - ${nomeEmitente}`)
        .maybeSingle()
      
      if (existingInstallment) {
        console.log('Single installment already exists, using existing:', existingInstallment.id)
        installments.push(existingInstallment.id)
      } else {
        // No duplicatas found, create single installment with 30 days
        const vencimento = new Date()
        vencimento.setDate(vencimento.getDate() + 30)

        // Get default entity (first one found) to comply with NOT NULL constraint
        const { data: entities } = await supabase
          .from('entidades')
          .select('id')
          .eq('ativo', true)
          .limit(1)
        
        const entidadeId = entities?.[0]?.id
        
        if (!entidadeId) {
          throw new Error('Nenhuma entidade ativa encontrada. É necessário ter pelo menos uma entidade cadastrada.')
        }

        const { data: apData, error: apError } = await supabase
          .from('ap_installments')
          .insert({
            nfe_id: nfeData.id,
            descricao: `NFe ${numeroNfe} - ${nomeEmitente}`,
            fornecedor: nomeEmitente,
            valor: valorTotal,
            valor_total_titulo: valorTotal,
            data_vencimento: vencimento.toISOString().split('T')[0],
            categoria: 'NFe',
            entidade_id: entidadeId,
            numero_documento: numeroNfe,
            numero_parcela: 1,
            total_parcelas: 1
          })
          .select()
          .single()

        if (apError) {
          console.error('Error inserting AP installment:', apError)
          throw apError
        }
        
        installments.push(apData.id)
      }
    }

    console.log('AP installments created successfully:', installments)

    return new Response(
      JSON.stringify({
        success: true,
        nfeId: nfeData.id,
        installmentIds: installments,
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