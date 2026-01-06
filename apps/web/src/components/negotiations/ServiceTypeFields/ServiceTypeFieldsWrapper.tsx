'use client'

import React from 'react'
import AnaliseDadosFields from './AnaliseDadosFields'
import AssinaturasFields from './AssinaturasFields'
import ManutencoesFields from './ManutencoesFields'
import ContratoFixoFields from './ContratoFixoFields'
import { formatCurrency } from '@/utils/negotiationCalculations'

interface ServiceTypeFieldsWrapperProps {
  serviceType: string;
  formData: any;
  onChange: (field: string, value: string) => void;
  handleQuantidadeParcelasChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleParcelaDataFaturamentoChange?: (index: number, value: string) => void;
  handleParcelaDataVencimentoChange?: (index: number, value: string) => void;
  handleParcelaValorChange?: (index: number, value: string) => void;
  getValorAsNumber?: (value: string | number) => number | null;
}

export default function ServiceTypeFieldsWrapper({ 
  serviceType, 
  formData, 
  onChange,
  handleQuantidadeParcelasChange,
  handleParcelaDataFaturamentoChange,
  handleParcelaDataVencimentoChange,
  handleParcelaValorChange,
  getValorAsNumber
}: ServiceTypeFieldsWrapperProps) {
  const handleChange = (field: string, value: string) => {
    onChange(field, value)
  }

  switch (serviceType) {
    case 'ANALISE_DADOS':
      return (
        <AnaliseDadosFields
          formData={{
            dataInicioAnalise: formData.dataInicioAnalise || '',
            dataProgramadaHomologacao: formData.dataProgramadaHomologacao || '',
            dataProgramadaProducao: formData.dataProgramadaProducao || '',
          }}
          onChange={handleChange}
        />
      )

    case 'ASSINATURAS':
      return (
        <AssinaturasFields
          formData={{
            tipoProdutoAssinado: formData.tipoProdutoAssinado || '',
            quantidadeUsuarios: formData.quantidadeUsuarios || '',
            valorUnitarioUsuario: formData.valorUnitarioUsuario || '',
            dataInicioAssinatura: formData.dataInicioAssinatura || '',
            vencimentoAssinatura: formData.vencimentoAssinatura || '',
            inicioFaturamento: formData.inicioFaturamento || '',
            vencimento: formData.vencimento || '',
            valorProposta: formData.valorProposta || '',
          }}
          onChange={handleChange}
        />
      )

    case 'MANUTENCOES':
      return (
        <ManutencoesFields
          formData={{
            descricaoManutencao: formData.descricaoManutencao || '',
            valorMensalManutencao: formData.valorMensalManutencao || '',
            dataInicioManutencao: formData.dataInicioManutencao || '',
            vencimentoManutencao: formData.vencimentoManutencao || '',
            valorProposta: formData.valorProposta || '',
          }}
          onChange={handleChange}
          formatCurrency={formatCurrency}
        />
      )

    case 'CONTRATO_FIXO':
      return (
        <ContratoFixoFields
          formData={{
            valorMensalFixo: formData.valorMensalFixo || '',
            dataInicio: formData.inicio || '',
            dataFimContrato: formData.dataFimContrato || '',
            valorProposta: formData.valorProposta || '',
            ...(formData.quantidadeParcelas && { quantidadeParcelas: formData.quantidadeParcelas }),
            ...(formData.parcelas && { parcelas: formData.parcelas }),
          }}
          onChange={handleChange}
          formatCurrency={formatCurrency}
          handleQuantidadeParcelasChange={handleQuantidadeParcelasChange}
          handleParcelaDataFaturamentoChange={handleParcelaDataFaturamentoChange}
          handleParcelaDataVencimentoChange={handleParcelaDataVencimentoChange}
          handleParcelaValorChange={handleParcelaValorChange}
          getValorAsNumber={getValorAsNumber}
        />
      )

    case 'DESENVOLVIMENTOS':
    case 'AUTOMACOES':
      // Desenvolvimentos e Automações seguem o mesmo padrão de Migração de Dados
      // A lógica já existe no arquivo principal, não precisa de componente separado por enquanto
      return null

    default:
      return null
  }
}





