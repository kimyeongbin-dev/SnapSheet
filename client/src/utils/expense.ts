/**
 * [역할] 지출 관련 공유 유틸 함수
 * - isIncomeCategory: Dashboard, ResultPanel, TransactionContext 3곳에서 중복되던 것을 통합
 */

export const isIncomeCategory = (category: string): boolean =>
  category.includes('수입') || category.includes('소득') || category.includes('월급');
