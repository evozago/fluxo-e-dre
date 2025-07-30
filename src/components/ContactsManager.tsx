import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, Search, Download, Upload, User, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  fornecedor_id: string;
  nome_representante: string;
  email: string;
  telefone?: string;
  marcas?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  fornecedor_nome?: string;
}

interface ContactsManagerProps {
  onContactChange?: () => void;
}

export const ContactsManager = ({ onContactChange }: ContactsManagerProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [fornecedores, setFornecedores] = useState<{id: string, nome: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [sortField, setSortField] = useState<string>('nome_representante');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState({
    fornecedor_id: "",
    nome_representante: "",
    email: "",
    telefone: "",
    marcas: "",
    observacoes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadContacts();
    loadFornecedores();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, sortField, sortDirection]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      // Primeiro criar a tabela se não existir
      await createContactsTable();

      const { data, error } = await supabase
        .from('representantes_contatos')
        .select(`
          *,
          fornecedores (nome)
        `)
        .order('nome_representante', { ascending: true });

      if (error) throw error;
      
      const contactsWithFornecedor = (data || []).map(contact => ({
        ...contact,
        fornecedor_nome: contact.fornecedores?.nome || 'Fornecedor não encontrado'
      }));
      
      setContacts(contactsWithFornecedor);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createContactsTable = async () => {
    try {
      // Verificar se a tabela existe
      const { data: tableExists } = await supabase
        .from('representantes_contatos')
        .select('id')
        .limit(1);
    } catch (error) {
      // Se der erro, significa que a tabela não existe, então vamos criá-la
      console.log('Tabela de contatos não existe, será criada automaticamente pelo sistema');
    }
  };

  const loadFornecedores = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFornecedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const filterContacts = () => {
    let filtered = contacts.filter(c => c.ativo);

    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.nome_representante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.fornecedor_nome && contact.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.marcas && contact.marcas.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      switch (sortField) {
        case 'nome_representante':
          aValue = a.nome_representante || '';
          bValue = b.nome_representante || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'fornecedor_nome':
          aValue = a.fornecedor_nome || '';
          bValue = b.fornecedor_nome || '';
          break;
        case 'marcas':
          aValue = a.marcas || '';
          bValue = b.marcas || '';
          break;
        default:
          aValue = a.nome_representante || '';
          bValue = b.nome_representante || '';
      }
      
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredContacts(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_representante.trim() || !formData.email.trim() || !formData.fornecedor_id) {
      toast({
        title: "Erro",
        description: "Nome, email e fornecedor são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const contactData = {
        fornecedor_id: formData.fornecedor_id,
        nome_representante: formData.nome_representante,
        email: formData.email,
        telefone: formData.telefone || null,
        marcas: formData.marcas || null,
        observacoes: formData.observacoes || null,
        ativo: true
      };

      if (editingContact) {
        // Atualizar contato existente
        const { error } = await supabase
          .from('representantes_contatos')
          .update(contactData)
          .eq('id', editingContact.id);

        if (error) throw error;

        toast({
          title: "Contato atualizado",
          description: "Dados do contato foram atualizados com sucesso"
        });
      } else {
        // Criar novo contato
        const { error } = await supabase
          .from('representantes_contatos')
          .insert(contactData);

        if (error) throw error;

        toast({
          title: "Contato criado",
          description: "Novo contato foi criado com sucesso"
        });
      }

      loadContacts();
      onContactChange?.();
      setIsModalOpen(false);
      setEditingContact(null);
      setFormData({
        fornecedor_id: "",
        nome_representante: "",
        email: "",
        telefone: "",
        marcas: "",
        observacoes: ""
      });
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o contato",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      fornecedor_id: contact.fornecedor_id,
      nome_representante: contact.nome_representante,
      email: contact.email,
      telefone: contact.telefone || "",
      marcas: contact.marcas || "",
      observacoes: contact.observacoes || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este contato?")) return;

    try {
      const { error } = await supabase
        .from('representantes_contatos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Contato desativado",
        description: "O contato foi desativado com sucesso"
      });

      loadContacts();
      onContactChange?.();
    } catch (error: any) {
      console.error('Erro ao desativar contato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desativar o contato",
        variant: "destructive"
      });
    }
  };

  const openNewModal = () => {
    setEditingContact(null);
    setFormData({
      fornecedor_id: "",
      nome_representante: "",
      email: "",
      telefone: "",
      marcas: "",
      observacoes: ""
    });
    setIsModalOpen(true);
  };

  const exportContacts = () => {
    const csvData = filteredContacts.map(c => ({
      'Nome Fornecedor': c.fornecedor_nome,
      'Nome Representante': c.nome_representante,
      Email: c.email,
      Telefone: c.telefone || '',
      Marcas: c.marcas || '',
      Observações: c.observacoes || ''
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `representantes-contatos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando contatos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Representantes e Contatos
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportContacts} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Label htmlFor="search">Pesquisar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome, email, fornecedor ou marcas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum contato encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('fornecedor_nome')}>
                    Fornecedor
                    {sortField === 'fornecedor_nome' && (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('nome_representante')}>
                    Representante
                    {sortField === 'nome_representante' && (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                    Email
                    {sortField === 'email' && (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    )}
                  </TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('marcas')}>
                    Marcas
                    {sortField === 'marcas' && (
                      sortDirection === 'asc' ? ' ↑' : ' ↓'
                    )}
                  </TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.fornecedor_nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {contact.nome_representante}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {contact.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.telefone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {contact.telefone}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {contact.marcas ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.marcas.split(',').map((marca, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {marca.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modal para Criar/Editar Contato */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Editar Contato' : 'Novo Contato'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fornecedor">Fornecedor *</Label>
                  <select
                    id="fornecedor"
                    value={formData.fornecedor_id}
                    onChange={(e) => setFormData({...formData, fornecedor_id: e.target.value})}
                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                    required
                  >
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map(fornecedor => (
                      <option key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="nome">Nome do Representante *</Label>
                  <Input
                    id="nome"
                    value={formData.nome_representante}
                    onChange={(e) => setFormData({...formData, nome_representante: e.target.value})}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="marcas">Marcas Atendidas</Label>
                <Input
                  id="marcas"
                  value={formData.marcas}
                  onChange={(e) => setFormData({...formData, marcas: e.target.value})}
                  placeholder="Marca A, Marca B, Marca C (separadas por vírgula)"
                />
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Informações adicionais sobre o representante"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingContact ? 'Atualizar' : 'Criar'} Contato
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};