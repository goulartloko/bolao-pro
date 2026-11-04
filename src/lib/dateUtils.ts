/**
 * Utilitários para formatação de data e hora no fuso oficial do Brasil (Horário de Brasília - UTC-3)
 */

export function formatMatchDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";

  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";

    const formatter = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Formato: "qua., 04/11, 19:30" -> transforma em "Qua, 04/11 • 19:30"
    const formatted = formatter.format(date);
    const capitalized = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    const withoutDot = capitalized.replace(".,", ",");
    const lastCommaIndex = withoutDot.lastIndexOf(",");
    if (lastCommaIndex !== -1) {
      return (
        withoutDot.substring(0, lastCommaIndex) +
        " •" +
        withoutDot.substring(lastCommaIndex + 1)
      );
    }
    return withoutDot;
  } catch {
    return String(dateInput);
  }
}

export function formatMatchTimeOnly(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";

  try {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}
