import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Check, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BankTransaction {
  data: string;
  descricao: string;
  valor: number;
  tipo: 'debito' | 'credito';
}

interface PaymentMatch {
  bankTransaction: BankTransaction;
  installment: any;
  similarity: number;
}

interface BankStatementImportProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BankStatementImport = ({ isOpen, onOpenChange, onSuccess }: BankStatementImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [matches, setMatches] = useState<PaymentMatch[]>([]);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'matching'>('upload');
  const { toast } = useToast();

  const parseCSVFile = (content: string): BankTransaction[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const transactions: BankTransaction[] = [];
    
    // Assumindo formato: Data, Descrição, Valor, Tipo
    for (let i = 1; i < lines.length; i++) { // Skip header
      const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
      if (columns.length >= 4) {
        const valor = parseFloat(columns[2].replace(/[^\d.-]/g, ''));
        if (!isNaN(valor) && valor < 0) { // Apenas débitos (pagamentos)
          transactions.push({
            data: columns[0],
            descricao: columns[1],
            valor: Math.abs(valor),
            tipo: 'debito'
          });
        }
      }
    }
    
    return transactions;
  };

  const calculateSimilarity = (transaction: BankTransaction, installment: any): number => {
    let score = 0;
    
    // Similaridade de valor (peso 60%)
    const valueDiff = Math.abs(transaction.valor - installment.valor);
    const valueScore = Math.max(0, 1 - (valueDiff / installment.valor));
    score += valueScore * 0.6;
    
    // Similaridade de nome do fornecedor (peso 40%)
    const transactionDesc = transaction.descricao.toLowerCase();
    const supplierName = installment.fornecedor.toLowerCase();
    
    const words = supplierName.split(' ');
    let matchedWords = 0;
    
    words.forEach(word => {
      if (word.length > 3 && transactionDesc.includes(word)) {
        matchedWords++;
      }
    });
    
    const nameScore = words.length > 0 ? matchedWords / words.length : 0;
    score += nameScore * 0.4;
    
    return score;
  };

  const findMatches = async (transactions: BankTransaction[]) => {
    try {
      // Buscar contas a pagar em aberto
      const { data: installments, error } = await supabase
        .from('ap_installments')
        .select('*')
        .in('status', ['aberto', 'vencido']);

      if (error) throw error;

      const potentialMatches: PaymentMatch[] = [];

      transactions.forEach(transaction => {
        installments?.forEach(installment => {
          const similarity = calculateSimilarity(transaction, installment);
          if (similarity > 0.3) { // Threshold mínimo de 30%
            potentialMatches.push({
              bankTransaction: transaction,
              installment,
              similarity
            });
          }
        });
      });

      // Ordenar por similaridade
      potentialMatches.sort((a, b) => b.similarity - a.similarity);
      
      setMatches(potentialMatches);
      setStep('matching');
    } catch (error: any) {
      console.error('Erro ao buscar correspondências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar as correspondências",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const content = await file.text();
      const transactions = parseCSVFile(content);
      
      if (transactions.length === 0) {
        toast({
          title: "Arquivo inválido",
          description: "Nenhuma transação de débito encontrada no arquivo",
          variant: "destructive"
        });
        return;
      }

      setBankTransactions(transactions);
      await findMatches(transactions);
      
      toast({
        title: "Arquivo processado",
        description: `${transactions.length} transações encontradas`
      });
    } catch (error) {
      toast({
        title: "Erro ao processar arquivo",
        description: "Verifique o formato do arquivo CSV",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmMatch = async (match: PaymentMatch) => {
    try {
      const { error } = await supabase
        .from('ap_installments')
        .update({
          data_pagamento: match.bankTransaction.data,
          status: 'pago',
          observacoes: `Pagamento associado automaticamente via extrato bancário - ${match.bankTransaction.descricao}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', match.installment.id);

      if (error) throw error;

      // Remover o match da lista
      setMatches(matches.filter(m => m !== match));
      
      toast({
        title: "Pagamento confirmado",
        description: `Pagamento de ${match.installment.fornecedor} foi registrado`
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o pagamento",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setBankTransactions([]);
    setMatches([]);
    setStep('upload');
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return "bg-green-500";
    if (similarity > 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Extrato Bancário</DialogTitle>
        </DialogHeader>
        
        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank-file">Arquivo CSV do Extrato</Label>
              <Input
                id="bank-file"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Formato esperado: Data, Descrição, Valor, Tipo
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleFileUpload} 
                disabled={!file || processing}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {processing ? "Processando..." : "Processar Extrato"}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {step === 'matching' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Correspondências Encontradas</h3>
              <Badge variant="secondary">{matches.length} possíveis correspondências</Badge>
            </div>

            {matches.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p>Nenhuma correspondência automática encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique se há contas a pagar em aberto que correspondam às transações do extrato
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {matches.map((match, index) => (
                  <Card key={index} className="border-l-4" style={{borderLeftColor: getSimilarityColor(match.similarity) === "bg-green-500" ? "#22c55e" : getSimilarityColor(match.similarity) === "bg-yellow-500" ? "#eab308" : "#ef4444"}}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-semibold">Extrato Bancário:</p>
                              <p>{match.bankTransaction.descricao}</p>
                              <p>Valor: R$ {match.bankTransaction.valor.toFixed(2)}</p>
                              <p>Data: {match.bankTransaction.data}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Conta a Pagar:</p>
                              <p>{match.installment.fornecedor}</p>
                              <p>Valor: R$ {match.installment.valor.toFixed(2)}</p>
                              <p>Vencimento: {new Date(match.installment.data_vencimento).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">Similaridade:</span>
                            <div className={`w-20 h-2 rounded ${getSimilarityColor(match.similarity)}`} style={{width: `${match.similarity * 100}%`}} />
                            <span className="text-xs">{(match.similarity * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            onClick={() => confirmMatch(match)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setMatches(matches.filter(m => m !== match))}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => {
                onSuccess();
                handleClose();
              }} className="flex-1">
                Finalizar
              </Button>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};