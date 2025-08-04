import React from "react";
import { Network, Database, Users, FileText, CreditCard, Settings, ShoppingCart, Building, MapPin, Archive, Briefcase } from "lucide-react";

interface SystemStructureProps {
  // Props if needed
}

export const SystemStructure = ({}: SystemStructureProps) => {
  return (
    <div className="p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Estrutura Completa do Sistema</h1>
        <p className="text-muted-foreground">Organograma completo de todas as funcionalidades</p>
      </div>

      {/* Nível Principal */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Database className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">SISTEMA PRINCIPAL</h2>
        </div>
        
        {/* Módulos Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          
          {/* Módulo Financeiro */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-700">MÓDULO FINANCEIRO</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Contas a Pagar</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Despesas Recorrentes</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Parcelas</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Comprovantes</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Histórico de Pagamentos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Sistema de Desfazer</span>
              </div>
            </div>
          </div>

          {/* Módulo RH */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-700">MÓDULO RH</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Funcionários</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Dados Pessoais</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Salários</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Vale Transporte</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Integração c/ Contas a Pagar</span>
              </div>
            </div>
          </div>

          {/* Módulo Vendas */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-700">MÓDULO VENDAS</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Vendedoras</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Metas Mensais</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Meta por Vendedora</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Total Vendido</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Comparativo Ano/Ano</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Comissões</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Vendas</span>
              </div>
            </div>
          </div>

          {/* Módulo Cadastros */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Archive className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-700">MÓDULO CADASTROS</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Fornecedores</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Dados Cadastrais</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Histórico de Contas</span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Cadastro Rápido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Marcas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Produtos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Entidades</span>
              </div>
            </div>
          </div>

          {/* Módulo Relatórios */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-700">MÓDULO RELATÓRIOS</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Dashboard Overview</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Relatórios Financeiros</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Análise de Vendas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Exportação de Dados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>Importação NFe/XML</span>
              </div>
            </div>
          </div>

          {/* Módulo Configurações */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-6 w-6 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-700">MÓDULO CONFIG</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Configurações Gerais</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Templates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Segurança</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Backup/Restore</span>
              </div>
            </div>
          </div>
        </div>

        {/* Integrações */}
        <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-3">
            <Network className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-700">INTEGRAÇÕES SISTÊMICAS</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>Fornecedores ↔ Contas a Pagar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>Funcionários ↔ Contas Recorrentes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>Vendas ↔ Metas/Comissões</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>NFe ↔ Produtos/Fornecedores</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>Sistema Desfazer Global</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <span>Histórico Unificado</span>
            </div>
          </div>
        </div>

        {/* Banco de Dados */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-6 w-6 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-700">ESTRUTURA DE DADOS</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>fornecedores</div>
            <div>funcionarios</div>
            <div>ap_installments</div>
            <div>vendedoras</div>
            <div>metas_mensais</div>
            <div>vendas</div>
            <div>produtos</div>
            <div>marcas</div>
            <div>entidades</div>
            <div>nfe_data</div>
            <div>categorias_produtos</div>
            <div>config_vendas</div>
          </div>
        </div>
      </div>
    </div>
  );
};