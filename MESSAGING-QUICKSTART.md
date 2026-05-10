# 🎯 Quick Start: Messaging System

## TL;DR - How Communication Works

### For Candidates:
1. **Apply to a job** → Recruiter automatically added to your contacts
2. **Go to Messages** (`/candidate/messages`)
3. **Click on recruiter** → Chat window opens
4. **Send message** → Recruiter receives it instantly

### For Recruiters:
1. **Candidate applies to your job** → They automatically appear in your contacts
2. **Go to Messages** (`/recruiter/messages`)
3. **Click on candidate** → Chat window opens
4. **Send message** → Candidate receives it instantly

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    JOBIE MESSAGING SYSTEM                    │
└─────────────────────────────────────────────────────────────┘

CANDIDATE SIDE                          RECRUITER SIDE
─────────────────────────────────────────────────────────────

Alice (Candidate)                       Bob (Recruiter @ TechCorp)
     │                                           │
     │  1. Applies to                            │
     │  "Backend Developer" job ─────────────────▶ Job Posted
     │                                           │
     │  ✅ Application Created                   │
     │                                           │
     │  ┌─────────────────────────┐              │
     │  │ Stream Channel Created  │              │
     │  │ ID: job-123-r456-c789   │              │
     │  └─────────────────────────┘              │
     │                                           │
     ▼                                           ▼
┌──────────────────────┐              ┌──────────────────────┐
│ /candidate/messages  │              │ /recruiter/messages  │
├──────────────────────┤              ├──────────────────────┤
│                      │              │                      │
│ CONTACTS:            │              │ CONTACTS:            │
│ ┌─────────────────┐  │              │ ┌─────────────────┐  │
│ │ ▶ Bob (TechCorp)│  │              │ │ ▶ Alice         │  │
│ │   Backend Dev   │  │              │ │   Backend Dev   │  │
│ │   Status: Applied│  │              │ │   Status: Applied│  │
│ └─────────────────┘  │              │ └─────────────────┘  │
│                      │              │                      │
└──────────────────────┘              └──────────────────────┘
     │                                           │
     │  2. Clicks on Bob                         │
     │                                           │
     ▼                                           ▼
┌──────────────────────┐              ┌──────────────────────┐
│ CHAT WITH BOB        │              │ CHAT WITH ALICE      │
├──────────────────────┤              ├──────────────────────┤
│                      │              │                      │
│ Alice: Hi Bob! I'm   │◀────────────▶│ Alice: Hi Bob! I'm   │
│ excited about this   │  REAL-TIME   │ excited about this   │
│ role...              │              │ role...              │
│                      │              │                      │
│ Bob: Hi Alice!       │◀────────────▶│ Bob: Hi Alice!       │
│ Great to hear...     │  INSTANT     │ Great to hear...     │
│                      │              │                      │
│ [Type message...]    │              │ [Type message...]    │
└──────────────────────┘              └──────────────────────┘
     │                                           │
     │  ✅ Messages delivered instantly          │
     │  ✅ Read receipts shown                   │
     │  ✅ Typing indicators visible             │
     └───────────────────┬───────────────────────┘
                         │
                    STREAM CHAT
                   (Real-time sync)
