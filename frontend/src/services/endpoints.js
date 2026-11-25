import api from "./api";

export const unwrap = (res) => res.data.results ?? res.data;
const ALL = { page_size: 200 }; // for dropdowns that need every row

// Builds multipart/form-data so a File (event poster) can be sent along with normal fields.
export function toFormData(obj) {
  const fd = new FormData();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value);
  });
  return fd;
}

export const authService = {
  login: (email, password) => api.post("/auth/login/", { username: email, password }),
  register: (payload) => api.post("/auth/register/", payload),
  logout: (refresh) => api.post("/auth/logout/", { refresh }),
  me: () => api.get("/auth/me/"),
};

export const eventService = {
  // list/assigned return the paginated envelope: { count, next, previous, results }
  list: (params = {}) => api.get("/events/", { params }).then((r) => r.data),
  assigned: (params = {}) => api.get("/events/assigned/", { params }).then((r) => r.data),
  all: (params = {}) => api.get("/events/", { params: { ...ALL, ...params } }).then(unwrap),
  allAssigned: () => api.get("/events/assigned/", { params: ALL }).then(unwrap),
  get: (id) => api.get(`/events/${id}/`).then((r) => r.data),
  create: (data) => api.post("/events/", toFormData(data)).then((r) => r.data),
  update: (id, data) => api.patch(`/events/${id}/`, toFormData(data)).then((r) => r.data),
  remove: (id) => api.delete(`/events/${id}/`),
  register: (id) => api.post(`/events/${id}/register/`).then((r) => r.data),
  volunteers: (id) => api.get(`/events/${id}/volunteers/`).then((r) => r.data),
  assignVolunteer: (id, volunteer_id) => api.post(`/events/${id}/volunteers/`, { volunteer_id }),
  unassignVolunteer: (id, volunteerId) => api.delete(`/events/${id}/volunteers/${volunteerId}/`),
};

export const registrationService = {
  list: (params = {}) => api.get("/registrations/", { params }).then((r) => r.data),
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
  list: (params = {}) => api.get("/users/", { params }).then((r) => r.data),
  volunteers: (params = {}) => api.get("/volunteers/", { params: { ...ALL, ...params } }).then(unwrap),
  createVolunteer: (data) => api.post("/volunteers/", data).then((r) => r.data),
};

export const budgetService = {
  budgets: (params = {}) => api.get("/budgets/", { params: { ...ALL, ...params } }).then(unwrap),
  createBudget: (data) => api.post("/budgets/", data).then((r) => r.data),
  deleteBudget: (id) => api.delete(`/budgets/${id}/`),
  expenses: (params = {}) => api.get("/expenses/", { params: { ...ALL, ...params } }).then(unwrap),
  createExpense: (data) => api.post("/expenses/", data).then((r) => r.data),
  deleteExpense: (id) => api.delete(`/expenses/${id}/`),
};

export const dashboardService = {
  get: () => api.get("/dashboard/").then((r) => r.data),
  eventReport: () => api.get("/dashboard/event-report/").then((r) => r.data),
};
