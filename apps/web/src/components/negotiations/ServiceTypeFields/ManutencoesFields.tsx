'use client'

import { calcularVencimento12Meses } from '@/utils/negotiationCalculations'

interface ManutencoesFieldsProps {
  formData: {
    descricaoManutencao: string;
    valorMensalManutencao: string;
    dataInicioManutencao: string;
    vencimentoManutencao: string;
    valorProposta: string;
  };
  onChange: (field: string, value: string) => void;
  formatCurrency: (value: string) => string;
}

export default function ManutencoesFields({ formData, onChange, formatCurrency }: ManutencoesFieldsProps) {

  return (
    <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Manutenção</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="descricaoManutencao" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição da Manutenção
          </label>
          <textarea
            id="descricaoManutencao"
            value={formData.descricaoManutencao}
            onChange={(e) => onChange('descricaoManutencao', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Descreva os serviços de manutenção que serão realizados..."
          />
        </div>
        <div>
          <label htmlFor="valorMensalManutencao" className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mensal (Valor da Proposta)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="text"
              id="valorMensalManutencao"
              value={formData.valorMensalManutencao || ''}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value)
                onChange('valorMensalManutencao', formatted)
                // Sincronizar com valorProposta
                if (formatted) {
                  onChange('valorProposta', formatted)
                }
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <label htmlFor="dataInicioManutencao" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início da Assinatura
          </label>
          <input
            type="date"
            id="dataInicioManutencao"
            value={formData.dataInicioManutencao || ''}
            onChange={(e) => {
              const dataInicio = e.target.value
              // Atualizar a data de início e calcular vencimento
              if (dataInicio) {
                const vencimento = calcularVencimento12Meses(dataInicio)
                // Atualizar ambos os campos
                onChange('dataInicioManutencao', dataInicio)
                onChange('vencimentoManutencao', vencimento)
              } else {
                onChange('dataInicioManutencao', '')
                onChange('vencimentoManutencao', '')
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="vencimentoManutencao" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Renovação
          </label>
          <input
            type="date"
            id="vencimentoManutencao"
            value={formData.vencimentoManutencao}
            onChange={(e) => onChange('vencimentoManutencao', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">Ajustável manualmente se necessário</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Faturamento
          </label>
          <input
            type="text"
            value="Mensal"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}

