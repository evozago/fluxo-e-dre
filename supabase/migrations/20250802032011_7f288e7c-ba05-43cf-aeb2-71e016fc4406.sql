-- Limpar dados duplicados e aplicar constraints
-- Primeiro, vamos manter apenas o registro mais recente de cada CPF duplicado

-- Para funcionários
WITH funcionarios_ordenados AS (
  SELECT id, cpf, ROW_NUMBER() OVER (PARTITION BY cpf ORDER BY created_at DESC) as rn
  FROM funcionarios 
  WHERE cpf IS NOT NULL
)
DELETE FROM funcionarios 
WHERE id IN (
  SELECT id FROM funcionarios_ordenados WHERE rn > 1
);

-- Para fornecedores
WITH fornecedores_ordenados AS (
  SELECT id, cnpj_cpf, ROW_NUMBER() OVER (PARTITION BY cnpj_cpf ORDER BY created_at DESC) as rn
  FROM fornecedores 
  WHERE cnpj_cpf IS NOT NULL
)
DELETE FROM fornecedores 
WHERE id IN (
  SELECT id FROM fornecedores_ordenados WHERE rn > 1
);

-- Agora aplicar as constraints de unicidade
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_cpf_unique') THEN
        ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_cpf_unique UNIQUE (cpf);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_cnpj_cpf_unique') THEN
        ALTER TABLE fornecedores ADD CONSTRAINT fornecedores_cnpj_cpf_unique UNIQUE (cnpj_cpf);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entidades_cnpj_cpf_unique') THEN
        ALTER TABLE entidades ADD CONSTRAINT entidades_cnpj_cpf_unique UNIQUE (cnpj_cpf);
    END IF;
END $$;