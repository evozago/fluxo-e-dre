-- Atualizar despesas recorrentes que têm numero_documento NULL para usar padrão brasileiro de data
UPDATE ap_installments 
SET numero_documento = (
  SELECT 'REC-' || TO_CHAR(ap_installments.data_vencimento, 'DDMMYYYY') || '-' || 
         LPAD((
           SELECT COUNT(*)::text 
           FROM ap_installments ai2 
           WHERE ai2.fornecedor = ap_installments.fornecedor 
             AND ai2.descricao = ap_installments.descricao 
             AND ai2.data_vencimento <= ap_installments.data_vencimento
             AND ai2.eh_recorrente = true
         ), 3, '0')
)
WHERE eh_recorrente = true AND numero_documento IS NULL;