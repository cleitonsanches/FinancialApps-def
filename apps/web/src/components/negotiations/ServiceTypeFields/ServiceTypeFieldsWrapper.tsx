'use client'

import AnaliseDadosFields from './AnaliseDadosFields'
import AssinaturasFields from './AssinaturasFields'
import ManutencoesFields from './ManutencoesFields'
import ContratoFixoFields from './ContratoFixoFields'
import { formatCurrency } from '@/utils/negotiationCalculations'

interface ServiceTypeFieldsWrapperProps {
  serviceType: string;
  formData: any;
  onChange: (field: string, value: string) => void;
}

export default function ServiceTypeFieldsWrapper({ 
  serviceType, 
  formData, 
  onChange 
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
          }}
          onChange={handleChange}
          formatCurrency={formatCurrency}
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

