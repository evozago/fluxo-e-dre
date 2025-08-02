import { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, Save, Undo2, Redo2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialNodes: Node[] = [
  // Nó Principal - Sistema de Gestão
  {
    id: 'sistema-principal',
    type: 'default',
    data: { label: '🏢 Sistema de Gestão Empresarial' },
    position: { x: 500, y: 50 },
    style: { 
      background: '#E3F2FD',
      border: '2px solid #1976D2',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: 'bold',
      width: 300,
      height: 80,
    },
  },

  // Módulos Principais - Nível 1
  {
    id: 'financeiro',
    type: 'default',
    data: { label: '💰 Módulo Financeiro' },
    position: { x: 150, y: 200 },
    style: { 
      background: '#E8F5E8',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      width: 200,
      height: 60,
    },
  },
  {
    id: 'vendas',
    type: 'default',
    data: { label: '🛍️ Módulo de Vendas' },
    position: { x: 450, y: 200 },
    style: { 
      background: '#FFF3E0',
      border: '2px solid #FF9800',
      borderRadius: '8px',
      width: 200,
      height: 60,
    },
  },
  {
    id: 'recursos-humanos',
    type: 'default',
    data: { label: '👥 Recursos Humanos' },
    position: { x: 750, y: 200 },
    style: { 
      background: '#F3E5F5',
      border: '2px solid #9C27B0',
      borderRadius: '8px',
      width: 200,
      height: 60,
    },
  },
  {
    id: 'relatorios',
    type: 'default',
    data: { label: '📊 Relatórios & Analytics' },
    position: { x: 1050, y: 200 },
    style: { 
      background: '#E1F5FE',
      border: '2px solid #00BCD4',
      borderRadius: '8px',
      width: 200,
      height: 60,
    },
  },

  // Submódulos Financeiro - Nível 2
  {
    id: 'contas-pagar',
    type: 'default',
    data: { label: '📋 Contas a Pagar' },
    position: { x: 50, y: 350 },
    style: { 
      background: '#FFEBEE',
      border: '1px solid #F44336',
      borderRadius: '6px',
      width: 150,
      height: 50,
    },
  },
  {
    id: 'fornecedores',
    type: 'default',
    data: { label: '🏭 Fornecedores' },
    position: { x: 250, y: 350 },
    style: { 
      background: '#FFEBEE',
      border: '1px solid #F44336',
      borderRadius: '6px',
      width: 150,
      height: 50,
    },
  },

  // Submódulos Vendas - Nível 2
  {
    id: 'vendas-dashboard',
    type: 'default',
    data: { label: '📈 Dashboard Vendas' },
    position: { x: 350, y: 350 },
    style: { 
      background: '#FFF8E1',
      border: '1px solid #FFC107',
      borderRadius: '6px',
      width: 150,
      height: 50,
    },
  },
  {
    id: 'metas-vendas',
    type: 'default',
    data: { label: '🎯 Metas & Comissões' },
    position: { x: 550, y: 350 },
    style: { 
      background: '#FFF8E1',
      border: '1px solid #FFC107',
      borderRadius: '6px',
      width: 150,
      height: 50,
    },
  },

  // Submódulos RH - Nível 2
  {
    id: 'funcionarios',
    type: 'default',
    data: { label: '👨‍💼 Funcionários' },
    position: { x: 650, y: 350 },
    style: { 
      background: '#F8E6FF',
      border: '1px solid #E91E63',
      borderRadius: '6px',
      width: 150,
      height: 50,
    },
  },
  {
    id: 'vendedoras',
    type: 'default',
    data: { label: '🛍️ Vendedoras' },
    position: { x: 850, y: 350 },
    style: { 
      background: '#F8E6FF',
      border: '1px solid #E91E63',
      borderRadius: '6px',
      width: 150,
      height: 50,
    },
  },

  // Funcionalidades Específicas - Nível 3
  {
    id: 'cadastro-contas',
    type: 'default',
    data: { label: '✏️ Cadastrar Conta' },
    position: { x: 30, y: 480 },
    style: { 
      background: '#FAFAFA',
      border: '1px solid #9E9E9E',
      borderRadius: '4px',
      width: 120,
      fontSize: '12px',
      height: 40,
    },
  },
  {
    id: 'contas-recorrentes',
    type: 'default',
    data: { label: '🔄 Contas Recorrentes' },
    position: { x: 170, y: 480 },
    style: { 
      background: '#FAFAFA',
      border: '1px solid #9E9E9E',
      borderRadius: '4px',
      width: 120,
      fontSize: '12px',
      height: 40,
    },
  },
  {
    id: 'historico-fornecedor',
    type: 'default',
    data: { label: '📜 Histórico Fornecedor' },
    position: { x: 310, y: 480 },
    style: { 
      background: '#FAFAFA',
      border: '1px solid #9E9E9E',
      borderRadius: '4px',
      width: 120,
      fontSize: '12px',
      height: 40,
    },
  },
  {
    id: 'auto-conta-funcionario',
    type: 'default',
    data: { label: '⚡ Auto Conta Func.' },
    position: { x: 650, y: 480 },
    style: { 
      background: '#FAFAFA',
      border: '1px solid #9E9E9E',
      borderRadius: '4px',
      width: 120,
      fontSize: '12px',
      height: 40,
    },
  },
  {
    id: 'vale-transporte',
    type: 'default',
    data: { label: '🚌 Vale Transporte' },
    position: { x: 790, y: 480 },
    style: { 
      background: '#FAFAFA',
      border: '1px solid #9E9E9E',
      borderRadius: '4px',
      width: 120,
      fontSize: '12px',
      height: 40,
    },
  },
  {
    id: 'metas-mes-ano',
    type: 'default',
    data: { label: '📅 Metas Mês/Ano' },
    position: { x: 530, y: 480 },
    style: { 
      background: '#FAFAFA',
      border: '1px solid #9E9E9E',
      borderRadius: '4px',
      width: 120,
      fontSize: '12px',
      height: 40,
    },
  },

  // Sistema de Desfazer
  {
    id: 'sistema-undo',
    type: 'default',
    data: { label: '↶ Sistema Undo' },
    position: { x: 50, y: 600 },
    style: { 
      background: '#FFE0E6',
      border: '2px solid #D32F2F',
      borderRadius: '8px',
      width: 180,
      height: 50,
    },
  },

  // Integrações
  {
    id: 'supabase',
    type: 'default',
    data: { label: '🗄️ Supabase DB' },
    position: { x: 900, y: 600 },
    style: { 
      background: '#E8F5E8',
      border: '2px solid #2E7D32',
      borderRadius: '8px',
      width: 150,
      height: 50,
    },
  },
];

const initialEdges: Edge[] = [
  // Conexões principais
  { id: 'e1', source: 'sistema-principal', target: 'financeiro', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e2', source: 'sistema-principal', target: 'vendas', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e3', source: 'sistema-principal', target: 'recursos-humanos', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e4', source: 'sistema-principal', target: 'relatorios', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // Submódulos Financeiro
  { id: 'e5', source: 'financeiro', target: 'contas-pagar', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e6', source: 'financeiro', target: 'fornecedores', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // Submódulos Vendas
  { id: 'e7', source: 'vendas', target: 'vendas-dashboard', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e8', source: 'vendas', target: 'metas-vendas', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // Submódulos RH
  { id: 'e9', source: 'recursos-humanos', target: 'funcionarios', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e10', source: 'recursos-humanos', target: 'vendedoras', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // Funcionalidades específicas
  { id: 'e11', source: 'contas-pagar', target: 'cadastro-contas', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e12', source: 'contas-pagar', target: 'contas-recorrentes', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e13', source: 'fornecedores', target: 'historico-fornecedor', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e14', source: 'funcionarios', target: 'auto-conta-funcionario', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e15', source: 'funcionarios', target: 'vale-transporte', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e16', source: 'metas-vendas', target: 'metas-mes-ano', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },

  // Conexões especiais
  { id: 'e17', source: 'funcionarios', target: 'contas-pagar', type: 'smoothstep', animated: true, style: { stroke: '#FF5722' }, label: 'Auto Geração' },
  { id: 'e18', source: 'cadastro-contas', target: 'sistema-undo', type: 'smoothstep', style: { stroke: '#9C27B0', strokeDasharray: '5,5' } },
  { id: 'e19', source: 'sistema-principal', target: 'supabase', type: 'smoothstep', style: { stroke: '#4CAF50' }, label: 'Database' },
];

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export const SystemOrganogramEditable = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: initialNodes, edges: initialEdges }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  const saveState = () => {
    const newState = { nodes, edges };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setHasUnsavedChanges(false);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
      setHasUnsavedChanges(false);
      toast({
        title: "Ação desfeita",
        description: "O organograma foi revertido para o estado anterior"
      });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setNodes(state.nodes);
      setEdges(state.edges);
      setHistoryIndex(newIndex);
      setHasUnsavedChanges(false);
      toast({
        title: "Ação refeita",
        description: "O organograma foi avançado para o próximo estado"
      });
    }
  };

  const resetToDefault = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHistory([{ nodes: initialNodes, edges: initialEdges }]);
    setHistoryIndex(0);
    setHasUnsavedChanges(false);
    toast({
      title: "Organograma resetado",
      description: "O organograma foi restaurado para o estado original"
    });
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setHasUnsavedChanges(true);
    },
    [setEdges],
  );

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    setHasUnsavedChanges(true);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    setHasUnsavedChanges(true);
  }, [onEdgesChange]);

  const saveWorkflow = () => {
    saveState();
    // Aqui você pode adicionar lógica para salvar no backend se necessário
    toast({
      title: "Fluxo salvo",
      description: "O organograma foi salvo com sucesso"
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Organograma Editável do Sistema
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Mapa visual editável da estrutura e fluxo de trabalho do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Desfazer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="h-4 w-4 mr-1" />
              Refazer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={saveWorkflow}
              className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              <Save className="h-4 w-4 mr-1" />
              {hasUnsavedChanges ? "Salvar*" : "Salvar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ width: '100%', height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            fitView
            style={{ backgroundColor: "#F8F9FA" }}
          >
            <MiniMap 
              zoomable 
              pannable 
              style={{ 
                backgroundColor: "#ffffff",
                border: "1px solid #e0e0e0"
              }} 
            />
            <Controls />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold mb-2">Engenharia de Fluxo:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-600 rounded"></div>
                  <span>Módulo Principal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-600 rounded"></div>
                  <span>Financeiro</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 border border-orange-600 rounded"></div>
                  <span>Vendas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-100 border border-purple-600 rounded"></div>
                  <span>Recursos Humanos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-cyan-100 border border-cyan-600 rounded"></div>
                  <span>Relatórios</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-600 rounded"></div>
                  <span>Funcionalidades</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-600 rounded"></div>
                  <span>Sistema Undo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border border-green-800 rounded"></div>
                  <span>Banco de Dados</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Estados salvos: {history.length} | Atual: {historyIndex + 1}
              </p>
              {hasUnsavedChanges && (
                <p className="text-sm text-orange-600 font-medium">
                  * Alterações não salvas
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};