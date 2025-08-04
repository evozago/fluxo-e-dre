-- Adicionar novos campos para forma de pagamento e banco
ALTER TABLE public.ap_installments 
ADD COLUMN forma_pagamento TEXT,
ADD COLUMN banco TEXT,
ADD COLUMN numero_documento TEXT;

-- Atualizar a função de trigger para incluir os novos campos no status
CREATE OR REPLACE FUNCTION public.update_installment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.data_pagamento IS NOT NULL THEN
    NEW.status = 'pago';
  ELSIF NEW.data_vencimento < CURRENT_DATE AND NEW.data_pagamento IS NULL THEN
    NEW.status = 'vencido';
  ELSE
    NEW.status = 'aberto';
  END IF;
  RETURN NEW;
END;
$function$;

-- Criar trigger para atualizar status automaticamente
DROP TRIGGER IF EXISTS trigger_update_installment_status ON public.ap_installments;
CREATE TRIGGER trigger_update_installment_status
  BEFORE INSERT OR UPDATE ON public.ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_installment_status();