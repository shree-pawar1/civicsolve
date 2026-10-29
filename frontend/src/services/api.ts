export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-CivicSolve-Request', '1');

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include', // Ensures session cookie is sent and received
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(response.status, errorMessage, data?.details);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    register: (payload: any) =>
      request<{ message: string; user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    login: (credentials: { email: string; password: string }) =>
      request<{ message: string; user: any; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      }),
    me: () =>
      request<{ user: any; sessionId: string }>('/api/auth/me'),
  },

  // Problems
  problems: {
    list: (params: Record<string, string | number> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      return request<{ data: any[]; pagination: any }>(`/api/problems${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) =>
      request<{ problem: any }>(`/api/problems/${id}`),
    create: (payload: any) =>
      request<{ message: string; problem: any }>('/api/problems', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: any) =>
      request<{ message: string; problem: any }>(`/api/problems/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/problems/${id}`, {
        method: 'DELETE',
      }),
    changeStatus: (id: string, payload: { toStatus: string; message: string }) =>
      request<{ message: string; problem: any; timelineEntry: any }>(`/api/problems/${id}/status`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Solutions
  solutions: {
    create: (problemId: string, payload: any) =>
      request<{ message: string; solution: any }>(`/api/problems/${problemId}/solutions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, payload: any) =>
      request<{ message: string; solution: any }>(`/api/solutions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    withdraw: (id: string) =>
      request<{ message: string }>(`/api/solutions/${id}`, {
        method: 'DELETE',
      }),
    review: (id: string, reviewStatus: string) =>
      request<{ message: string; solution: any }>(`/api/solutions/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ reviewStatus }),
      }),
    toggleSupport: (id: string) =>
      request<{ message: string; supported: boolean; totalSupports: number }>(`/api/solutions/${id}/support`, {
        method: 'POST',
      }),
  },

  // Dashboard & Stats
  dashboard: {
    getStats: () =>
      request<any>('/api/dashboard/stats'),
    getActivity: () =>
      request<{ activity: any[] }>('/api/dashboard/activity'),
  },

  // AI Assistance (Backend only, never exposes GEMINI_API_KEY)
  ai: {
    classify: (payload: { title: string; description: string }) =>
      request<{ available: boolean; category?: string; reasoning?: string; confidence?: number; error?: string }>(
        '/api/problems/ai-classify',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      ),
    breakdown: (problemId: string) =>
      request<{
        available: boolean;
        isAiGenerated?: boolean;
        model?: string;
        analysis?: any;
        id?: string;
        createdAt?: string;
        error?: string;
      }>(`/api/problems/${problemId}/ai-breakdown`, {
        method: 'POST',
      }),
    getBreakdown: (problemId: string) =>
      request<{
        available: boolean;
        isAiGenerated?: boolean;
        model?: string;
        analysis?: any;
        id?: string;
        createdAt?: string;
        error?: string;
      }>(`/api/problems/${problemId}/ai-breakdown`),
    analyze: (problemId: string) =>
      request<any>(`/api/problems/${problemId}/ai-analyze`, {
        method: 'POST',
      }),
  },
};
