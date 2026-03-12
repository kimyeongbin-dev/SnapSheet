/**
 * [역할] 로그인 페이지 (/login)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Wallet, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { transactions } = useTransactions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      // transactions 있으면 대시보드, 없으면 스캐너
      navigate(transactions.length > 0 ? '/' : '/scanner');
    } catch (err: any) {
      setError(err.response?.data?.detail || '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* 왼쪽 브랜드 패널 */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-emerald-600 flex-col justify-between p-16 relative overflow-hidden"
      >
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500 rounded-full opacity-40" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-700 rounded-full opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500 rounded-full opacity-20" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">SnapSheet</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
            아날로그를<br />디지털로.
          </h2>
          <p className="text-emerald-100 text-lg leading-relaxed max-w-sm">
            이미지 한 장으로 모든 지출을 자동으로 정리하세요. AI가 카테고리까지 분류해드립니다.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          {[
            { label: '자동 분류', desc: 'AI 카테고리' },
            { label: '날짜 인식', desc: '자동 파싱' },
            { label: '차트 분석', desc: '지출 시각화' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-white font-black text-sm">{item.label}</p>
              <p className="text-emerald-200 text-xs font-medium mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md space-y-8"
        >
          {/* 모바일 로고 */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">SnapSheet</span>
          </div>

          <div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">로그인</h1>
            <p className="text-gray-400 mt-2 font-medium">다시 오셨군요! 반갑습니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이메일 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full bg-gray-50 border border-black/5 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-normal placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-black/5 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-normal placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all
                ${isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100 active:scale-95'
                }`}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 로그인 중...</>
              ) : '로그인'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 font-medium">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-emerald-600 font-black hover:underline">
              회원가입
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};