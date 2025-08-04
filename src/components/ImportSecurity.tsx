import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ImportValidationResult {
  isValid: boolean;
  duplicates: any[];
  errors: string[];
  processedData: any[];
}

export class ImportSecurity {
  static async validateImportData(file: File, type: 'nfe' | 'fornecedores' | 'entidades' | 'parcelas'): Promise<ImportValidationResult> {
    const result: ImportValidationResult = {
      isValid: false,
      duplicates: [],
      errors: [],
      processedData: []
    };

    try {
      // Verificar integridade do arquivo
      if (file.size === 0) {
        result.errors.push("Arquivo está vazio");
        return result;
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        result.errors.push("Arquivo muito grande. Máximo 50MB");
        return result;
      }

      // Verificar extensão do arquivo
      const allowedExtensions = ['.csv', '.xlsx', '.xls', '.xml'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedExtensions.includes(fileExtension)) {
        result.errors.push(`Extensão ${fileExtension} não permitida. Use: ${allowedExtensions.join(', ')}`);
        return result;
      }

      let data: any[] = [];

      if (type === 'nfe' && fileExtension === '.xml') {
        data = await this.parseXMLFile(file);
      } else if (['.csv', '.xlsx', '.xls'].includes(fileExtension)) {
        data = await this.parseSpreadsheetFile(file);
      }

      // Validar estrutura dos dados
      const validationResult = await this.validateDataStructure(data, type);
      if (!validationResult.isValid) {
        result.errors.push(...validationResult.errors);
        return result;
      }

      // Verificar duplicatas
      const duplicates = await this.checkDuplicates(data, type);
      result.duplicates = duplicates;

      result.processedData = data;
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error) {
      console.error('Erro na validação:', error);
      result.errors.push(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return result;
    }
  }

  private static async parseXMLFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const xmlContent = e.target?.result as string;
          
          // Verificar se é um XML válido de NFe
          if (!xmlContent.includes('<infNFe') && !xmlContent.includes('<nfeProc')) {
            reject(new Error('Arquivo XML não é uma NFe válida'));
            return;
          }

          // Verificar se já foi importado (por chave de acesso)
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
          
          // Extrair chave de acesso
          const chaveAcesso = xmlDoc.querySelector('infNFe')?.getAttribute('Id')?.replace('NFe', '') ||
                            xmlDoc.querySelector('[chNFe]')?.textContent;

          if (!chaveAcesso) {
            reject(new Error('Chave de acesso não encontrada no XML'));
            return;
          }

          resolve([{ chave_acesso: chaveAcesso, xml_content: xmlContent }]);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  private static async parseSpreadsheetFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('Arquivo deve ter pelo menos uma linha de cabeçalho e uma linha de dados'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
          const data = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
            
            if (values.length !== headers.length) {
              reject(new Error(`Linha ${i + 1}: Número de colunas não confere com o cabeçalho`));
              return;
            }

            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            
            data.push(row);
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }

  private static async validateDataStructure(data: any[], type: string): Promise<{isValid: boolean, errors: string[]}> {
    const errors: string[] = [];

    const requiredFields = {
      'nfe': ['chave_acesso'],
      'fornecedores': ['nome'],
      'entidades': ['nome', 'tipo'],
      'parcelas': ['fornecedor', 'descricao', 'valor', 'data_vencimento']
    };

    const required = requiredFields[type as keyof typeof requiredFields] || [];

    // Verificar se todos os campos obrigatórios estão presentes
    data.forEach((row, index) => {
      required.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          errors.push(`Linha ${index + 2}: Campo '${field}' é obrigatório`);
        }
      });

      // Validações específicas por tipo
      if (type === 'parcelas') {
        // Validar valor numérico
        const valor = parseFloat(row.valor?.toString().replace(',', '.'));
        if (isNaN(valor) || valor <= 0) {
          errors.push(`Linha ${index + 2}: Valor deve ser um número positivo`);
        }

        // Validar data
        const dataVencimento = new Date(row.data_vencimento);
        if (isNaN(dataVencimento.getTime())) {
          errors.push(`Linha ${index + 2}: Data de vencimento inválida. Use formato YYYY-MM-DD`);
        }
      }

      if (type === 'entidades') {
        if (!['PJ', 'PF'].includes(row.tipo)) {
          errors.push(`Linha ${index + 2}: Tipo deve ser 'PJ' ou 'PF'`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static async checkDuplicates(data: any[], type: string): Promise<any[]> {
    const duplicates: any[] = [];

    for (const row of data) {
      let query;
      
      switch (type) {
        case 'nfe':
          query = supabase
            .from('nfe_data')
            .select('chave_acesso')
            .eq('chave_acesso', row.chave_acesso);
          break;
          
        case 'fornecedores':
          query = supabase
            .from('fornecedores')
            .select('nome, cnpj_cpf')
            .eq('nome', row.nome);
          
          if (row.cnpj_cpf) {
            query = query.eq('cnpj_cpf', row.cnpj_cpf);
          }
          break;
          
        case 'entidades':
          query = supabase
            .from('entidades')
            .select('nome, cnpj_cpf')
            .eq('nome', row.nome);
          
          if (row.cnpj_cpf) {
            query = query.eq('cnpj_cpf', row.cnpj_cpf);
          }
          break;
          
        case 'parcelas':
          query = supabase
            .from('ap_installments')
            .select('fornecedor, descricao, valor, data_vencimento')
            .eq('fornecedor', row.fornecedor)
            .eq('descricao', row.descricao)
            .eq('data_vencimento', row.data_vencimento);
          break;
          
        default:
          continue;
      }

      try {
        const { data: existing } = await query;
        if (existing && existing.length > 0) {
          duplicates.push({
            row,
            existing: existing[0],
            field: this.getDuplicateIdentifier(row, type)
          });
        }
      } catch (error) {
        console.error('Erro ao verificar duplicatas:', error);
      }
    }

    return duplicates;
  }

  private static getDuplicateIdentifier(row: any, type: string): string {
    switch (type) {
      case 'nfe':
        return `Chave: ${row.chave_acesso}`;
      case 'fornecedores':
      case 'entidades':
        return `Nome: ${row.nome}${row.cnpj_cpf ? ` | CNPJ/CPF: ${row.cnpj_cpf}` : ''}`;
      case 'parcelas':
        return `${row.fornecedor} - ${row.descricao} - ${row.data_vencimento}`;
      default:
        return 'Item duplicado';
    }
  }

  static generateImportNumber(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `IMP-${timestamp}-${random}`;
  }

  static createBackup(data: any[], type: string): void {
    const backup = {
      type,
      data,
      timestamp: new Date().toISOString(),
      importNumber: this.generateImportNumber()
    };

    localStorage.setItem(`backup_${backup.importNumber}`, JSON.stringify(backup));
    
    // Manter apenas os últimos 10 backups
    const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
    if (backupKeys.length > 10) {
      const oldestKey = backupKeys.sort()[0];
      localStorage.removeItem(oldestKey);
    }
  }
}