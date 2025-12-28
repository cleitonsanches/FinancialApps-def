'use client'

interface AnaliseDadosFieldsProps {
  formData: {
    dataInicioAnalise: string;
    dataProgramadaHomologacao: string;
    dataProgramadaProducao: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function AnaliseDadosFields({ formData, onChange }: AnaliseDadosFieldsProps) {
  return (
    <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Análise de Dados</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dataInicioAnalise" className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início
          </label>
          <input
            type="date"
            id="dataInicioAnalise"
            value={formData.dataInicioAnalise}
            onChange={(e) => onChange('dataInicioAnalise', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="dataProgramadaHomologacao" className="block text-sm font-medium text-gray-700 mb-2">
            Data Programada para Homologação
          </label>
          <input
            type="date"
            id="dataProgramadaHomologacao"
            value={formData.dataProgramadaHomologacao}
            onChange={(e) => onChange('dataProgramadaHomologacao', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="dataProgramadaProducao" className="block text-sm font-medium text-gray-700 mb-2">
            Data Programada para Produção
          </label>
          <input
            type="date"
            id="dataProgramadaProducao"
            value={formData.dataProgramadaProducao}
            onChange={(e) => onChange('dataProgramadaProducao', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
    </div>
  );
}


