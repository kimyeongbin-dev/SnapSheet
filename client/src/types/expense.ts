/**
 * [역할] 지출 데이터 관련 TypeScript 타입 정의
 * - 백엔드 API 응답 구조와 동기화 유지 필요 (server/models/expense.py 참고)
 *
 * [추가 예정]
 * - User, Document 등 추가 도메인 타입
 */

export interface ExpenseItem {
  category: string;
  sub_category: string;
  description: string;
  budget: number;
  spent: number;
  diff: number;
}

export interface GroupedExpenses {
  [category: string]: {
    total_spent: number;
    items: ExpenseItem[];
  };
}

export interface AnalysisResponse {
  title: string;
  grouped_items: GroupedExpenses;
  total: { spent_sum: number };
}
