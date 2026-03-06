/**
 * [역할] 백엔드 API 통신 모듈
 * - uploadReceipt: 이미지 파일을 서버에 전송하고 분석 결과 반환
 *
 * [추가 예정]
 * - API 기본 URL 환경변수 분리
 * - 사용자 인증 토큰 헤더 추가
 * - 분석 히스토리 조회 API
 */

import axios from 'axios';
import { type AnalysisResponse } from '../types/expense';

export const uploadReceipt = async (file: File): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post('http://127.0.0.1:8000/api/upload', formData);
  return res.data.analysis_result;
};
