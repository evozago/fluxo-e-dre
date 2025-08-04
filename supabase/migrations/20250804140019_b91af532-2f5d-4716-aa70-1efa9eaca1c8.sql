-- Atualizar despesas recorrentes que têm numero_documento NULL para usar padrão brasileiro de data
UPDATE ap_installments 
SET numero_documento = 'REC-' || TO_CHAR(data_vencimento, 'DDMMYYYY') || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY fornecedor, descricao ORDER BY data_vencimento)::text, 3, '0')
WHERE eh_recorrente = true AND numero_documento IS NULL;