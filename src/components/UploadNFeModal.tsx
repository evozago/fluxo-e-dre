import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadNFeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadNFeModal = ({ open, onOpenChange }: UploadNFeModalProps) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = () => {
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

    toast({
      title: "Upload realizado",
      description: `${xmlFiles.length} arquivo(s) XML processado(s) com sucesso`
    });
    
    setFiles(null);
    onOpenChange(false);
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
            <Button onClick={handleUpload} className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Processar XML
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};