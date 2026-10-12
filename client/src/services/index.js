import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  me: () => api.get('/auth/me'),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  importEmails: (formData) =>
    api.post('/admin/authorized-emails/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addAuthorizedEmail: (data) => api.post('/admin/authorized-emails', data),
  getAuthorizedEmails: (params) => api.get('/admin/authorized-emails', { params }),
  updateAuthorizedEmail: (id, data) => api.patch(`/admin/authorized-emails/${id}`, data),
  deleteAuthorizedEmail: (id) => api.delete(`/admin/authorized-emails/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
};

export const teacherService = {
  getStudents: (params) => api.get('/teacher/students', { params }),
  createQuestion: (data) => api.post('/teacher/questions', data),
  getMyQuestions: (params) => api.get('/teacher/questions', { params }),
  getQuestion: (id) => api.get(`/teacher/questions/${id}`),
  updateQuestion: (id, data) => api.patch(`/teacher/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/teacher/questions/${id}`),
  getQuestionDashboard: (id) => api.get(`/teacher/questions/${id}/dashboard`),
  getQuestionSubmissions: (id, params) =>
    api.get(`/teacher/questions/${id}/submissions`, { params }),
  getSubmission: (id) => api.get(`/teacher/submissions/${id}`),
  reviewSubmission: (id, data) => api.patch(`/teacher/submissions/${id}/review`, data),
};

export const studentService = {
  getQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (id) => api.get(`/questions/${id}`),
  runCode: (id, data) => api.post(`/questions/${id}/run`, data),
  submitCode: (id, data) => api.post(`/questions/${id}/submissions`, data),
  getMySubmissions: (params) => api.get('/submissions/mine', { params }),
  getMySubmissionsForQuestion: (id) => api.get(`/questions/${id}/submissions/mine`),
};
