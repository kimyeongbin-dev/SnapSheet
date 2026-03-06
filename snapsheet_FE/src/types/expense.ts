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
