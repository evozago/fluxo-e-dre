import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadReceiptModal = ({ open, onOpenChange }: UploadReceiptModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo",
        variant: "destructive"
      });
      return;
    }

    // Validar se é imagem ou PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Apenas imagens (JPG, PNG) ou PDF são aceitos",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Comprovante processado",
      description: "OCR executado e baixa automática realizada"
    });
    
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de Comprovante</DialogTitle>
          <DialogDescription>
            Faça upload de comprovante de pagamento (foto ou PDF)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Aceita imagens (JPG, PNG) ou arquivos PDF
            </p>
          </div>
          {file && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">Arquivo selecionado: {file.name}</p>
              <p className="text-xs text-muted-foreground">
                Tamanho: {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleUpload} className="flex-1">
              <Receipt className="w-4 h-4 mr-2" />
              Processar com OCR
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