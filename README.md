# 🚀 Jobie -- Smart Job Portal Platform

## 📌 Overview

Jobie is a full-stack Job Portal web application built using the MERN
Stack (MongoDB, Express.js, React.js, Node.js).

It connects Job Seekers and Recruiters through a secure, scalable, and
modern web platform. The system supports authentication, role-based
authorization, job management, resume uploads, and application tracking.

This project demonstrates real-world full-stack architecture and
production-ready backend design.

------------------------------------------------------------------------

## 🛠️ Tech Stack

### Frontend

-   React.js
-   Tailwind CSS
-   Axios
-   React Router DOM

### Backend

-   Node.js
-   Express.js
-   JWT Authentication
-   Multer (File Upload)

### Database

-   MongoDB (Mongoose ODM)

### Cloud & Tools

-   Cloudinary (Resume & Image Upload)
-   Postman (API Testing)

------------------------------------------------------------------------

## 👥 User Roles & Features

### 👤 Job Seeker

-   Register / Login
-   Create & Update Profile
-   Upload Resume (PDF)
-   Search & Filter Jobs
-   Apply to Jobs
-   Track Application Status
-   Bookmark Jobs

### 🏢 Recruiter

-   Recruiter Registration
-   Company Profile Management
-   Post / Edit / Delete Jobs
-   View Applicants
-   Accept / Reject Applications

### 🛡️ Admin

-   Manage Users
-   Manage Jobs
-   View Platform Analytics
-   Monitor Applications

------------------------------------------------------------------------

## ✨ Core Features

-   Secure JWT Authentication
-   Role-Based Access Control
-   Resume Upload System
-   Advanced Job Search & Filtering
-   Admin Dashboard with Analytics
-   Fully Responsive UI
-   MVC Architecture
-   RESTful API Structure

------------------------------------------------------------------------

## 📂 Project Structure

jobie/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── services/
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── config/
│
└── README.md

------------------------------------------------------------------------

## 🔐 Authentication Flow

1.  User registers or logs in\
2.  Credentials validated on server\
3.  JWT token generated\
4.  Token stored securely\
5.  Access granted to protected routes

------------------------------------------------------------------------

## 🗄️ Database Collections

### User

-   name
-   email
-   password (hashed)
-   role (jobseeker / recruiter / admin)
-   skills
-   resume
-   profilePhoto

### Job

-   title
-   description
-   salary
-   location
-   company
-   createdBy

### Application

-   userId
-   jobId
-   status (applied / accepted / rejected)

------------------------------------------------------------------------

## 🚀 Installation & Setup

### 1️⃣ Clone Repository

git clone https://github.com/yourusername/jobie.git cd jobie

### 2️⃣ Backend Setup

cd backend npm install npm run dev

### 3️⃣ Frontend Setup

cd frontend npm install npm start

------------------------------------------------------------------------

## 🔮 Future Enhancements

-   Real-time Notifications (Socket.io)
-   Email Notifications
-   AI Resume Matching
-   Recruiter--Applicant Chat
-   Multi-language Support

------------------------------------------------------------------------
