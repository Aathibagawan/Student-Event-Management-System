import api from "./api";

const BIG = { page_size: 200 };
export const unwrap = (res) => res.data.results ?? res.data;

export const authService = {
  login: (email, password) => api.post("/auth/login/", { username: email, password }),
  register: (payload) => api.post("/auth/register/", payload),
  me: () => api.get("/auth/me/"),
};

export const eventService = {
  list: (params = {}) => api.get("/events/", { params: { ...BIG, ...params } }).then(unwrap),
  assigned: () => api.get("/events/assigned/", { params: BIG }).then(unwrap),
  get: (id) => api.get(`/events/${id}/`).then((r) => r.data),
  create: (data) => api.post("/events/", data).then((r) => r.data),
  update: (id, data) => api.patch(`/events/${id}/`, data).then((r) => r.data),
  remove: (id) => api.delete(`/events/${id}/`),
  register: (id) => api.post(`/events/${id}/register/`).then((r) => r.data),
  volunteers: (id) => api.get(`/events/${id}/volunteers/`).then((r) => r.data),
  assignVolunteer: (id, volunteer_id) => api.post(`/events/${id}/volunteers/`, { volunteer_id }),
  unassignVolunteer: (id, volunteerId) => api.delete(`/events/${id}/volunteers/${volunteerId}/`),
};

export const registrationService = {
  list: (params = {}) => api.get("/registrations/", { params: { ...BIG, ...params } }).then(unwrap),
  update: (id, data) => api.patch(`/registrations/${id}/`, data),
  remove: (id) => api.delete(`/registrations/${id}/`),
  // QR is fetched with the auth header and shown from a blob URL (an <img src> can't send headers).
  qrBlobUrl: async (id, download = false) => {
    const res = await api.get(`/registrations/${id}/qr/`, {
      responseType: "blob",
      params: download ? { download: 1 } : {},
    });
    return URL.createObjectURL(res.data);
  },
};

export const attendanceService = {
  checkIn: (registration_id) => api.post("/attendance/check-in/", { registration_id }).then((r) => r.data),
  summary: (params) => api.get("/attendance/summary/", { params }).then((r) => r.data),
};

export const userService = {
  list: (params = {}) => api.get("/users/", { params: { ...BIG, ...params } }).then(unwrap),
  volunteers: (params = {}) => api.get("/volunteers/", { params: { ...BIG, ...params } }).then(unwrap),
  createVolunteer: (data) => api.post("/volunteers/", data).then((r) => r.data),
};

export const budgetService = {
  budgets: (params = {}) => api.get("/budgets/", { params: { ...BIG, ...params } }).then(unwrap),
  createBudget: (data) => api.post("/budgets/", data).then((r) => r.data),
  deleteBudget: (id) => api.delete(`/budgets/${id}/`),
  expenses: (params = {}) => api.get("/expenses/", { params: { ...BIG, ...params } }).then(unwrap),
  createExpense: (data) => api.post("/expenses/", data).then((r) => r.data),
  deleteExpense: (id) => api.delete(`/expenses/${id}/`),
};

export const dashboardService = {
  get: () => api.get("/dashboard/").then((r) => r.data),
};
