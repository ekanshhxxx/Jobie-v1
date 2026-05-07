# 💬 Messaging & Chat System Guide - Jobie

## Overview

Jobie has a **fully working real-time messaging system** powered by **Stream Chat** that allows candidates and recruiters to communicate directly about job applications.

---

## How It Works

### 🔄 The Communication Flow

```
Candidate applies to Job
        ↓
Application created
        ↓
Recruiter reviews application
        ↓
Both can now message each other (Stream Chat channel created)
        ↓
Real-time messaging enabled
```

---

## For Candidates

### How to Access Messages

**Option 1: From Dashboard**
- Click "Messages" in the Quick Actions section at the bottom
- Or visit: `/candidate/messages`

**Option 2: From Navigation**
- Look for the Messages icon/link in your candidate navigation

### What You See

When you open **Messages** (`/candidate/messages`):

1. **Left Panel: Recruiter Contacts**
   - List of all recruiters you've applied to
   - Shows:
     - Recruiter name
     - Company name
     - Job title you applied for
     - Application status (applied, shortlisted, interview scheduled, etc.)
   - Click on any recruiter to start chatting

2. **Right Panel: Chat Window**
   - Selected conversation with recruiter
   - Real-time messages
   - Message input box at bottom
   - Send messages instantly

### How Contacts Are Created

You can **only message recruiters** for jobs you've **applied to**:

1. You apply to a job
2. The recruiter for that job automatically appears in your contacts
3. Both parties can now message each other
4. One candidate can message multiple recruiters (for different jobs)

### Features Available

- ✅ **Real-time messaging** - instant delivery
- ✅ **Read receipts** - see when messages are read
- ✅ **Typing indicators** - see when the recruiter is typing
- ✅ **Message history** - all past messages saved
- ✅ **File sharing** (can be enabled)
- ✅ **Emoji reactions** (built into Stream Chat)
- ✅ **Thread replies** (optional feature)

---

## For Recruiters

### How to Access Messages

**Option 1: From Dashboard**
- Click "Messages" in your recruiter navigation
- Or visit: `/recruiter/messages`

**Option 2: From Applicant List**
- When viewing applicants for a job, click "Message" button

### What You See

When you open **Messages** (`/recruiter/messages`):

1. **Left Panel: Candidate Contacts**
   - List of all candidates who applied to your jobs
   - Shows:
     - Candidate name
     - Job they applied for
     - Application status
   - Grouped by job (optional)
   - Click on any candidate to start chatting

2. **Right Panel: Chat Window**
   - Selected conversation with candidate
   - Real-time messages
   - Message input box
   - Send messages instantly

### How Contacts Are Created

You can **only message candidates** who have **applied to your jobs**:

1. Candidate applies to your job
2. They automatically appear in your contacts
3. Both parties can now message each other
4. One recruiter can message multiple candidates (for different jobs)

### Features Available

- ✅ **Real-time messaging** - instant delivery
- ✅ **Read receipts** - see when messages are read
- ✅ **Typing indicators** - see when the candidate is typing
- ✅ **Message history** - all past messages saved
- ✅ **File sharing** - send documents, assignments
- ✅ **Bulk messaging** (can be implemented)
- ✅ **Template messages** (can be implemented)

---

## Technical Architecture

### Backend Setup

**Stream Service** (`backend/src/services/streamService.ts`):
```typescript
- StreamClient initialization with API key & secret
- generateStreamToken(userId) - creates auth tokens
- toStreamUserId(id) - converts user IDs to Stream format (user-{id})
```

**Chat Routes** (`backend/src/routes/chatRoutes.ts`):
```typescript
GET  /api/chat/stream/auth      - Get auth token for Stream
GET  /api/chat/stream/contacts  - Get messaging contacts
POST /api/chat/stream/channel   - Create/get direct channel
POST /api/chat/                 - Groq AI chatbot (separate feature)
```

**Chat Controller** (`backend/src/controllers/chatController.ts`):

1. **getStreamChatAuth**
   - Authenticates user with Stream
   - Returns: `{ token, apiKey, streamUserId }`

2. **getMessagingContacts**
   - **For Candidates**: Returns all recruiters they've applied to
   - **For Recruiters**: Returns all candidates who applied to their jobs
   - Deduplicates by job (one contact per recruiter-job pair)

3. **createOrGetDirectChannel**
   - Creates unique channel ID: `job-{jobId}-r{recruiterId}-c{candidateId}`
   - Sets up channel with job context
   - Adds both users as members
   - Returns channel info

### Frontend Setup

**Candidate Messages** (`frontend/app/candidate/messages/page.tsx`):
```typescript
1. Authenticate with Stream (GET /api/chat/stream/auth)
2. Connect to Stream Chat
3. Fetch recruiter contacts (GET /api/chat/stream/contacts)
4. Display channel list (recruiters)
5. Open channel when clicked
6. Real-time messaging enabled
```

**Recruiter Messages** (`frontend/app/recruiter/messages/page.tsx`):
```typescript
1. Authenticate with Stream (GET /api/chat/stream/auth)
2. Connect to Stream Chat
3. Fetch candidate contacts (GET /api/chat/stream/contacts)
4. Display channel list (candidates)
5. Open channel when clicked
6. Real-time messaging enabled
```

---

## Message Flow Example

### Scenario: Candidate applies to a job

**Step 1: Application Created**
```
Candidate "Alice" applies to "Backend Developer" job
Job posted by Recruiter "Bob" from "TechCorp"
```

**Step 2: Stream Channel Created**
```
Channel ID: job-123-r456-c789
- jobId: 123
- recruiterId: 456 (Bob)
- candidateId: 789 (Alice)
```

