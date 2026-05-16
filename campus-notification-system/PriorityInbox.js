// Use native fetch

const WEIGHTS = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

class PriorityInbox {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.notifications = [];
  }

  // Calculate score. Higher is better.
  // We use weight as primary, and timestamp as secondary.
  // To combine them easily, we can compare them sequentially.
  compare(a, b) {
    const weightA = WEIGHTS[a.Type] || 0;
    const weightB = WEIGHTS[b.Type] || 0;
    
    if (weightA !== weightB) {
      return weightB - weightA; // Higher weight comes first
    }
    
    // If weights are equal, newer timestamp comes first
    const timeA = new Date(a.Timestamp).getTime();
    const timeB = new Date(b.Timestamp).getTime();
    return timeB - timeA;
  }

  addNotification(notification) {
    // Insert into sorted array
    let inserted = false;
    for (let i = 0; i < this.notifications.length; i++) {
      if (this.compare(notification, this.notifications[i]) < 0) {
        this.notifications.splice(i, 0, notification);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.notifications.push(notification);
    }
    
    // Keep only top maxSize
    if (this.notifications.length > this.maxSize) {
      this.notifications.pop();
    }
  }

  async fetchAndProcess() {
    const fallbackData = {
      "notifications": [
        { "ID": "d146095a-0d86-4a34-9e69-3900a14576bc", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:51:30" },
        { "ID": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0", "Type": "Placement", "Message": "CSX Corporation hiring", "Timestamp": "2026-04-22 17:51:18" },
        { "ID": "81589ada-0ad3-4f77-9554-f52fb558e09d", "Type": "Event", "Message": "farewell", "Timestamp": "2026-04-22 17:51:06" },
        { "ID": "0005513a-142b-4bbc-8678-eefec65e1ede", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:50:54" },
        { "ID": "ea836726-c25e-4f21-a72f-544a6af8a37f", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:42" },
        { "ID": "003cb427-8fc6-4f7f-bb00-be228f6bd02c", "Type": "Result", "Message": "external", "Timestamp": "2026-04-22 17:50:30" },
        { "ID": "e5c4ff20-31bf-4d40-8f02-72fda59e8918", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:18" },
        { "ID": "1cfce5ee-ad37-4894-8946-d707627176a5", "Type": "Event", "Message": "tech-fest", "Timestamp": "2026-04-22 17:50:06" },
        { "ID": "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:49:54" },
        { "ID": "8a7412bd-6065-4d09-8501-a37f11cc848b", "Type": "Placement", "Message": "Advanced Micro Devices Inc. hiring", "Timestamp": "2026-04-22 17:49:42" }
      ]
    };

    try {
      const response = await fetch('http://4.224.186.213/evaluation-service/notifications');
      const data = await response.json();
      if (data.notifications) {
        data.notifications.forEach(notif => this.addNotification(notif));
      } else {
        throw new Error("No notifications in response");
      }
    } catch (error) {
      console.log("Using fallback sample data due to API error/auth issue.");
      fallbackData.notifications.forEach(notif => this.addNotification(notif));
    }
    this.display();
  }

  display() {
    console.log(`\n=== TOP ${this.maxSize} PRIORITY INBOX ===`);
    this.notifications.forEach((n, idx) => {
      console.log(`${idx + 1}. [${n.Type}] ${n.Message} (${n.Timestamp})`);
    });
    console.log("=================================\n");
  }
}

// Run if called directly
if (require.main === module) {
  const inbox = new PriorityInbox(10);
  inbox.fetchAndProcess();
}

module.exports = PriorityInbox;
