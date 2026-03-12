/**
 * [역할] 백엔드 API 통신 모듈
 * - uploadReceipt: 이미지 파일을 서버에 전송하고 분석 결과 반환
 * - submitFeedback: 사용자 수정 내역을 오독 사전에 피드백
 *
 * [추가 예정]
 * - API 기본 URL 환경변수 분리
 * - 사용자 인증 토큰 헤더 추가
 * - 분석 히스토리 조회 API
 */

import axios from 'axios';
import { type AnalysisResponse } from '../types/expense';

const API_BASE = 'http://127.0.0.1:8000/api';

export const uploadReceipt = async (file: File): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_BASE}/upload`, formData);
  if (res.data.status === 'error' || !res.data.analysis_result) {
    throw new Error(res.data.message || '서버 분석 중 오류가 발생했습니다.');
  }
  return res.data.analysis_result;
};

interface CorrectionItem {
  wrong_text: string;
  correct_text: string;
  category_hint?: string;
  field_scope?: 'category' | 'sub_category' | 'description';
}

export const submitFeedback = async (corrections: CorrectionItem[]): Promise<void> => {
  if (corrections.length === 0) return;
  await axios.post(`${API_BASE}/feedback`, { corrections });
};