```

---

## Real Example Walkthrough

### Scenario: Alice applies to Bob's job

**Step 1: Alice browses jobs**
```
Alice visits: /candidate/dashboard
Sees: "Backend Developer at TechCorp"
Match Score: 85%
Clicks: "Apply Now"
```

**Step 2: Application created**
```
Database:
- Application record created
- Status: "applied"
- jobId: 123
- candidateId: 789 (Alice)
- recruiterId: 456 (Bob)
```

**Step 3: Stream channel auto-created**
```
Backend automatically creates:
- Channel ID: job-123-r456-c789
- Members: user-789 (Alice), user-456 (Bob)
- Channel data: {jobTitle: "Backend Developer", company: "TechCorp"}
```

**Step 4: Alice sees Bob in contacts**
```
Alice goes to: /candidate/messages
Contacts list shows:
┌─────────────────────────────────┐
│ Bob Johnson                     │
│ TechCorp                        │
│ Backend Developer               │
│ Status: Applied • 5 min ago     │
└─────────────────────────────────┘
```

**Step 5: Bob sees Alice in contacts**
```
Bob goes to: /recruiter/messages
Contacts list shows:
┌─────────────────────────────────┐
│ Alice Smith                     │
│ alice@example.com               │
│ Backend Developer               │
│ Applied • 5 min ago             │
└─────────────────────────────────┘
```

**Step 6: Alice sends first message**
```
Alice clicks on Bob's contact
Chat window opens
Alice types: "Hi Bob! I'm very excited about the Backend Developer role at TechCorp. I have 5 years of experience with Node.js and React..."
Clicks Send
```

**Step 7: Bob receives instantly**
```
Bob's browser shows notification
Message appears in real-time
Bob sees: "Alice is typing..." (typing indicator)
Bob's contact list shows: "1 unread message" badge
```

**Step 8: Bob replies**
```
Bob clicks on Alice's contact
Chat window opens
Bob types: "Hi Alice! Thanks for applying. Your experience looks great! Would you be available for a quick call tomorrow at 2 PM?"
Clicks Send
```

**Step 9: Alice receives instantly**
```
Alice's browser shows notification
Message appears in real-time
Chat continues in real-time...
```

---

## Access URLs

### Development
- **Candidate Messages**: `http://localhost:3000/candidate/messages`
- **Recruiter Messages**: `http://localhost:3000/recruiter/messages`

### Production (when deployed)
- **Candidate Messages**: `https://yourdomain.com/candidate/messages`
- **Recruiter Messages**: `https://yourdomain.com/recruiter/messages`

---

## Quick Test Instructions

### Test in 5 Minutes:

1. **Start the app**
   ```bash
   # Terminal 1 - Backend
   cd E:\Projects\jobie\backend
   npm run dev

   # Terminal 2 - Frontend
   cd E:\Projects\jobie\frontend
   npm run dev
   ```

2. **Open two browser windows**
   - Window 1: Chrome (Candidate)
   - Window 2: Chrome Incognito (Recruiter)

3. **Window 1: Login as Candidate**
   - Go to: `http://localhost:3000/login`
   - Login with candidate account
   - Apply to any job
   - Go to: `/candidate/messages`

4. **Window 2: Login as Recruiter**
   - Go to: `http://localhost:3000/login`
   - Login with recruiter account (who posted that job)
   - Go to: `/recruiter/messages`

5. **Send messages back and forth!**
   - Both windows update in real-time
   - Try typing to see typing indicators
   - Send messages to see instant delivery

---

## Key Features Summary

| Feature | Candidates | Recruiters |
|---------|-----------|-----------|
| **See contacts** | ✅ Recruiters they applied to | ✅ Candidates who applied |
| **Send messages** | ✅ To their recruiters | ✅ To their candidates |
| **Real-time sync** | ✅ Instant delivery | ✅ Instant delivery |
| **Read receipts** | ✅ See when read | ✅ See when read |
| **Typing indicators** | ✅ See when typing | ✅ See when typing |
| **Message history** | ✅ All past messages | ✅ All past messages |
| **Auto-contact creation** | ✅ On job application | ✅ On receiving application |

---

## Privacy Rules

**✅ Allowed:**
- Candidate can message recruiters for jobs they applied to
- Recruiter can message candidates who applied to their jobs

**❌ Not Allowed:**
- Candidate cannot message random recruiters
- Recruiter cannot message random candidates
- Users cannot message people they haven't interacted with via applications

**This ensures professional, context-appropriate communication!**

---

## Common Questions

**Q: When do contacts appear?**
A: Immediately after a candidate applies to a job.

**Q: Can I delete messages?**
A: Currently no, but can be implemented.

**Q: Are messages encrypted?**
A: Yes, Stream Chat uses TLS encryption.

**Q: What if I apply to multiple jobs from same recruiter?**
A: Each job creates a separate channel/conversation.

**Q: Can I share files?**
A: Yes, Stream Chat supports file attachments (can be enabled).

**Q: Do messages work offline?**
A: Messages are sent when you're back online (Stream handles queuing).

**Q: Can I see when someone is online?**
A: Presence indicators can be enabled in Stream Chat.

---

**The messaging system is fully functional with your Stream API key! Both candidates and recruiters can communicate perfectly.** 💬✨
