/**
 * Наш "Умный помощник" для расчетов.
 * Он берет данные из твоей формы и выдает готовые цифры.
 */
export function calculateOrderDetails(params: {
  basePriceNetto: number;       // Чистая цена из базы
  baseDurationMinutes: number;  // Базовое время из базы
  extraServices: { price: number; minutes: number }[]; // Список доп. услуг
  cleanerCount: number;         // Сколько клинеров ты выбрала (1-3)
  payoutPercentage: number;     // Процент клинера из типа уборки
  hasVat: boolean;              // Нажат ли рычажок 23%
}) {
  
  // 1. Считаем дополнительные деньги и время
  const extrasPrice = params.extraServices.reduce((sum, s) => sum + s.price, 0);
  const extrasMinutes = params.extraServices.reduce((sum, s) => sum + s.minutes, 0);

  // 2. Считаем общую ЧИСТУЮ сумму (Netto)
  const totalNetto = params.basePriceNetto + extrasPrice;

  // 3. Считаем НАЛОГ 23% (VAT)
  // Если рычажок включен, считаем 23%, если нет — то 0
  const vatAmount = params.hasVat ? totalNetto * 0.23 : 0;
  
  // 4. Считаем ИТОГОВУЮ сумму (Brutto)
  const totalBrutto = totalNetto + vatAmount;

  // 5. ДЕЛИМ ВРЕМЯ НА КОМАНДУ
  // Общее время (база + допы) делим на количество человек
  const totalMinutes = params.baseDurationMinutes + extrasMinutes;
  const minutesPerCleaner = Math.ceil(totalMinutes / params.cleanerCount);

  // 6. СЧИТАЕМ ЗАРПЛАТУ (Payout)[cite: 1]
  // Берем чистую цену, вычисляем процент и делим на всех
  const totalPayoutPool = totalNetto * (params.payoutPercentage / 100);
  const payoutPerCleaner = totalPayoutPool / params.cleanerCount;

  return {
    totalNetto: totalNetto.toFixed(2),
    totalBrutto: totalBrutto.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    minutesPerCleaner,
    payoutPerCleaner: payoutPerCleaner.toFixed(2)
  };
}
