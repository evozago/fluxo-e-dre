-- Preencher forma de pagamento das parcelas recorrentes já existentes
UPDATE ap_installments 
SET forma_pagamento = 'Recorrente' 
WHERE eh_recorrente = TRUE 
  AND forma_pagamento IS NULL;