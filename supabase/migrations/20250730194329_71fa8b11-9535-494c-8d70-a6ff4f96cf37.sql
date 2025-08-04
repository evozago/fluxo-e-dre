-- Adicionar coluna comprovante_path à tabela ap_installments
ALTER TABLE public.ap_installments 
ADD COLUMN comprovante_path TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.ap_installments.comprovante_path IS 'Caminho do arquivo de comprovante de pagamento no storage';

-- Criar bucket para comprovantes no storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false);

-- Criar políticas para o bucket de comprovantes
CREATE POLICY "Users can view receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'receipts');

CREATE POLICY "Users can upload receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Users can update receipts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete receipts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'receipts');