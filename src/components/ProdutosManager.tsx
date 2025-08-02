import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Upload, FileSpreadsheet, Plus, Edit, Eye, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PedidosImportModal } from "./PedidosImportModal";

interface Produto {
  id: string;
  titulo_completo: string;
  referencia: string;
  codigo_barras: string;
  custo_medio: number;
  preco_venda_base: number;
  status: string;
  origem: string;
  created_at: string;
  marcas?: { nome: string };
  categorias_produtos?: { nome: string };
  tipos_manga?: { nome: string };
  genero: string;
}

interface Marca {
  id: string;
  nome: string;
}

interface Categoria {
  id: string;
  nome: string;
}

interface TipoManga {
  id: string;
  nome: string;
}

interface Detalhe {
  id: string;
  nome: string;
  tipo: string;
}

export const ProdutosManager = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tiposManga, setTiposManga] = useState<TipoManga[]>([]);
  const [detalhes, setDetalhes] = useState<Detalhe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pedidosImportOpen, setPedidosImportOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("produtos");
  
  const [newProduto, setNewProduto] = useState({
    categoria_id: "",
    tipo_manga_id: "",
    detalhes_selecionados: [] as string[],
    genero: "",
    marca_id: "",
    referencia: "",
    codigo_barras: "",
    custo_medio: 0,
    preco_venda_base: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProdutos(),
        loadMarcas(),
        loadCategorias(),
        loadTiposManga(),
        loadDetalhes()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          marcas (nome),
          categorias_produtos (nome),
          tipos_manga (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadMarcas = async () => {
    try {
      const { data, error } = await supabase
        .from('marcas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setMarcas(data || []);
    } catch (error) {
      console.error('Erro ao carregar marcas:', error);
    }
  };

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadTiposManga = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manga')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setTiposManga(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de manga:', error);
    }
  };

  const loadDetalhes = async () => {
    try {
      const { data, error } = await supabase
        .from('detalhes_produtos')
        .select('id, nome, tipo')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setDetalhes(data || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const gerarTituloCompleto = () => {
    const categoria = categorias.find(c => c.id === newProduto.categoria_id)?.nome || "";
    const tipoManga = tiposManga.find(t => t.id === newProduto.tipo_manga_id)?.nome || "";
    const detalhesNomes = newProduto.detalhes_selecionados
      .map(id => detalhes.find(d => d.id === id)?.nome)
      .filter(Boolean)
      .join(", ");
    const marca = marcas.find(m => m.id === newProduto.marca_id)?.nome || "";

    const partes = [categoria, tipoManga, detalhesNomes, newProduto.genero, marca].filter(Boolean);
    return partes.join(", ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProduto.categoria_id || !newProduto.marca_id || !newProduto.genero) {
      toast({
        title: "Erro",
        description: "Categoria, marca e gênero são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const titulo_completo = gerarTituloCompleto();
      
      const { error } = await supabase
        .from('produtos')
        .insert([{
          titulo_completo,
          categoria_id: newProduto.categoria_id,
          tipo_manga_id: newProduto.tipo_manga_id || null,
          detalhes: newProduto.detalhes_selecionados,
          genero: newProduto.genero,
          marca_id: newProduto.marca_id,
          referencia: newProduto.referencia || null,
          codigo_barras: newProduto.codigo_barras || null,
          custo_medio: newProduto.custo_medio,
          preco_venda_base: newProduto.preco_venda_base,
          origem: 'manual'
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso"
      });

      setNewProduto({
        categoria_id: "",
        tipo_manga_id: "",
        detalhes_selecionados: [],
        genero: "",
        marca_id: "",
        referencia: "",
        codigo_barras: "",
        custo_medio: 0,
        preco_venda_base: 0
      });
      setDialogOpen(false);
      loadProdutos();
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o produto",
        variant: "destructive"
      });
    }
  };

  const handleImportXLSX = () => {
    setPedidosImportOpen(true);
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      'pre_cadastro': 'secondary',
      'ativo': 'default',
      'inativo': 'destructive'
    } as const;
    
    const labels = {
      'pre_cadastro': 'Pré-cadastro',
      'ativo': 'Ativo',
      'inativo': 'Inativo'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center p-4">Carregando produtos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gerenciar Produtos
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportXLSX}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Importar Pedidos XLSX
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Produto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select
                        value={newProduto.categoria_id}
                        onValueChange={(value) => setNewProduto({ ...newProduto, categoria_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria.id} value={categoria.id}>
                              {categoria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="tipo_manga">Tipo de Manga</Label>
                      <Select
                        value={newProduto.tipo_manga_id}
                        onValueChange={(value) => setNewProduto({ ...newProduto, tipo_manga_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de manga" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposManga.map((tipo) => (
                            <SelectItem key={tipo.id} value={tipo.id}>
                              {tipo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="genero">Gênero</Label>
                      <Select
                        value={newProduto.genero}
                        onValueChange={(value) => setNewProduto({ ...newProduto, genero: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="menina">Menina</SelectItem>
                          <SelectItem value="menino">Menino</SelectItem>
                          <SelectItem value="unissex">Unissex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="marca">Marca</Label>
                      <Select
                        value={newProduto.marca_id}
                        onValueChange={(value) => setNewProduto({ ...newProduto, marca_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                        <SelectContent>
                          {marcas.map((marca) => (
                            <SelectItem key={marca.id} value={marca.id}>
                              {marca.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Detalhes/Estampas</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {detalhes.map((detalhe) => (
                        <label key={detalhe.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newProduto.detalhes_selecionados.includes(detalhe.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewProduto({
                                  ...newProduto,
                                  detalhes_selecionados: [...newProduto.detalhes_selecionados, detalhe.id]
                                });
                              } else {
                                setNewProduto({
                                  ...newProduto,
                                  detalhes_selecionados: newProduto.detalhes_selecionados.filter(id => id !== detalhe.id)
                                });
                              }
                            }}
                          />
                          <span className="text-sm">{detalhe.nome}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="referencia">Referência</Label>
                      <Input
                        id="referencia"
                        value={newProduto.referencia}
                        onChange={(e) => setNewProduto({ ...newProduto, referencia: e.target.value })}
                        placeholder="REF001"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="codigo_barras">Código de Barras</Label>
                      <Input
                        id="codigo_barras"
                        value={newProduto.codigo_barras}
                        onChange={(e) => setNewProduto({ ...newProduto, codigo_barras: e.target.value })}
                        placeholder="1234567890123"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="custo_medio">Custo Médio</Label>
                      <Input
                        id="custo_medio"
                        type="number"
                        step="0.01"
                        value={newProduto.custo_medio}
                        onChange={(e) => setNewProduto({ ...newProduto, custo_medio: parseFloat(e.target.value) || 0 })}
                        placeholder="55.00"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="preco_venda_base">Preço de Venda Base</Label>
                      <Input
                        id="preco_venda_base"
                        type="number"
                        step="0.01"
                        value={newProduto.preco_venda_base}
                        onChange={(e) => setNewProduto({ ...newProduto, preco_venda_base: parseFloat(e.target.value) || 0 })}
                        placeholder="99.90"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Prévia do Título:</Label>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <span className="font-medium">{gerarTituloCompleto() || "Configure os campos acima para visualizar o título"}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Criar Produto
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList>
            <TabsTrigger value="produtos">Produtos Cadastrados</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos Importados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="produtos">
            <ProdutosTabContent 
              produtos={produtos}
              formatCurrency={formatCurrency}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
          
          <TabsContent value="pedidos">
            <PedidosTabContent />
          </TabsContent>
        </Tabs>
        
        <PedidosImportModal
          isOpen={pedidosImportOpen}
          onOpenChange={setPedidosImportOpen}
          onSuccess={() => {
            loadProdutos();
            // Recarregar pedidos se necessário
          }}
        />
      </CardContent>
    </Card>
  );
};

// Componente separado para a tab de produtos
const ProdutosTabContent = ({ produtos, formatCurrency, getStatusBadge }: any) => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título Completo</TableHead>
          <TableHead>Marca</TableHead>
          <TableHead>Referência</TableHead>
          <TableHead>Custo Médio</TableHead>
          <TableHead>Preço Base</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Origem</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {produtos.map((produto: any) => (
          <TableRow key={produto.id}>
            <TableCell className="font-medium max-w-xs">
              <div className="truncate" title={produto.titulo_completo}>
                {produto.titulo_completo}
              </div>
            </TableCell>
            <TableCell>{produto.marcas?.nome || "N/A"}</TableCell>
            <TableCell>{produto.referencia || "-"}</TableCell>
            <TableCell>{formatCurrency(produto.custo_medio)}</TableCell>
            <TableCell>{formatCurrency(produto.preco_venda_base)}</TableCell>
            <TableCell>{getStatusBadge(produto.status)}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {produto.origem === 'xml' ? 'XML' : produto.origem === 'xlsx' ? 'XLSX' : 'Manual'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    
    {produtos.length === 0 && (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum produto cadastrado</p>
      </div>
    )}
  </div>
);

// Componente separado para a tab de pedidos
const PedidosTabContent = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos_produtos')
        .select(`
          *,
          marcas (nome),
          fornecedores (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      'pendente': 'secondary',
      'vinculado': 'default',
      'cancelado': 'destructive'
    } as const;
    
    const labels = {
      'pendente': 'Pendente',
      'vinculado': 'Vinculado',
      'cancelado': 'Cancelado'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center p-4">Carregando pedidos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Pedidos Importados</h3>
        <Badge variant="outline">
          {pedidos.length} pedidos
        </Badge>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Cor/Tamanho</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Custo Unit.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidos.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell>{pedido.fornecedores?.nome || "N/A"}</TableCell>
                <TableCell>{pedido.marcas?.nome || "N/A"}</TableCell>
                <TableCell className="font-medium">{pedido.referencia}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={pedido.descricao}>
                    {pedido.descricao}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{pedido.cor}</div>
                    <div className="text-muted-foreground">Tam: {pedido.tamanho}</div>
                  </div>
                </TableCell>
                <TableCell>{pedido.quantidade}</TableCell>
                <TableCell>{formatCurrency(pedido.custo_unitario)}</TableCell>
                <TableCell>{getStatusBadge(pedido.status)}</TableCell>
                <TableCell>
                  <div className="text-xs text-muted-foreground truncate max-w-20" title={pedido.arquivo_origem}>
                    {pedido.arquivo_origem || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" title="Vincular ao produto">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {pedidos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum pedido importado</p>
          </div>
        )}
      </div>
    </div>
  );
};