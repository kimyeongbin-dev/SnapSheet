/**
 * [역할] 개별 지출 항목 카드 컴포넌트
 * - 항목명, 세부 카테고리, 지출액, 예산 표시
 *
 * [추가 예정]
 * - 항목 수정 / 삭제 기능
 * - 예산 대비 초과 여부 시각적 표시
 */

import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ExpenseItem } from '../types/expense';

interface ExpenseCardProps {
  item: ExpenseItem;
}

export default function ExpenseCard({ item }: ExpenseCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-gray-50/50 p-5 rounded-2xl border border-black/5 flex items-center justify-between group transition-all hover:bg-white hover:shadow-xl hover:shadow-black/5"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-emerald-50 transition-colors">
          <CheckCircle2 className="w-5 h-5 text-gray-300 group-hover:text-emerald-500" />
        </div>
        <div>
          <p className="font-bold text-gray-900">{item.description}</p>
          <p className="text-xs text-gray-500">{item.sub_category}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-black text-lg">{item.spent.toLocaleString()}원</p>
        {item.budget > 0 && (
          <p className="text-[10px] font-bold text-gray-400">Budget: {item.budget.toLocaleString()}</p>
        )}
      </div>
    </motion.div>
  );
}
