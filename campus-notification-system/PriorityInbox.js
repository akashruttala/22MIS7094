/**
 * PriorityInbox.js — Stage 6 Implementation
 * 
 * Fetches notifications from the evaluation API and finds the top 10
 * most important ones using a priority scoring system.
 * 
 * Priority = Type Weight + Recency
 *   - Placement = 3 (highest)
 *   - Result    = 2
 *   - Event     = 1 (lowest)
 * 
 * If weights are tied, newer notifications rank higher.
 * 
 * Uses a sorted insertion approach with a fixed-size array.
 * Time complexity: O(M * N) where M = total notifications, N = inbox size (10).
 * Since N is tiny, this is effectively O(M).
 */

const API_URL = 'http://4.224.186.213/evaluation-service/notifications';

const WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

// Sample data from the evaluation document (fallback if API needs auth)
const SAMPLE_DATA = [
  { ID: "d146095a-0d86-4a34-9e69-3900a14576bc", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:51:30" },
  { ID: "b283218f-ea5a-4b7c-93a9-1f2f240d64b0", Type: "Placement", Message: "CSX Corporation hiring", Timestamp: "2026-04-22 17:51:18" },
  { ID: "81589ada-0ad3-4f77-9554-f52fb558e09d", Type: "Event", Message: "farewell", Timestamp: "2026-04-22 17:51:06" },
  { ID: "0005513a-142b-4bbc-8678-eefec65e1ede", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:50:54" },
  { ID: "ea836726-c25e-4f21-a72f-544a6af8a37f", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:42" },
  { ID: "003cb427-8fc6-4f7f-bb00-be228f6bd02c", Type: "Result", Message: "external", Timestamp: "2026-04-22 17:50:30" },
  { ID: "e5c4ff20-31bf-4d40-8f02-72fda59e8918", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:18" },
  { ID: "1cfce5ee-ad37-4894-8946-d707627176a5", Type: "Event", Message: "tech-fest", Timestamp: "2026-04-22 17:50:06" },
  { ID: "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:49:54" },
  { ID: "8a7412bd-6065-4d09-8501-a37f11cc848b", Type: "Placement", Message: "Advanced Micro Devices Inc. hiring", Timestamp: "2026-04-22 17:49:42" },
];

class PriorityInbox {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.inbox = []; // sorted array, highest priority first
  }

  // Compare two notifications. Returns negative if 'a' has higher priority.
  compare(a, b) {
    const wA = WEIGHTS[a.Type] || 0;
    const wB = WEIGHTS[b.Type] || 0;

    if (wA !== wB) return wB - wA; // higher weight = higher priority
    // same weight — newer timestamp wins
    return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
  }

  // Insert a notification into the sorted inbox, maintaining max size
  insert(notification) {
    let pos = this.inbox.length; // default: insert at end
    for (let i = 0; i < this.inbox.length; i++) {
      if (this.compare(notification, this.inbox[i]) < 0) {
        pos = i;
        break;
      }
    }
    this.inbox.splice(pos, 0, notification);

    // Trim if we exceeded max size
    if (this.inbox.length > this.maxSize) {
      this.inbox.pop();
    }
  }

  // Fetch from API, fall back to sample data if auth fails
  async fetchAndProcess() {
    let data;
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      if (json.notifications && json.notifications.length > 0) {
        data = json.notifications;
      } else {
        throw new Error('No notifications in API response');
      }
    } catch (err) {
      console.log(`[PriorityInbox] API unavailable (${err.message}), using sample data`);
      data = SAMPLE_DATA;
    }

    // Process each notification through the priority inbox
    for (const notif of data) {
      this.insert(notif);
    }

    this.display();
  }

  display() {
    console.log(`\n========== TOP ${this.maxSize} PRIORITY INBOX ==========`);
    console.log('Rank | Type       | Message                           | Timestamp');
    console.log('-----|------------|-----------------------------------|---------------------');
    this.inbox.forEach((n, i) => {
      const rank = String(i + 1).padStart(2, ' ');
      const type = n.Type.padEnd(10);
      const msg = n.Message.length > 35 ? n.Message.substring(0, 32) + '...' : n.Message.padEnd(35);
      console.log(` ${rank}  | ${type} | ${msg} | ${n.Timestamp}`);
    });
    console.log('=====================================================\n');
  }
}

// Run
if (require.main === module) {
  const inbox = new PriorityInbox(10);
  inbox.fetchAndProcess();
}

module.exports = PriorityInbox;
