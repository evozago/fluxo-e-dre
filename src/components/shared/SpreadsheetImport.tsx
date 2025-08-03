import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export interface ImportConfig {
  tableName: string;
  displayName: string;
  columns: {
    key: string;
    label: string;
    required?: boolean;
    type?: 'text' | 'number' | 'boolean' | 'date';
    validate?: (value: any) => string | null;
  }[];
  onImport: (data: Record<string, any>[]) => Promise<void>;
  templateData?: Record<string, any>[];
}

interface SpreadsheetImportProps {
  config: ImportConfig;
  trigger?: React.ReactNode;
}

export function SpreadsheetImport({ config, trigger }: SpreadsheetImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importData, setImportData] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<Record<number, string[]>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateData = config.templateData || [
      config.columns.reduce((acc, col) => {
        acc[col.key] = col.type === 'number' ? 0 : 
                     col.type === 'boolean' ? false :
                     col.type === 'date' ? new Date().toISOString().split('T')[0] :
                     `Exemplo ${col.label}`;
        return acc;
      }, {} as Record<string, any>)
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.displayName);
    
    // Definir larguras das colunas
    const maxWidth = config.columns.map(col => ({ wch: Math.max(col.label.length, 20) }));
    worksheet['!cols'] = maxWidth;
    
    XLSX.writeFile(workbook, `template_${config.tableName}.xlsx`);
    
    toast({
      title: "Template baixado",
      description: `Template para ${config.displayName} foi baixado com sucesso`
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setImportData(jsonData);
        validateData(jsonData);
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast({
          title: "Erro no arquivo",
          description: "Não foi possível processar o arquivo. Verifique se é um arquivo Excel válido.",
          variant: "destructive"
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: Record<string, any>[]) => {
    const newErrors: Record<number, string[]> = {};

    data.forEach((row, index) => {
      const rowErrors: string[] = [];

      config.columns.forEach(column => {
        const value = row[column.key];

        // Verificar campos obrigatórios
        if (column.required && (value === undefined || value === null || value === '')) {
          rowErrors.push(`${column.label} é obrigatório`);
        }

        // Validação de tipo
        if (value !== undefined && value !== null && value !== '') {
          switch (column.type) {
            case 'number':
              if (isNaN(Number(value))) {
                rowErrors.push(`${column.label} deve ser um número`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean' && !['true', 'false', '1', '0', 'sim', 'não'].includes(String(value).toLowerCase())) {
                rowErrors.push(`${column.label} deve ser verdadeiro/falso`);
              }
              break;
            case 'date':
              if (isNaN(Date.parse(value))) {
                rowErrors.push(`${column.label} deve ser uma data válida`);
              }
              break;
          }

          // Validação customizada
          if (column.validate) {
            const customError = column.validate(value);
            if (customError) {
              rowErrors.push(customError);
            }
          }
        }
      });

      if (rowErrors.length > 0) {
        newErrors[index] = rowErrors;
      }
    });

    setErrors(newErrors);
  };

  const handleImport = async () => {
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Dados inválidos",
        description: "Corrija os erros antes de importar",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      // Processar dados antes da importação
      const processedData = importData.map(row => {
        const processed = { ...row };
        
        config.columns.forEach(column => {
          let value = processed[column.key];
          
          if (value !== undefined && value !== null && value !== '') {
            switch (column.type) {
              case 'number':
                processed[column.key] = Number(value);
                break;
              case 'boolean':
                const boolValue = String(value).toLowerCase();
                processed[column.key] = ['true', '1', 'sim'].includes(boolValue);
                break;
              case 'date':
                processed[column.key] = new Date(value).toISOString().split('T')[0];
                break;
            }
          }
        });
        
        return processed;
      });

      // Simular progresso
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await config.onImport(processedData);
      
      toast({
        title: "Importação concluída",
        description: `${processedData.length} registros foram importados com sucesso`
      });

      setIsOpen(false);
      setImportData([]);
      setErrors({});
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os dados",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  const totalRows = importData.length;
  const errorRows = Object.keys(errors).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar Planilha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar {config.displayName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden space-y-4">
          {/* Instruções e template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como importar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Baixe o template</h4>
                  <Button onClick={downloadTemplate} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Template
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">2. Faça upload do arquivo</h4>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Campos obrigatórios: {config.columns.filter(col => col.required).map(col => col.label).join(', ')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Preview dos dados */}
          {importData.length > 0 && (
            <Card className="flex-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Preview dos Dados</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{totalRows - errorRows} válidos</span>
                    </div>
                    {errorRows > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm">{errorRows} com erro</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        {config.columns.map(column => (
                          <TableHead key={column.key}>
                            {column.label}
                            {column.required && <span className="text-red-500 ml-1">*</span>}
                          </TableHead>
                        ))}
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importData.map((row, index) => (
                        <TableRow key={index} className={errors[index] ? "bg-red-50" : "bg-green-50"}>
                          <TableCell>{index + 1}</TableCell>
                          {config.columns.map(column => (
                            <TableCell key={column.key}>
                              {String(row[column.key] || '-')}
                            </TableCell>
                          ))}
                          <TableCell>
                            {errors[index] ? (
                              <div className="space-y-1">
                                {errors[index].map((error, errorIndex) => (
                                  <div key={errorIndex} className="text-xs text-red-600">
                                    {error}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progresso da importação */}
          {importing && (
            <Card>
              <CardContent className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importando dados...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ações */}
        {importData.length > 0 && (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setImportData([])}>
              Limpar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={hasErrors || importing}
              className="min-w-24"
            >
              {importing ? 'Importando...' : `Importar ${totalRows} registros`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}