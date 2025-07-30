import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadNFeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UploadNFeModal = ({ open, onOpenChange, onSuccess }: UploadNFeModalProps) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um arquivo XML",
        variant: "destructive"
      });
      return;
    }

    // Validar se são arquivos XML
    const xmlFiles = Array.from(files).filter(file => file.name.endsWith('.xml'));
    if (xmlFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Apenas arquivos XML são aceitos",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      let processedCount = 0;
      let errorCount = 0;

      for (const file of xmlFiles) {
        try {
          const xmlContent = await file.text();
          
          const { data, error } = await supabase.functions.invoke('process-nfe-xml', {
            body: { xmlContent }
          });

          if (error) {
            console.error('Error processing file:', file.name, error);
            errorCount++;
          } else {
            console.log('File processed successfully:', file.name, data);
            processedCount++;
          }
        } catch (error) {
          console.error('Error reading file:', file.name, error);
          errorCount++;
        }
      }

      if (processedCount > 0) {
        toast({
          title: "Upload realizado",
          description: `${processedCount} arquivo(s) XML processado(s) com sucesso${errorCount > 0 ? `. ${errorCount} arquivo(s) com erro.` : ''}`
        });
        
        setFiles(null);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: "Erro no processamento",
          description: "Nenhum arquivo foi processado com sucesso",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar os arquivos XML",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de NFe XML</DialogTitle>
          <DialogDescription>
            Selecione os arquivos XML das notas fiscais para processar
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".xml"
              multiple
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Selecione um ou mais arquivos XML
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleUpload} 
              className="flex-1" 
              disabled={isProcessing}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isProcessing ? "Processando..." : "Processar XML"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};