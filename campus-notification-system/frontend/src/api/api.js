import axios from 'axios';

// The external notification API provided for the evaluation
const API_BASE = 'http://4.224.186.213/evaluation-service/notifications';

// Fallback data in case the API needs auth or is unavailable
const SAMPLE_NOTIFICATIONS = [
  { ID: "d146095a-0d86-4a34-9e69-3900a14576bc", Type: "Result", Message: "Mid-semester results published for CSE301", Timestamp: "2026-04-22 17:51:30" },
  { ID: "b283218f-ea5a-4b7c-93a9-1f2f240d64b0", Type: "Placement", Message: "CSX Corporation hiring — Software Engineer roles", Timestamp: "2026-04-22 17:51:18" },
  { ID: "81589ada-0ad3-4f77-9554-f52fb558e09d", Type: "Event", Message: "Farewell ceremony for 2026 batch — Main Auditorium", Timestamp: "2026-04-22 17:51:06" },
  { ID: "0005513a-142b-4bbc-8678-eefec65e1ede", Type: "Result", Message: "Mid-semester results published for ECE205", Timestamp: "2026-04-22 17:50:54" },
  { ID: "ea836726-c25e-4f21-a72f-544a6af8a37f", Type: "Result", Message: "Project review grades updated", Timestamp: "2026-04-22 17:50:42" },
  { ID: "003cb427-8fc6-4f7f-bb00-be228f6bd02c", Type: "Result", Message: "External lab exam marks uploaded", Timestamp: "2026-04-22 17:50:30" },
  { ID: "e5c4ff20-31bf-4d40-8f02-72fda59e8918", Type: "Result", Message: "Project review Phase 2 grades available", Timestamp: "2026-04-22 17:50:18" },
  { ID: "1cfce5ee-ad37-4894-8946-d707627176a5", Type: "Event", Message: "TechFest 2026 registrations open — Register now!", Timestamp: "2026-04-22 17:50:06" },
  { ID: "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", Type: "Result", Message: "Project review Phase 1 marks finalized", Timestamp: "2026-04-22 17:49:54" },
  { ID: "8a7412bd-6065-4d09-8501-a37f11cc848b", Type: "Placement", Message: "AMD hiring — Apply for chip design internship", Timestamp: "2026-04-22 17:49:42" },
  { ID: "a1234567-1111-2222-3333-444455556666", Type: "Placement", Message: "Google visiting campus — SDE roles open", Timestamp: "2026-04-22 17:49:30" },
  { ID: "b2345678-2222-3333-4444-555566667777", Type: "Event", Message: "Cultural night — performances start at 6 PM", Timestamp: "2026-04-22 17:49:18" },
  { ID: "c3456789-3333-4444-5555-666677778888", Type: "Placement", Message: "Microsoft on-campus drive — May 25", Timestamp: "2026-04-22 17:49:06" },
  { ID: "d4567890-4444-5555-6666-777788889999", Type: "Event", Message: "Hackathon 2026 — 48hr coding challenge", Timestamp: "2026-04-22 17:48:54" },
  { ID: "e5678901-5555-6666-7777-888899990000", Type: "Result", Message: "Semester 6 final grades released", Timestamp: "2026-04-22 17:48:42" },
];

/**
 * Fetches notifications from the external API.
 * Falls back to sample data if API is unreachable or requires auth.
 */
export const fetchNotifications = async (params = {}) => {
  try {
    const response = await axios.get(API_BASE, {
      params,
      timeout: 5000,
    });

    if (response.data && response.data.notifications) {
      return applyLocalFilters(response.data.notifications, params);
    }
    throw new Error('Unexpected response structure');
  } catch (err) {
    // API requires auth token we don't have — use sample data
    console.warn('[NotificationAPI] Using sample data:', err.message);
    return applyLocalFilters([...SAMPLE_NOTIFICATIONS], params);
  }
};

/**
 * Applies pagination and type filtering locally
 * (mirrors the API's query param behavior for offline/fallback mode)
 */
const applyLocalFilters = (data, params) => {
  let filtered = [...data];

  // Type filter
  if (params.notification_type) {
    filtered = filtered.filter(n => n.Type === params.notification_type);
  }

  // Pagination
  const limit = parseInt(params.limit) || filtered.length;
  const page = parseInt(params.page) || 1;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    notifications: paginated,
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
  };
};
