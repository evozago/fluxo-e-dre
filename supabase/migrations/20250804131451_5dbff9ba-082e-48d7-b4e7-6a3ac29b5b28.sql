-- Corrigir valor_total_titulo para despesas recorrentes que estão com valor null
UPDATE ap_installments 
SET valor_total_titulo = valor
WHERE eh_recorrente = true 
AND valor_total_titulo IS NULL;