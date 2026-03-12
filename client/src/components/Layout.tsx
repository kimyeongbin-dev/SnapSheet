import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Wallet, LayoutGrid, Camera, TrendingUp, TrendingDown, UserCircle, LogOut, Trash2, Info, Pencil, Check, X } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/Auth';
import { ExpenseItem } from '../types/expense';
import { TransactionModal } from './TransactionModal';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addTransaction, updateTransaction, transactions } = useTransactions();
  const { user, logout, refreshUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);

  // 유저 드롭다운
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // 내 정보 모달
  const [infoOpen, setInfoOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  const startEditName = () => {
    setNameInput(user?.name ?? '');
    setNameError('');
    setEditingName(true);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSaving(true);
    setNameError('');
    try {
      await authApi.updateMe(nameInput.trim());
      await refreshUser();
      setEditingName(false);
    } catch {
      setNameError('저장에 실패했습니다.');
    } finally {
      setNameSaving(false);
    }
  };

  // 회원 탈퇴 확인 모달
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await authApi.deleteAccount(deletePassword);
      await logout();
      navigate('/login');
    } catch {
      setDeleteError('비밀번호가 올바르지 않습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openModal = (defaultCategory: string) => {
    setEditingItem({
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      category: defaultCategory,
      sub_category: '',
      description: '',
      budget: 0,
      spent: 0,
      diff: 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const exists = transactions.find(t => t.id === editingItem.id);
    if (exists) {
      updateTransaction(editingItem);
    } else {
      addTransaction(editingItem);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SnapSheet</span>
          </Link>

          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <Link
                to="/"
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${location.pathname === '/' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">대시보드</span>
              </Link>
              <Link
                to="/scanner"
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${location.pathname === '/scanner' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">AI 스캐너</span>
              </Link>
            </div>

            {/* 수입 추가 버튼 */}
            <button
              onClick={() => openModal('수입')}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">수입 추가</span>
            </button>

            {/* 지출 추가 버튼 */}
            <button
              onClick={() => openModal('식비')}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all"
            >
              <TrendingDown className="w-4 h-4" />
              <span className="hidden sm:inline">지출 추가</span>
            </button>

            {/* 유저 메뉴 */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <UserCircle className="w-5 h-5 text-gray-500" />
                <span className="hidden sm:inline text-sm font-bold text-gray-700">
                  {user?.name ?? user?.email?.split('@')[0] ?? '사용자'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 w-52">
                  <div className="px-3 py-2 mb-1 border-b border-black/5">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">내 계정</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); setInfoOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Info className="w-4 h-4" />
                    내 정보
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); setDeleteOpen(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    회원 탈퇴
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <Outlet />
      </main>

      <footer className="max-w-6xl mx-auto p-10 mt-10 border-t border-black/5 text-center">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em]">Powered by SnapSheet AI Engine</p>
      </footer>

      <TransactionModal
        isOpen={isModalOpen}
        item={editingItem}
        isNew={!transactions.find(t => t.id === editingItem?.id)}
        transactions={transactions}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        onChange={setEditingItem}
      />

      {/* 내 정보 모달 */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">내 정보</h2>
              <button
                onClick={() => { setInfoOpen(false); setEditingName(false); }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-base font-black text-gray-900">
                    {user?.name ?? user?.email?.split('@')[0] ?? '사용자'}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-2.5 text-sm">
                {/* 이름 (편집 가능) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400 font-bold flex-shrink-0">이름</span>
                  {editingName ? (
                    <form onSubmit={handleSaveName} className="flex items-center gap-1.5 flex-1 justify-end">
                      <input
                        autoFocus
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        className="w-32 px-2 py-1 rounded-lg border border-emerald-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-300 text-right"
                      />
                      <button type="submit" disabled={nameSaving} className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditingName(false)} className="p-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-800">{user?.name ?? '-'}</span>
                      <button onClick={startEditName} className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {nameError && <p className="text-xs text-red-500 font-bold -mt-1">{nameError}</p>}

                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold">이메일</span>
                  <span className="font-bold text-gray-800">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold">가입일</span>
                  <span className="font-bold text-gray-800">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setInfoOpen(false); setEditingName(false); }}
              className="mt-4 w-full py-2.5 rounded-xl bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 확인 모달 */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-black text-gray-900 mb-1">회원 탈퇴</h2>
            <p className="text-sm text-gray-500 mb-4">탈퇴하면 모든 데이터가 삭제됩니다. 비밀번호를 입력해 확인해주세요.</p>
            <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
              <input
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                required
              />
              {deleteError && <p className="text-xs text-red-500 font-bold">{deleteError}</p>}
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setDeleteOpen(false); setDeletePassword(''); setDeleteError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? '처리 중...' : '탈퇴하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};