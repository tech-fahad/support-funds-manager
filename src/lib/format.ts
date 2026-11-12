export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-GB") // DD/MM/YYYY
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-")
  return new Date(Number(year), Number(m) - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}
