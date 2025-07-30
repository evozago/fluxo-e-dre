import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigurationSettingsProps {
  onConfigChange?: () => void;
}

export const ConfigurationSettings = ({ onConfigChange }: ConfigurationSettingsProps) => {
  const [categorias, setCategorias] = useState([
    'Contabilidade', 'Aluguel', 'Fornecedores', 'Salários', 'Impostos',
    'Energia', 'Telefone', 'Internet', 'Água', 'Manutenção',
    'Marketing', 'Combustível', 'Outras Despesas', 'Geral'
  ]);
  
  const [formasPagamento, setFormasPagamento] = useState([
    'Dinheiro', 'PIX', 'Transferência Bancária', 'Boleto Bancário',
    'Cartão de Débito', 'Cartão de Crédito', 'Cheque'
  ]);
  
  const [bancos, setBancos] = useState([
    'Banco do Brasil', 'Caixa Econômica Federal', 'Bradesco', 'Itaú',
    'Santander', 'Nubank', 'Inter', 'C6 Bank', 'BTG Pactual',
    'Sicoob', 'Sicredi', 'Banrisul', 'Safra', 'Outro'
  ]);

  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState<{type: string, index: number, value: string} | null>(null);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const { toast } = useToast();

  const addItem = (type: 'categorias' | 'formasPagamento' | 'bancos') => {
    if (!newItem.trim()) {
      toast({
        title: "Erro",
        description: "Digite um valor para adicionar",
        variant: "destructive"
      });
      return;
    }

    const currentList = type === 'categorias' ? categorias : 
                       type === 'formasPagamento' ? formasPagamento : bancos;
    
    if (currentList.includes(newItem.trim())) {
      toast({
        title: "Erro",
        description: "Este item já existe na lista",
        variant: "destructive"
      });
      return;
    }

    const newList = [...currentList, newItem.trim()];
    
    if (type === 'categorias') setCategorias(newList);
    else if (type === 'formasPagamento') setFormasPagamento(newList);
    else setBancos(newList);

    setNewItem("");
    setActiveDialog(null);
    
    toast({
      title: "Item Adicionado",
      description: `${newItem.trim()} foi adicionado com sucesso`
    });

    onConfigChange?.();
  };

  const editItem = (type: 'categorias' | 'formasPagamento' | 'bancos', index: number) => {
    if (!editingItem?.value.trim()) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive"
      });
      return;
    }

    const currentList = type === 'categorias' ? categorias : 
                       type === 'formasPagamento' ? formasPagamento : bancos;
    
    const newList = [...currentList];
    newList[index] = editingItem.value.trim();
    
    if (type === 'categorias') setCategorias(newList);
    else if (type === 'formasPagamento') setFormasPagamento(newList);
    else setBancos(newList);

    setEditingItem(null);
    
    toast({
      title: "Item Atualizado",
      description: "Item foi atualizado com sucesso"
    });

    onConfigChange?.();
  };

  const removeItem = (type: 'categorias' | 'formasPagamento' | 'bancos', index: number) => {
    const currentList = type === 'categorias' ? categorias : 
                       type === 'formasPagamento' ? formasPagamento : bancos;
    
    const newList = currentList.filter((_, i) => i !== index);
    
    if (type === 'categorias') setCategorias(newList);
    else if (type === 'formasPagamento') setFormasPagamento(newList);
    else setBancos(newList);

    toast({
      title: "Item Removido",
      description: "Item foi removido com sucesso"
    });

    onConfigChange?.();
  };

  const renderItemList = (
    items: string[], 
    type: 'categorias' | 'formasPagamento' | 'bancos',
    title: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Dialog open={activeDialog === type} onOpenChange={(open) => setActiveDialog(open ? type : null)}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar {title.slice(0, -1)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newItem">Nome</Label>
                  <Input
                    id="newItem"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={`Digite o nome da ${title.toLowerCase().slice(0, -1)}`}
                    onKeyPress={(e) => e.key === 'Enter' && addItem(type)}
                  />
                </div>
                <Button onClick={() => addItem(type)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {editingItem?.type === type && editingItem?.index === index ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingItem.value}
                    onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                    className="h-8 w-32"
                    onKeyPress={(e) => e.key === 'Enter' && editItem(type, index)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editItem(type, index)}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingItem(null)}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {item}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => setEditingItem({type, index, value: item})}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0"
                    onClick={() => removeItem(type, index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {renderItemList(categorias, 'categorias', 'Categorias')}
        {renderItemList(formasPagamento, 'formasPagamento', 'Formas de Pagamento')}
        {renderItemList(bancos, 'bancos', 'Bancos')}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cnpj">CNPJ da Empresa</Label>
              <Input 
                id="cnpj"
                type="text" 
                placeholder="00.000.000/0001-00"
                defaultValue=""
              />
            </div>
            
            <div>
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input 
                id="razaoSocial"
                type="text" 
                placeholder="Lui Bambini Ltda"
                defaultValue="Lui Bambini Ltda"
              />
            </div>
            
            <Button onClick={() => {
              toast({ 
                title: "Configurações Salvas", 
                description: "As configurações da empresa foram salvas com sucesso" 
              });
            }}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};