/**
 * [역할] 백엔드 API 통신 모듈
 * - uploadReceipt  : 이미지 분석 + raw_data 임시 저장, raw_data_id 반환
 * - rollbackUpload : 다시 스캔 시 임시 저장된 raw_data 삭제
 * - confirmSave    : 사용자 확인 후 expenses 영구 저장 + 오독 사전 피드백 (한 트랜잭션)
 * - submitFeedback : Dashboard 편집 시 오독 사전 피드백
 */

import axios from 'axios';
import { type AnalysisResponse, type UploadApiResponse, type ExpenseItem } from '../types/expense';

const API_BASE = 'http://127.0.0.1:8000/api';

export const uploadReceipt = async (file: File): Promise<UploadApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_BASE}/upload`, formData);
  if (res.data.status === 'error' || !res.data.analysis_result) {
    throw new Error(res.data.message || '서버 분석 중 오류가 발생했습니다.');
  }
  return {
    analysis_result: res.data.analysis_result as AnalysisResponse,
    raw_data_id: res.data.raw_data_id as string,
  };
};

export const rollbackUpload = async (rawDataId: string): Promise<void> => {
  await axios.delete(`${API_BASE}/upload/${rawDataId}`);
};

export interface CorrectionItem {
  wrong_text: string;
  correct_text: string;
  category_hint?: string;
  field_scope?: 'category' | 'sub_category' | 'description';
}

export const confirmSave = async (
  rawDataId: string,
  items: ExpenseItem[],
  corrections: CorrectionItem[],
): Promise<void> => {
  const res = await axios.post(`${API_BASE}/confirm`, {
    raw_data_id: rawDataId,
    items,
    corrections,
  });
  if (res.data.status === 'error') {
    throw new Error(res.data.message || '저장 중 오류가 발생했습니다.');
  }
};

export const submitFeedback = async (corrections: CorrectionItem[]): Promise<void> => {
  if (corrections.length === 0) return;
  await axios.post(`${API_BASE}/feedback`, { corrections });
};
