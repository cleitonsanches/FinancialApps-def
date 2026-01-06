'use client'

import React from 'react'
import { useEffect } from 'react'
import { calcularVencimento12Meses } from '@/utils/negotiationCalculations'

interface ContratoFixoFieldsProps {
  formData: {
    valorMensalFixo: string;
    dataInicio: string;
    dataFimContrato: string;
    valorProposta: string;
    quantidadeParcelas?: string;
    parcelas?: Array<{ numero: number; valor: string; dataFaturamento: string; dataVencimento: string }>;
  };
  onChange: (field: string, value: string) => void;
  formatCurrency: (value: string | number) => string;
  handleQuantidadeParcelasChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleParcelaDataFaturamentoChange?: (index: number, value: string) => void;
  handleParcelaDataVencimentoChange?: (index: number, value: string) => void;
  handleParcelaValorChange?: (index: number, value: string) => void;
  getValorAsNumber?: (value: string | number) => number | null;
}

export default function ContratoFixoFields({ 
  formData, 
  onChange, 
  formatCurrency,
  handleQuantidadeParcelasChange,
  handleParcelaDataFaturamentoChange,
  handleParcelaDataVencimentoChange,
  handleParcelaValorChange,
  getValorAsNumber
}: ContratoFixoFieldsProps) {
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

      {/* Quantidade de Parcelas */}
      <div className="mt-6">
        <label htmlFor="quantidadeParcelasContratoFixo" className="block text-sm font-medium text-gray-700 mb-2">
          Quantas parcelas deseja provisionar? *
        </label>
        <input
          type="number"
          id="quantidadeParcelasContratoFixo"
          min="1"
          value={formData.quantidadeParcelas || ''}
          onChange={handleQuantidadeParcelasChange || (() => {})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          placeholder="Digite a quantidade de parcelas"
          required
        />
      </div>

      {/* Lista de Parcelas */}
      {formData.parcelas && formData.parcelas.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Parcelas</h4>
          <div className="space-y-3">
            {formData.parcelas.map((parcela, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Parcela {parcela.numero}/{formData.parcelas!.length}
                  </label>
                  <div className="text-sm font-semibold text-gray-700">
                    {parcela.numero}/{formData.parcelas!.length}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Data de Faturamento
                  </label>
                  <input
                    type="date"
                    value={parcela.dataFaturamento}
                    onChange={(e) => handleParcelaDataFaturamentoChange?.(index, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    value={parcela.dataVencimento}
                    onChange={(e) => handleParcelaDataVencimentoChange?.(index, e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Valor da Parcela
                  </label>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-xs text-gray-500">R$</span>
                    <input
                      type="text"
                      value={parcela.valor}
                      onChange={(e) => handleParcelaValorChange?.(index, e.target.value)}
                      className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            {getValorAsNumber && (
              <div className="pt-2 border-t border-gray-300">
                <div className="text-sm font-semibold text-gray-700">
                  Total das Parcelas: {formData.parcelas.reduce((sum, p) => sum + (getValorAsNumber(p.valor) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}






