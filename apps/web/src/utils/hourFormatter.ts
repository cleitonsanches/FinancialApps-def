/**
 * Converte diferentes formatos de horas para horas decimais
 * Aceita: "40h", "40 horas", "1h30min", "1:30", "1.5h", "90min", etc.
 */
export function parseHoursToDecimal(input: string): number | null {
  if (!input || input.trim() === '') return null
  
  const cleaned = input.trim().toLowerCase()
  
  // Se já for um número decimal, retornar direto
  const decimalMatch = cleaned.match(/^(\d+\.?\d*)$/)
  if (decimalMatch) {
    return parseFloat(decimalMatch[1])
  }
  
  // Formato "40h" ou "40 horas"
  const hoursOnlyMatch = cleaned.match(/^(\d+\.?\d*)\s*h(?:oras?)?$/)
  if (hoursOnlyMatch) {
    return parseFloat(hoursOnlyMatch[1])
  }
  
  // Formato "1h30min" ou "1h 30min" ou "1:30"
  const hoursMinutesMatch = cleaned.match(/^(\d+)(?:h|:)\s*(\d+)\s*(?:min|m)?$/)
  if (hoursMinutesMatch) {
    const hours = parseFloat(hoursMinutesMatch[1])
    const minutes = parseFloat(hoursMinutesMatch[2])
    return hours + (minutes / 60)
  }
  
  // Formato "90min" ou "90 minutos"
  const minutesOnlyMatch = cleaned.match(/^(\d+\.?\d*)\s*(?:min|minutos?)$/)
  if (minutesOnlyMatch) {
    return parseFloat(minutesOnlyMatch[1]) / 60
  }
  
  // Tentar parseFloat direto
  const num = parseFloat(cleaned)
  if (!isNaN(num)) {
    return num
  }
  
  return null
}

/**
 * Formata horas decimais para exibição (ex: 40.5 -> "40h30min")
 */
export function formatHoursFromDecimal(hours: number | string | null | undefined): string {
  if (!hours && hours !== 0) return ''
  
  const totalHours = typeof hours === 'string' ? parseFloat(hours) : hours
  if (isNaN(totalHours)) return ''
  
  const wholeHours = Math.floor(totalHours)
  const minutes = Math.round((totalHours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h${minutes}min`
}

/**
 * Formata horas decimais para formato simples (ex: 40.5 -> "40,5h")
 */
export function formatHoursSimple(hours: number | string | null | undefined): string {
  if (!hours && hours !== 0) return ''
  
  const totalHours = typeof hours === 'string' ? parseFloat(hours) : hours
  if (isNaN(totalHours)) return ''
  
  return `${totalHours.toFixed(2).replace('.', ',')}h`
}

/**
 * Valida e formata input de horas em tempo real
 * Retorna o valor formatado para exibição
 */
export function formatHoursInput(input: string): string {
  if (!input || input.trim() === '') return ''
  
  // Se já está em formato válido, retornar como está
  const cleaned = input.trim()
  
  // Permitir formatação livre, mas validar ao salvar
  return cleaned
}


