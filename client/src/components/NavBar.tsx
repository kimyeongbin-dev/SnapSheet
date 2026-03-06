/**
 * [역할] 상단 네비게이션 바
 * - 로고 및 메뉴 링크 표시
 *
 * [추가 예정]
 * - react-router 실제 라우팅 연결
 * - 사용자 인증 상태에 따른 로그인/로그아웃 버튼
 */

import { Camera } from 'lucide-react';

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">SnapSheet</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
          <a href="#" className="text-emerald-600">Dashboard</a>
          <a href="#" className="hover:text-gray-900 transition-colors">History</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Settings</a>
        </div>
      </div>
    </nav>
  );
}
