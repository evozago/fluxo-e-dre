-- Adicionar coluna para data e hora do pagamento
ALTER TABLE public.ap_installments 
ADD COLUMN data_hora_pagamento TIMESTAMP WITH TIME ZONE;

-- Atualizar registros existentes que já estão pagos para usar a data atual
UPDATE public.ap_installments 
SET data_hora_pagamento = NOW() 
WHERE status = 'pago' AND data_hora_pagamento IS NULL;