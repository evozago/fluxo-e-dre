-- Adicionar campo para dados de pagamento na tabela ap_installments
ALTER TABLE public.ap_installments 
ADD COLUMN IF NOT EXISTS dados_pagamento TEXT;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.ap_installments.forma_pagamento IS 'Forma de pagamento: PIX, Boleto, Cartão, Transferência, etc.';
COMMENT ON COLUMN public.ap_installments.dados_pagamento IS 'Dados específicos do pagamento: chave PIX, email, telefone, dados do cartão, etc.';