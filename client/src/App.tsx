/**
 * [역할] 루트 컴포넌트 - 라우터 설정 및 전역 레이아웃 구성
 * - React Router로 Dashboard / Scanner 페이지 라우팅
 * - Layout 컴포넌트로 공통 nav/footer 래핑
 *
 * 구버전(App.tsx)은 NavBar + UploadPanel + ResultPanel을 직접 조합하는
 * 단일 페이지 구조였으나, Layout + pages 구조로 전환됨
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Scanner } from './pages/Scanner';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </BrowserRouter>
  );
}
