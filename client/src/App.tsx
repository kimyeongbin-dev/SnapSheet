/**
 * [역할] 루트 컴포넌트 - 라우터 설정 및 전역 레이아웃 구성
 * - React Router로 Dashboard / Scanner 페이지 라우팅
 * - Layout 컴포넌트로 공통 nav/footer 래핑
 *
 * 구버전(App.tsx)은 NavBar + UploadPanel + ResultPanel을 직접 조합하는
 * 단일 페이지 구조였으나, Layout + pages 구조로 전환됨
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AnimatePresence } from 'motion/react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scanner } from './pages/Scanner';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// 로그인 안 됐으면 /login으로 보내는 컴포넌트
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return null;
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

// Private Route로 감싸서 로그인 여부에 따라 접근 제어

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AnimatePresence mode="wait">
//         <Routes>
//           <Route path="/login" element={<Login />} />
//           <Route path="/signup" element={<Signup />} />

//           <Route element={
//             <PrivateRoute>
//               <Layout />
//             </PrivateRoute>
//           }>
//             <Route path="/" element={<Dashboard />} />
//             <Route path="/scanner" element={<Scanner />} />
//           </Route>

//           {/* 기본 루트 → 로그인으로 */}
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//       </AnimatePresence>
//     </BrowserRouter>
//   );
// }

export default function App() {
  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  );
}