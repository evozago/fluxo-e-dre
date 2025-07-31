import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PedidosImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  arquivo: string;
  processados: number;
  erros: number;
  total: number;
  detalhes_erros?: string[];
  error?: string;
}

export const PedidosImportModal = ({ isOpen, onOpenChange, onSuccess }: PedidosImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para importar",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('arquivo_origem', file.name);

      const { data, error } = await supabase.functions.invoke('process-pedidos-xlsx', {
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResult(data as ImportResult);

      if (data.success) {
        toast({
          title: "Importação concluída",
          description: `${data.processados} pedidos processados com sucesso`
        });
        onSuccess();
      } else {
        toast({
          title: "Erro na importação",
          description: data.error || "Erro desconhecido",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Erro na importação:', error);
      setProgress(0);
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setProgress(0);
    setResult(null);
    setUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Pedidos - Planilha Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instruções */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato da planilha:</strong> A planilha deve conter as colunas: 
              Fornecedor, Marca, Referência, Código de Barras, Descrição, Cor, Tamanho, 
              Quantidade, Custo Unitário, Data do Pedido
            </AlertDescription>
          </Alert>

          {/* Upload de arquivo */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Selecionar arquivo Excel</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
              </div>
            )}
          </div>

          {/* Progresso */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando arquivo...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? "Importação concluída" : "Erro na importação"}
                </span>
              </div>

              {result.success && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <div className="text-2xl font-bold text-green-600">
                      {result.processados}
                    </div>
                    <div className="text-sm text-green-700">Processados</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-md">
                    <div className="text-2xl font-bold text-red-600">
                      {result.erros}
                    </div>
                    <div className="text-sm text-red-700">Erros</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.total}
                    </div>
                    <div className="text-sm text-blue-700">Total</div>
                  </div>
                </div>
              )}

              {result.detalhes_erros && result.detalhes_erros.length > 0 && (
                <div className="space-y-2">
                  <Label>Detalhes dos erros:</Label>
                  <div className="max-h-32 overflow-y-auto p-3 bg-red-50 rounded-md">
                    {result.detalhes_erros.map((erro, index) => (
                      <div key={index} className="text-sm text-red-700">
                        • {erro}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {result?.success ? "Fechar" : "Cancelar"}
            </Button>
            {!result?.success && (
              <Button 
                onClick={handleUpload} 
                disabled={!file || uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Processando..." : "Importar Pedidos"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};