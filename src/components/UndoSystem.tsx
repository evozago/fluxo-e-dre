import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Undo2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UndoAction {
  id: string;
  type: 'DELETE' | 'UPDATE' | 'INSERT';
  table: string;
  data: any;
  originalData?: any;
  timestamp: Date;
  description: string;
}

interface UndoSystemProps {
  onDataChange: () => void;
}

export const UndoSystem = ({ onDataChange }: UndoSystemProps) => {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<UndoAction | null>(null);
  const { toast } = useToast();
  const maxUndoActions = 10; // Manter apenas as últimas 10 ações

  const addUndoAction = (action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const newAction: UndoAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setUndoStack(prev => {
      const updated = [newAction, ...prev].slice(0, maxUndoActions);
      return updated;
    });
  };

  const handleUndo = async (action: UndoAction) => {
    try {
      switch (action.type) {
        case 'DELETE':
          // Restaurar item deletado
          if (action.table === 'ap_installments') {
            const { error: restoreError } = await supabase
              .from('ap_installments')
              .insert(action.data);
            if (restoreError) throw restoreError;
          } else if (action.table === 'fornecedores') {
            const { error: restoreError } = await supabase
              .from('fornecedores')
              .insert(action.data);
            if (restoreError) throw restoreError;
          }
          break;

        case 'UPDATE':
          // Reverter para dados originais
          if (!action.originalData) throw new Error('Dados originais não disponíveis');
          
          if (action.table === 'ap_installments') {
            const { error: revertError } = await supabase
              .from('ap_installments')
              .update(action.originalData)
              .eq('id', action.data.id);
            if (revertError) throw revertError;
          } else if (action.table === 'fornecedores') {
            const { error: revertError } = await supabase
              .from('fornecedores')
              .update(action.originalData)
              .eq('id', action.data.id);
            if (revertError) throw revertError;
          }
          break;

        case 'INSERT':
          // Remover item inserido
          if (action.table === 'ap_installments') {
            const { error: deleteError } = await supabase
              .from('ap_installments')
              .delete()
              .eq('id', action.data.id);
            if (deleteError) throw deleteError;
          } else if (action.table === 'fornecedores') {
            const { error: deleteError } = await supabase
              .from('fornecedores')
              .delete()
              .eq('id', action.data.id);
            if (deleteError) throw deleteError;
          }
          break;
      }

      // Remover ação da pilha de undo
      setUndoStack(prev => prev.filter(a => a.id !== action.id));
      
      onDataChange();
      
      toast({
        title: "Operação desfeita",
        description: `${action.description} foi desfeito com sucesso`
      });
    } catch (error) {
      console.error('Erro ao desfazer operação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desfazer a operação",
        variant: "destructive"
      });
    }
  };

  const confirmUndo = (action: UndoAction) => {
    setPendingUndo(action);
    setIsUndoDialogOpen(true);
  };

  const executeUndo = async () => {
    if (pendingUndo) {
      await handleUndo(pendingUndo);
      setIsUndoDialogOpen(false);
      setPendingUndo(null);
    }
  };

  const getActionDescription = (action: UndoAction) => {
    const time = action.timestamp.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${action.description} (${time})`;
  };

  // Hook para ser usado por outros componentes
  const useUndoSystem = () => {
    return {
      addUndoAction,
      hasUndoActions: undoStack.length > 0,
      lastAction: undoStack[0] || null
    };
  };

  return (
    <>
      {/* Botões de Undo */}
      {undoStack.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmUndo(undoStack[0])}
            className="flex items-center gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Desfazer "{undoStack[0].description}"
          </Button>
          
          {undoStack.length > 1 && (
            <select
              className="px-3 py-2 border rounded-md text-sm"
              onChange={(e) => {
                const action = undoStack.find(a => a.id === e.target.value);
                if (action) confirmUndo(action);
              }}
              value=""
            >
              <option value="">Mais opções de desfazer ({undoStack.length})</option>
              {undoStack.map((action) => (
                <option key={action.id} value={action.id}>
                  {getActionDescription(action)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Dialog de Confirmação */}
      <Dialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Desfazer
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desfazer a operação "{pendingUndo?.description}"?
              {pendingUndo?.type === 'DELETE' && (
                <div className="mt-2 p-2 bg-amber-50 rounded-md text-amber-800">
                  <strong>Atenção:</strong> O item será restaurado no sistema.
                </div>
              )}
              {pendingUndo?.type === 'UPDATE' && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md text-blue-800">
                  <strong>Info:</strong> Os dados serão revertidos para o estado anterior.
                </div>
              )}
              {pendingUndo?.type === 'INSERT' && (
                <div className="mt-2 p-2 bg-red-50 rounded-md text-red-800">
                  <strong>Cuidado:</strong> O item será removido permanentemente.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsUndoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={executeUndo}>
              <Undo2 className="h-4 w-4 mr-2" />
              Confirmar Desfazer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook personalizado para usar o sistema de undo
export const useUndoSystem = () => {
  const undoSystemRef = useRef<{
    addUndoAction: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  }>();

  const addUndoAction = (action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    if (undoSystemRef.current) {
      undoSystemRef.current.addUndoAction(action);
    }
  };

  return { addUndoAction, undoSystemRef };
};

export type { UndoAction };