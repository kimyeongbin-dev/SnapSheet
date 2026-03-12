/**
 * [역할] 회원가입 페이지 (/signup)
 * - 이메일, 비밀번호, 비밀번호 확인
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Wallet, Mail, Lock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../services/Auth';
import { useAuth } from '../context/AuthContext';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMatch = password && passwordConfirm && password === passwordConfirm;
  const passwordMismatch = password && passwordConfirm && password !== passwordConfirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordMatch) return;
    setIsLoading(true);
    setError(null);
    try {
      await authApi.signup(email, password, passwordConfirm);
      await login(email, password);
      navigate('/scanner');
    } catch (err: any) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.');
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
        className="hidden lg:flex lg:w-1/2 bg-gray-900 flex-col justify-between p-16 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-600 rounded-full opacity-20" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-800 rounded-full opacity-30" />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-emerald-500 rounded-full opacity-10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">SnapSheet</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
            지출 관리,<br />이제 쉽게.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            가입하고 AI 스캐너로 첫 번째 영수증을 분석해보세요. 단 몇 초면 충분합니다.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            '영수증 사진 한 장으로 자동 입력',
            '카테고리별 지출 차트 시각화',
            '달력으로 날짜별 지출 확인',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <p className="text-gray-300 text-sm font-medium">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 오른쪽 회원가입 폼 */}
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
            <h1 className="text-4xl font-black tracking-tight text-gray-900">회원가입</h1>
            <p className="text-gray-400 mt-2 font-medium">처음 오셨군요! 환영합니다.</p>
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
                  placeholder="8자 이상 입력"
                  className="w-full bg-gray-50 border border-black/5 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:font-normal placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 재입력"
                  className={`w-full bg-gray-50 border rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-2 transition-all placeholder:font-normal placeholder:text-gray-300
                    ${passwordMismatch
                      ? 'border-red-200 focus:ring-red-500/20 focus:border-red-400'
                      : passwordMatch
                        ? 'border-emerald-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                        : 'border-black/5 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                />
                {passwordMatch && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
              {passwordMismatch && (
                <p className="text-xs text-red-400 font-bold pl-1">비밀번호가 일치하지 않습니다.</p>
              )}
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

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !!passwordMismatch || !password}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all
                ${isLoading || !!passwordMismatch || !password
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-100 active:scale-95'
                }`}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 가입 중...</>
              ) : '회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 font-medium">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-emerald-600 font-black hover:underline">
              로그인
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};