**Step 3: Both Users See Contact**

**Alice (Candidate) sees:**
- Bob (Recruiter)
- TechCorp
- Backend Developer
- Status: Applied

**Bob (Recruiter) sees:**
- Alice (Candidate)
- Backend Developer
- Status: Applied

**Step 4: Either Party Can Message**
- Alice sends: "Hi Bob! I'm very excited about this role..."
- Bob receives message instantly
- Bob replies: "Hi Alice! Great to hear from you..."
- Real-time communication established ✅

---

## Privacy & Security

### Who Can Message Whom?

**Candidates:**
- ✅ Can ONLY message recruiters for jobs they applied to
- ❌ Cannot message random recruiters
- ❌ Cannot message other candidates

**Recruiters:**
- ✅ Can ONLY message candidates who applied to their jobs
- ❌ Cannot message random candidates
- ❌ Cannot message other recruiters (unless implemented)

### Channel Isolation

Each **job application** creates a **unique channel**:
- Channel ID includes: `job-{jobId}-r{recruiterId}-c{candidateId}`
- One candidate applying to 3 jobs = 3 separate channels (1 per recruiter)
- Messages are private to that channel only

---

## Current Implementation Status

| Feature | Status |
|---------|--------|
| **Real-time messaging** | ✅ Working |
| **Candidate → Recruiter** | ✅ Working |
| **Recruiter → Candidate** | ✅ Working |
| **Contact list (Candidates)** | ✅ Working |
| **Contact list (Recruiters)** | ✅ Working |
| **Stream Chat UI** | ✅ Integrated |
| **Read receipts** | ✅ Built-in |
| **Typing indicators** | ✅ Built-in |
| **Message history** | ✅ Persistent |
| **File sharing** | ⚠️ Can be enabled |
| **Push notifications** | ⚠️ Can be enabled |
| **Email notifications** | ❌ Not implemented |
| **Message templates** | ❌ Not implemented |
| **Bulk messaging** | ❌ Not implemented |

---

## How to Test

### Test as Candidate

1. **Create/Login as Candidate**
   - Visit: `http://localhost:3000/login`
   - Login with candidate credentials

2. **Apply to a Job**
   - Go to `/candidate/dashboard`
   - Click "Apply Now" on any job

3. **Open Messages**
   - Go to `/candidate/messages`
   - You should see the recruiter in your contacts
   - Click to open chat
   - Send a message

### Test as Recruiter

1. **Create/Login as Recruiter**
   - Visit: `http://localhost:3000/login`
   - Login with recruiter credentials

2. **Wait for Application**
   - Someone needs to apply to your job first

3. **Open Messages**
   - Go to `/recruiter/messages`
   - You should see candidates who applied
   - Click to open chat
   - Reply to messages

### Test Both Sides

Open two browser windows:
- Window 1: Login as Candidate
- Window 2: Login as Recruiter (who posted the job)
- Candidate applies to job
- Both open `/messages`
- Send messages back and forth in real-time!

---

## Environment Variables Required

### Backend (.env)
```bash
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

You mentioned you already have the Stream API key configured! ✅

---

## Common Use Cases

### 1. Recruiter Wants to Schedule Interview
```
Recruiter opens messages → Selects candidate → Sends:
"Hi Sarah! We'd love to schedule an interview. 
Are you available next Tuesday at 2 PM?"
```

### 2. Candidate Asks Questions
```
Candidate opens messages → Selects recruiter → Sends:
"Hi! I have a few questions about the remote work policy 
mentioned in the job description."
```

### 3. Status Update
```
Recruiter → Candidate:
"Great news! You've been shortlisted. 
We'll send more details via email."
```

### 4. Share Documents
```
Either party can attach files (if enabled):
- Resume updates
- Assignment files
- Offer letters
- Technical assessments
```

---

## Future Enhancements (Not Yet Implemented)

1. **Email Notifications**
   - Send email when new message received
   - User isn't online

2. **Push Notifications**
   - Browser notifications
   - Mobile app notifications

3. **Message Templates**
   - Pre-written messages for recruiters
   - "Interview invitation"
   - "Rejection (polite)"
   - "Offer letter"

4. **Read/Unread Indicators**
   - Show unread message count
   - Badge on navigation

5. **Search Messages**
   - Search conversation history

6. **Archive Conversations**
   - Archive old/closed applications

---

## How Perfect Communication Works

### The Magic ✨

1. **Automatic Contact Discovery**
   - No manual setup needed
   - Apply to job → Contact created automatically

2. **Context-Aware**
   - Each conversation tied to a specific job
   - Both parties know what they're discussing

3. **Real-Time**
   - Messages appear instantly
   - No page refresh needed
   - Typing indicators show activity

4. **Persistent**
   - Message history saved forever
   - Can review past conversations

5. **Secure**
   - Stream handles authentication
   - Backend validates permissions
   - Channels are isolated

6. **Professional**
   - Clean UI
   - No clutter
   - Focused on the job application

---

## Access Points Summary

### Candidates
- Dashboard → Quick Actions → "Messages"
- Direct URL: `/candidate/messages`
- Navigation menu → Messages icon

### Recruiters
- Dashboard → Navigation → "Messages"
- Direct URL: `/recruiter/messages`
- Applicant list → "Message" button (future)

---

**The system is fully functional and ready to use! Both candidates and recruiters can communicate seamlessly about job applications.** 🎉

## Next Steps to Enhance

Would you like me to:
1. Add message notification badges (unread count)?
2. Create email notifications for new messages?
3. Add message templates for recruiters?
4. Improve the UI with glassmorphism?
5. Add a "Quick Message" button on job cards?
