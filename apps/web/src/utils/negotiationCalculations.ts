/**
 * Utilitários para cálculos relacionados a negociações
 */

/**
 * Calcula a data de vencimento (12 meses a partir da data de início)
 * @param dataInicio Data de início (string no formato YYYY-MM-DD ou Date)
 * @returns Data de vencimento (12 meses depois) no formato YYYY-MM-DD
 */
export function calcularVencimento12Meses(dataInicio: string | Date | null | undefined): string {
  // Validar entrada
  if (!dataInicio) {
    // Se não houver data de início, usar data atual
    const hoje = new Date();
    const vencimento = new Date(hoje);
    vencimento.setMonth(vencimento.getMonth() + 12);
    return vencimento.toISOString().split('T')[0];
  }

  // Converter para Date se for string
  let inicio: Date;
  if (typeof dataInicio === 'string') {
    // Tratar string no formato YYYY-MM-DD (sem timezone)
    const partes = dataInicio.split('T')[0].split('-');
    if (partes.length === 3) {
      const ano = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1; // Mês é 0-indexed
      const dia = parseInt(partes[2], 10);
      inicio = new Date(ano, mes, dia);
    } else {
      inicio = new Date(dataInicio);
    }
  } else {
    inicio = dataInicio;
  }

  // Validar se a data é válida
  if (isNaN(inicio.getTime())) {
    console.warn('Data de início inválida:', dataInicio, '- usando data atual');
    const hoje = new Date();
    const vencimento = new Date(hoje);
    vencimento.setMonth(vencimento.getMonth() + 12);
    return vencimento.toISOString().split('T')[0];
  }

  // Calcular vencimento (12 meses depois)
  const vencimento = new Date(inicio);
  vencimento.setMonth(vencimento.getMonth() + 12);

  // Validar se a data resultante é válida
  if (isNaN(vencimento.getTime())) {
    console.warn('Data de vencimento inválida após cálculo - usando data atual + 12 meses');
    const hoje = new Date();
    const vencimentoFallback = new Date(hoje);
    vencimentoFallback.setMonth(vencimentoFallback.getMonth() + 12);
    return vencimentoFallback.toISOString().split('T')[0];
  }

  // Formatar como YYYY-MM-DD (sem timezone)
  const ano = vencimento.getFullYear();
  const mes = String(vencimento.getMonth() + 1).padStart(2, '0');
  const dia = String(vencimento.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Calcula o valor sugerido para manutenção (10% do valor da proposta)
 * @param valorProposta Valor da proposta
 * @returns Valor mensal sugerido
 */
export function calcularValorSugeridoManutencao(valorProposta: number): number {
  return valorProposta * 0.1;
}

/**
 * Formata valor para exibição em moeda brasileira
 * @param valor Valor numérico ou string
 * @returns String formatada (ex: "1.500,00")
 */
export function formatCurrency(value: string | number): string {
  if (!value) return '';
  
  // Remove tudo que não é número
  const numericValue = String(value).replace(/\D/g, '');
  
  if (!numericValue) return '';
  
  // Converte para número e divide por 100 para ter centavos
  const numberValue = parseFloat(numericValue) / 100;
  
  // Formata como moeda brasileira
  return numberValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte string formatada de moeda para número
 * @param valorString String formatada (ex: "1.500,00")
 * @returns Número ou null
 */
export function getValorAsNumber(valorString: string | number): number | null {
  if (!valorString) return null;
  
  if (typeof valorString === 'number') {
    return valorString;
  }
  
  // Remove pontos e substitui vírgula por ponto
  const cleaned = valorString.replace(/\./g, '').replace(',', '.');
  const number = parseFloat(cleaned);
  
  return isNaN(number) ? null : number;
}

