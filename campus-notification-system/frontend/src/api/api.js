import axios from 'axios';

const BACKEND = 'http://localhost:8080/api/v1/notifications';
const EVAL_API = 'http://4.224.186.213/evaluation-service/notifications';

const SAMPLE_NOTIFICATIONS = [
  { id: "d146095a-0d86-4a34-9e69-3900a14576bc", type: "Result", message: "Mid-semester results published for CSE301", createdAt: "2026-04-22T17:51:30", isRead: false },
  { id: "b283218f-ea5a-4b7c-93a9-1f2f240d64b0", type: "Placement", message: "CSX Corporation hiring — Software Engineer roles", createdAt: "2026-04-22T17:51:18", isRead: false },
  { id: "81589ada-0ad3-4f77-9554-f52fb558e09d", type: "Event", message: "Farewell ceremony for 2026 batch — Main Auditorium", createdAt: "2026-04-22T17:51:06", isRead: false },
  { id: "0005513a-142b-4bbc-8678-eefec65e1ede", type: "Result", message: "Mid-semester results published for ECE205", createdAt: "2026-04-22T17:50:54", isRead: false },
  { id: "ea836726-c25e-4f21-a72f-544a6af8a37f", type: "Result", message: "Project review grades updated", createdAt: "2026-04-22T17:50:42", isRead: false },
  { id: "003cb427-8fc6-4f7f-bb00-be228f6bd02c", type: "Result", message: "External lab exam marks uploaded", createdAt: "2026-04-22T17:50:30", isRead: false },
  { id: "e5c4ff20-31bf-4d40-8f02-72fda59e8918", type: "Result", message: "Project review Phase 2 grades available", createdAt: "2026-04-22T17:50:18", isRead: false },
  { id: "1cfce5ee-ad37-4894-8946-d707627176a5", type: "Event", message: "TechFest 2026 registrations open — Register now!", createdAt: "2026-04-22T17:50:06", isRead: false },
  { id: "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", type: "Result", message: "Project review Phase 1 marks finalized", createdAt: "2026-04-22T17:49:54", isRead: false },
  { id: "8a7412bd-6065-4d09-8501-a37f11cc848b", type: "Placement", message: "AMD hiring — Apply for chip design internship", createdAt: "2026-04-22T17:49:42", isRead: false },
  { id: "a1234567-1111-2222-3333-444455556666", type: "Placement", message: "Google visiting campus — SDE roles open", createdAt: "2026-04-22T17:49:30", isRead: false },
  { id: "b2345678-2222-3333-4444-555566667777", type: "Event", message: "Cultural night — performances start at 6 PM", createdAt: "2026-04-22T17:49:18", isRead: false },
  { id: "c3456789-3333-4444-5555-666677778888", type: "Placement", message: "Microsoft on-campus drive — May 25", createdAt: "2026-04-22T17:49:06", isRead: false },
  { id: "d4567890-4444-5555-6666-777788889999", type: "Event", message: "Hackathon 2026 — 48hr coding challenge", createdAt: "2026-04-22T17:48:54", isRead: false },
  { id: "e5678901-5555-6666-7777-888899990000", type: "Result", message: "Semester 6 final grades released", createdAt: "2026-04-22T17:48:42", isRead: false },
];

const normalize = (notif) => ({
  id: notif.id || notif.ID,
  type: notif.type || notif.Type,
  message: notif.message || notif.Message,
  timestamp: notif.createdAt || notif.Timestamp || notif.timestamp,
  isRead: notif.isRead || notif.is_read || false,
});

export const fetchNotifications = async (params = {}) => {
  try {
    const res = await axios.get(BACKEND, { params, timeout: 3000 });
    if (res.data && res.data.notifications) {
      return {
        notifications: res.data.notifications.map(normalize),
        total: res.data.totalRecords || res.data.notifications.length,
        page: res.data.page || 1,
        totalPages: res.data.totalPages || 1,
      };
    }
  } catch (e) {
    console.warn('[API] Backend unavailable, trying eval API...', e.message);
  }

  try {
    const res = await axios.get(EVAL_API, { params, timeout: 5000 });
    if (res.data && Array.isArray(res.data.notifications)) {
      const mapped = res.data.notifications.map(normalize);
      return applyLocalFilters(mapped, params);
    }
  } catch (e) {
    console.warn('[API] Eval API unavailable, using sample data...', e.message);
  }

  return applyLocalFilters(SAMPLE_NOTIFICATIONS.map(normalize), params);
};

export const markNotificationRead = async (id) => {
  try {
    await axios.patch(`${BACKEND}/${id}/read`, null, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

export const getUnreadCount = async () => {
  try {
    const res = await axios.get(`${BACKEND}/unread-count`, { timeout: 3000 });
    return res.data.unreadCount;
  } catch {
    return null;
  }
};

const applyLocalFilters = (data, params) => {
  let filtered = [...data];
  if (params.notification_type) {
    filtered = filtered.filter(n => n.type === params.notification_type);
  }
  const limit = parseInt(params.limit) || filtered.length;
  const page = parseInt(params.page) || 1;
  const start = (page - 1) * limit;
  return {
    notifications: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
  };
};
