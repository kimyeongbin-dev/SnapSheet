/**
 * [역할] 카테고리 관련 공유 상수
 * - CATEGORY_COLORS: Dashboard, Layout, ResultPanel 3곳에서 중복되던 것을 통합
 */

export const CATEGORY_COLORS: Record<string, string> = {
  '식비': 'bg-orange-100 text-orange-600 border-orange-200',
  '교통비': 'bg-blue-100 text-blue-600 border-blue-200',
  '쇼핑': 'bg-pink-100 text-pink-600 border-pink-200',
  '의료': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  '주거': 'bg-indigo-100 text-indigo-600 border-indigo-200',
  '주거비': 'bg-indigo-100 text-indigo-600 border-indigo-200',
  '교육': 'bg-purple-100 text-purple-600 border-purple-200',
  '기타': 'bg-gray-100 text-gray-600 border-gray-200',
  '수입': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  '고정수입': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  '변동수입': 'bg-emerald-50 text-emerald-500 border-emerald-100',
  '고정지출': 'bg-red-100 text-red-600 border-red-200',
  '비상금': 'bg-amber-100 text-amber-600 border-amber-200',
  '투자&저축': 'bg-cyan-100 text-cyan-600 border-cyan-200',
};

export const getCategoryStyle = (category: string): string =>
  CATEGORY_COLORS[category] || 'bg-emerald-100 text-emerald-600 border-emerald-200';
