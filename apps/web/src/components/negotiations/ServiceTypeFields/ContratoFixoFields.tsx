'use client'

import { useEffect } from 'react'
import { calcularVencimento12Meses } from '@/utils/negotiationCalculations'

interface ContratoFixoFieldsProps {
  formData: {
    valorMensalFixo: string;
    dataInicio: string;
    dataFimContrato: string;
    valorProposta: string;
  };
  onChange: (field: string, value: string) => void;
  formatCurrency: (value: string) => string;
}

export default function ContratoFixoFields({ formData, onChange, formatCurrency }: ContratoFixoFieldsProps) {
  // Sincronizar valor mensal fixo com valor da proposta
  useEffect(() => {
    if (formData.valorMensalFixo && formData.valorProposta !== formData.valorMensalFixo) {
      onChange('valorProposta', formData.valorMensalFixo)
    }
  }, [formData.valorMensalFixo])

  // Calcular data fim do contrato automaticamente quando data de início mudar
  useEffect(() => {
    if (formData.dataInicio && !formData.dataFimContrato) {
      const dataFim = calcularVencimento12Meses(formData.dataInicio)
      onChange('dataFimContrato', dataFim)
    }
  }, [formData.dataInicio])

  return (
    <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Contrato Fixo</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="valorMensalFixo" className="block text-sm font-medium text-gray-700 mb-2">
            Valor Mensal Fixo (Valor da Proposta)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="text"
              id="valorMensalFixo"
              value={formData.valorMensalFixo}
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value)
                onChange('valorMensalFixo', formatted)
                onChange('valorProposta', formatted)
              }}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início
          </label>
          <input
            type="date"
            id="dataInicio"
            value={formData.dataInicio}
            onChange={(e) => {
              onChange('dataInicio', e.target.value)
              // Calcular data fim automaticamente
              if (e.target.value) {
                const dataFim = calcularVencimento12Meses(e.target.value)
                onChange('dataFimContrato', dataFim)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="dataFimContrato" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Fim do Contrato (12 meses após início)
          </label>
          <input
            type="date"
            id="dataFimContrato"
            value={formData.dataFimContrato}
            onChange={(e) => onChange('dataFimContrato', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">Ajustável manualmente se necessário</p>
        </div>
      </div>
    </div>
  );
}

