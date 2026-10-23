import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export interface Feedback {
  id: string;
  experience: number | null;
  facilite: number | null;
  apprecie: string | null;
  frustration: string | null;
  createdAt: string;
}

export interface FeedbackMeta {
  total: number;
  avgExperience: number;
  avgFacilite: number;
}

export interface CreateFeedbackData {
  experience?: number;
  facilite?: number;
  apprecie?: string;
  frustration?: string;
}

export const submitFeedback = (data: CreateFeedbackData): Promise<Feedback> =>
  api.post<{ data: Feedback }>("/feedbacks", data).then((r) => r.data.data);

export const fetchFeedbacksAdmin = (): Promise<{ data: Feedback[]; meta: FeedbackMeta }> =>
  api.get<{ data: Feedback[]; meta: FeedbackMeta }>("/feedbacks/admin").then((r) => r.data);

export const markFeedbacksRead = (): Promise<void> =>
  api.patch("/feedbacks/admin/mark-read");

export const deleteFeedback = (id: string): Promise<void> =>
  api.delete(`/feedbacks/admin/${id}`);
