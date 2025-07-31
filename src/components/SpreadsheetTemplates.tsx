import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpreadsheetTemplatesProps {
  onTemplateDownload?: (type: string) => void;
}

export const SpreadsheetTemplates = ({ onTemplateDownload }: SpreadsheetTemplatesProps) => {
  const { toast } = useToast();

  const templates = {
    fornecedores: {
      name: "Modelo - Fornecedores",
      description: "Template para importação de fornecedores",
      headers: ["Nome", "CNPJ/CPF", "Email", "Telefone", "Endereço"],
      example: [
        "Empresa ABC Ltda", "12.345.678/0001-90", "contato@empresaabc.com", "(11) 99999-9999", "Rua das Flores, 123 - São Paulo/SP"
      ],
      instructions: [
        "Nome: Campo obrigatório. Nome fantasia ou razão social",
        "CNPJ/CPF: Opcional. Formato: XX.XXX.XXX/XXXX-XX ou XXX.XXX.XXX-XX",
        "Email: Opcional. Email válido para contato",
        "Telefone: Opcional. Formato: (XX) XXXXX-XXXX",
        "Endereço: Opcional. Endereço completo do fornecedor"
      ]
    },
    entidades: {
      name: "Modelo - Entidades",
      description: "Template para importação de entidades",
      headers: ["Nome", "Tipo", "CNPJ/CPF", "Razao Social"],
      example: [
        "Matriz São Paulo", "PJ", "12.345.678/0001-90", "Empresa ABC Comércio Ltda"
      ],
      instructions: [
        "Nome: Campo obrigatório. Nome de identificação da entidade",
        "Tipo: Campo obrigatório. Use 'PJ' para Pessoa Jurídica ou 'PF' para Pessoa Física",
        "CNPJ/CPF: Opcional. Documento da entidade",
        "Razao Social: Opcional. Apenas para Pessoa Jurídica"
      ]
    },
    parcelas: {
      name: "Modelo - Contas a Pagar",
      description: "Template para importação de parcelas/títulos",
      headers: ["Fornecedor", "Descrição", "Valor", "Data Vencimento", "Categoria", "Forma Pagamento", "Dados Pagamento", "Banco", "Número Documento", "Observações"],
      example: [
        "Empresa ABC", "Serviços de TI - Jan/2024", "1500.00", "2024-02-15", "Fornecedores", "PIX", "empresa@email.com", "Banco do Brasil", "001234", "Pagamento referente aos serviços prestados"
      ],
      instructions: [
        "Fornecedor: Campo obrigatório. Nome do fornecedor",
        "Descrição: Campo obrigatório. Descrição da despesa/título",
        "Valor: Campo obrigatório. Valor em formato numérico (ex: 1500.00)",
        "Data Vencimento: Campo obrigatório. Formato: YYYY-MM-DD (ex: 2024-02-15)",
        "Categoria: Opcional. Categoria da despesa (padrão: Geral)",
        "Forma Pagamento: Opcional. Como será pago (PIX, Boleto, Transferência, etc.)",
        "Dados Pagamento: Opcional. Dados específicos (chave PIX, código de barras, etc.)",
        "Banco: Opcional. Banco utilizado para pagamento",
        "Número Documento: Opcional. Número do documento/boleto",
        "Observações: Opcional. Observações adicionais"
      ]
    },
    representantes: {
      name: "Modelo - Representantes/Contatos",
      description: "Template para importação de contatos de representantes",
      headers: ["Nome Fornecedor", "Nome Representante", "Email", "Telefone", "Marcas", "Observações"],
      example: [
        "Empresa ABC", "João Silva", "joao@empresaabc.com", "(11) 99999-9999", "Marca A, Marca B", "Responsável pela região Sul"
      ],
      instructions: [
        "Nome Fornecedor: Campo obrigatório. Deve corresponder a um fornecedor já cadastrado",
        "Nome Representante: Campo obrigatório. Nome completo do representante",
        "Email: Campo obrigatório. Email válido do representante",
        "Telefone: Opcional. Telefone de contato",
        "Marcas: Opcional. Marcas que o representante atende (separadas por vírgula)",
        "Observações: Opcional. Informações adicionais sobre o representante"
      ]
    }
  };

  const downloadTemplate = (type: keyof typeof templates) => {
    const template = templates[type];
    
    // Criar CSV com cabeçalho, exemplo e instruções
    const csvContent = [
      // Cabeçalho
      template.headers.join(','),
      // Linha de exemplo
      template.example.map(value => `"${value}"`).join(','),
      // Linha em branco
      '',
      // Instruções (como comentários)
      '# INSTRUÇÕES DE PREENCHIMENTO:',
      ...template.instructions.map(instruction => `# ${instruction}`),
      '',
      '# REMOVA ESTAS LINHAS DE INSTRUÇÃO ANTES DE IMPORTAR',
      '# Mantenha apenas o cabeçalho e seus dados'
    ].join('\n');

    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${type}_template.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template Baixado",
      description: `Modelo ${template.name} foi baixado com sucesso`
    });

    onTemplateDownload?.(type);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Modelos de Planilha</h2>
        <p className="text-muted-foreground">
          Baixe os modelos para importar dados de forma segura e padronizada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(templates).map(([key, template]) => (
          <Card key={key} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                {template.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Campos da Planilha:
                </h4>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-xs">
                    {template.headers.join(' | ')}
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Exemplo:</h4>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-xs break-all">
                    {template.example.slice(0, 3).join(' | ')}
                    {template.example.length > 3 && '...'}
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Instruções Principais:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {template.instructions.slice(0, 3).map((instruction, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {instruction}
                    </li>
                  ))}
                  {template.instructions.length > 3 && (
                    <li className="text-primary font-medium">
                      + {template.instructions.length - 3} mais instruções no template
                    </li>
                  )}
                </ul>
              </div>

              <Button 
                onClick={() => downloadTemplate(key as keyof typeof templates)}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Modelo {template.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">Instruções Importantes:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Sempre remova as linhas de instrução antes de importar</li>
                <li>• Mantenha o cabeçalho exatamente como está no modelo</li>
                <li>• Use o formato de data YYYY-MM-DD (ex: 2024-12-25)</li>
                <li>• Valores numéricos devem usar ponto como separador decimal</li>
                <li>• O sistema detectará e avisará sobre duplicatas antes da importação</li>
                <li>• Arquivos corrompidos ou com erros serão rejeitados automaticamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};