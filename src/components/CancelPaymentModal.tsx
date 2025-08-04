import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/brazilian-utils";

interface CancelPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  installment: {
    fornecedor: string;
    valor: number;
    banco?: string;
    forma_pagamento?: string;
  } | null;
  contaBancaria?: {
    nome_banco: string;
    saldo_atual: number;
  } | null;
}

export const CancelPaymentModal: React.FC<CancelPaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  installment,
  contaBancaria
}) => {
  if (!installment) return null;

  const metodosQueAfetamSaldo = ['PIX', 'Transferência Bancária', 'Cartão de Débito', 'Cartão de Crédito'];
  const afetaSaldo = installment.forma_pagamento && metodosQueAfetamSaldo.includes(installment.forma_pagamento);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cancelar Pagamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              Tem certeza que deseja cancelar o pagamento de <strong>{installment.fornecedor}</strong>?
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium">{formatCurrency(installment.valor)}</span>
            </div>
            
            {installment.forma_pagamento && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forma de Pagamento:</span>
                <span className="font-medium">{installment.forma_pagamento}</span>
              </div>
            )}
            
            {installment.banco && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Banco:</span>
                <span className="font-medium">{installment.banco}</span>
              </div>
            )}
          </div>

          {afetaSaldo && contaBancaria && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Impacto no Saldo:</strong>
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Saldo Atual:</span>
                  <span className="font-medium">{formatCurrency(contaBancaria.saldo_atual)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor a Creditar:</span>
                  <span className="font-medium text-green-600">+{formatCurrency(installment.valor)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Novo Saldo:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(contaBancaria.saldo_atual + installment.valor)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Manter Pagamento
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Cancelar Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

