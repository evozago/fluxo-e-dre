import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ConfigurationSettingsProps {
  onConfigChange?: () => void;
}

export const ConfigurationSettings = ({ onConfigChange }: ConfigurationSettingsProps) => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<string[]>([]);
  const [bancos, setBancos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState<{type: string, index: number, value: string} | null>(null);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_configurations')
        .select('config_type, config_data')
        .in('config_type', ['categorias', 'formas_pagamento', 'bancos']);

      if (error) throw error;

      // Organizar dados por tipo
      const configs = data?.reduce((acc, item) => {
        const configData = item.config_data;
        if (Array.isArray(configData) && configData.every(item => typeof item === 'string')) {
          acc[item.config_type] = configData as string[];
        } else {
          acc[item.config_type] = [];
        }
        return acc;
      }, {} as Record<string, string[]>) || {};

      setCategorias(configs.categorias || []);
      setFormasPagamento(configs.formas_pagamento || []);
      setBancos(configs.bancos || []);
      
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (type: 'categorias' | 'formas_pagamento' | 'bancos', data: string[]) => {
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          config_type: type,
          config_data: data
        }, {
          onConflict: 'config_type'
        });

      if (error) throw error;
      
      onConfigChange?.();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      throw error;
    }
  };

  const addItem = async (type: 'categorias' | 'formas_pagamento' | 'bancos') => {
    if (!newItem.trim()) {
      toast({
        title: "Erro",
        description: "Digite um valor para adicionar",
        variant: "destructive"
      });
      return;
    }

    const currentList = type === 'categorias' ? categorias : 
                       type === 'formas_pagamento' ? formasPagamento : bancos;
    
    if (currentList.includes(newItem.trim())) {
      toast({
        title: "Erro",
        description: "Este item já existe na lista",
        variant: "destructive"
      });
      return;
    }

    try {
      const newList = [...currentList, newItem.trim()];
      
      await saveConfiguration(type, newList);
      
      if (type === 'categorias') setCategorias(newList);
      else if (type === 'formas_pagamento') setFormasPagamento(newList);
      else setBancos(newList);

      setNewItem("");
      setActiveDialog(null);
      
      toast({
        title: "Item Adicionado",
        description: `${newItem.trim()} foi adicionado com sucesso`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item",
        variant: "destructive"
      });
    }
  };

  const editItem = async (type: 'categorias' | 'formas_pagamento' | 'bancos', index: number) => {
    if (!editingItem?.value.trim()) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive"
      });
      return;
    }

    try {
      const currentList = type === 'categorias' ? categorias : 
                         type === 'formas_pagamento' ? formasPagamento : bancos;
      
      const newList = [...currentList];
      newList[index] = editingItem.value.trim();
      
      await saveConfiguration(type, newList);
      
      if (type === 'categorias') setCategorias(newList);
      else if (type === 'formas_pagamento') setFormasPagamento(newList);
      else setBancos(newList);

      setEditingItem(null);
      
      toast({
        title: "Item Atualizado",
        description: "Item foi atualizado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive"
      });
    }
  };

  const removeItem = async (type: 'categorias' | 'formas_pagamento' | 'bancos', index: number) => {
    try {
      const currentList = type === 'categorias' ? categorias : 
                         type === 'formas_pagamento' ? formasPagamento : bancos;
      
      const newList = currentList.filter((_, i) => i !== index);
      
      await saveConfiguration(type, newList);
      
      if (type === 'categorias') setCategorias(newList);
      else if (type === 'formas_pagamento') setFormasPagamento(newList);
      else setBancos(newList);

      toast({
        title: "Item Removido",
        description: "Item foi removido com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        variant: "destructive"
      });
    }
  };

  const renderItemList = (
    items: string[], 
    type: 'categorias' | 'formas_pagamento' | 'bancos',
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

  if (loading) {
    return <div>Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {renderItemList(categorias, 'categorias', 'Categorias')}
        {renderItemList(formasPagamento, 'formas_pagamento', 'Formas de Pagamento')}
        {renderItemList(bancos, 'bancos', 'Bancos')}
      </div>
    </div>
  );
};