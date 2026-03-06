import axios from 'axios';
import { type AnalysisResponse } from '../types/expense';

export const uploadReceipt = async (file: File): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post('http://127.0.0.1:8000/api/upload', formData);
  return res.data.analysis_result;
};
