-- Tabela de marcas (vinculadas aos fornecedores)
CREATE TABLE public.marcas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de categorias de produtos
CREATE TABLE public.categorias_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL, -- vestido, conjunto, salopete, etc.
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tipos de manga
CREATE TABLE public.tipos_manga (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL, -- manga curta, manga longa, sem manga, etc.
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de detalhes/estampas
CREATE TABLE public.detalhes_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL, -- ursos, flores, tule, estrazo, etc.
  tipo TEXT NOT NULL, -- estampa, detalhe, etc.
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela principal de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo_completo TEXT NOT NULL, -- título gerado automaticamente
  categoria_id UUID REFERENCES public.categorias_produtos(id),
  tipo_manga_id UUID REFERENCES public.tipos_manga(id),
  detalhes TEXT[], -- array de detalhes/estampas
  genero TEXT NOT NULL CHECK (genero IN ('menina', 'menino', 'unissex')),
  marca_id UUID REFERENCES public.marcas(id),
  referencia TEXT, -- referência do produto
  codigo_barras TEXT,
  custo_medio NUMERIC DEFAULT 0,
  preco_venda_base NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pre_cadastro' CHECK (status IN ('pre_cadastro', 'ativo', 'inativo')),
  origem TEXT NOT NULL DEFAULT 'xml' CHECK (origem IN ('xml', 'xlsx', 'manual')),
  nfe_id UUID REFERENCES public.nfe_data(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de variações de produtos (cores e tamanhos)
CREATE TABLE public.produto_variacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  cor TEXT NOT NULL,
  tamanho TEXT NOT NULL,
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  preco_venda NUMERIC NOT NULL DEFAULT 0,
  quantidade_estoque INTEGER NOT NULL DEFAULT 0,
  codigo_barras_variacao TEXT,
  sku TEXT, -- código único da variação
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(produto_id, cor, tamanho)
);

-- Tabela de pedidos importados via XLSX
CREATE TABLE public.pedidos_produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  marca_id UUID REFERENCES public.marcas(id),
  referencia TEXT NOT NULL,
  codigo_barras TEXT,
  descricao TEXT,
  cor TEXT,
  tamanho TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  custo_unitario NUMERIC NOT NULL DEFAULT 0,
  data_pedido DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'vinculado', 'cancelado')),
  produto_id UUID REFERENCES public.produtos(id),
  observacoes TEXT,
  arquivo_origem TEXT, -- nome do arquivo XLSX importado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_produtos_marca ON public.produtos(marca_id);
CREATE INDEX idx_produtos_referencia ON public.produtos(referencia);
CREATE INDEX idx_produtos_codigo_barras ON public.produtos(codigo_barras);
CREATE INDEX idx_produto_variacoes_produto ON public.produto_variacoes(produto_id);
CREATE INDEX idx_produto_variacoes_sku ON public.produto_variacoes(sku);
CREATE INDEX idx_pedidos_referencia ON public.pedidos_produtos(referencia);
CREATE INDEX idx_pedidos_codigo_barras ON public.pedidos_produtos(codigo_barras);
CREATE INDEX idx_marcas_fornecedor ON public.marcas(fornecedor_id);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_manga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalhes_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_produtos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (permitir tudo por enquanto)
CREATE POLICY "Allow all operations on marcas" ON public.marcas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on categorias_produtos" ON public.categorias_produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tipos_manga" ON public.tipos_manga FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on detalhes_produtos" ON public.detalhes_produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on produto_variacoes" ON public.produto_variacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pedidos_produtos" ON public.pedidos_produtos FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_marcas_updated_at
  BEFORE UPDATE ON public.marcas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_produtos_updated_at
  BEFORE UPDATE ON public.categorias_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_manga_updated_at
  BEFORE UPDATE ON public.tipos_manga
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_detalhes_produtos_updated_at
  BEFORE UPDATE ON public.detalhes_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_produto_variacoes_updated_at
  BEFORE UPDATE ON public.produto_variacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_produtos_updated_at
  BEFORE UPDATE ON public.pedidos_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais básicos
INSERT INTO public.categorias_produtos (nome) VALUES 
('Vestido'), ('Conjunto'), ('Salopete'), ('Blusa'), ('Calça'), ('Shorts'), ('Saia');

INSERT INTO public.tipos_manga (nome) VALUES 
('Manga Curta'), ('Manga Longa'), ('Sem Manga'), ('Manga 3/4'), ('Manga Bufante');

INSERT INTO public.detalhes_produtos (nome, tipo) VALUES 
('Ursos', 'estampa'), ('Flores', 'estampa'), ('Tule', 'detalhe'), 
('Estrazo', 'detalhe'), ('Babado', 'detalhe'), ('Laço', 'detalhe'),
('Listras', 'estampa'), ('Poás', 'estampa'), ('Liso', 'estampa');