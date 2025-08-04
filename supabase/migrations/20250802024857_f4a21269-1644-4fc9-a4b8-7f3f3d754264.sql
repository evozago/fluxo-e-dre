-- Adicionar colunas para dados de pagamento PIX nos funcionários
ALTER TABLE funcionarios 
ADD COLUMN chave_pix TEXT,
ADD COLUMN tipo_chave_pix TEXT;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN funcionarios.chave_pix IS 'Chave PIX para pagamentos do funcionário';
COMMENT ON COLUMN funcionarios.tipo_chave_pix IS 'Tipo da chave PIX (CPF, Email, Telefone, Chave Aleatória)';

-- Adicionar coluna de data de cadastro nos fornecedores
ALTER TABLE fornecedores 
ADD COLUMN data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Atualizar dados existentes
UPDATE fornecedores SET data_cadastro = created_at WHERE data_cadastro IS NULL;