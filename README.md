# CampusHive - Smart Campus Event Management System

CampusHive is a comprehensive, centralized event management platform built for university campuses. 
It features a distinct cyberpunk-inspired "Stitch" UI aesthetic and provides a robust, role-based system for Students, Organizers, and Administrators to streamline event discovery, registration, and management.

## 🚀 Key Features

### Role-Based Access Control
- **Students**: Discover events via a tailored "For You" feed, register, check in using auto-generated mobile QR codes, and earn digital certificates.
- **Organizers (Clubs, Faculty, Departments)**: Propose events, manage attendee lists, and scan student QR codes for fast attendance tracking.
- **Admin**: Oversee the entire platform, review and approve/reject event proposals, manage user accounts, and view system-wide analytics.

### Smart Features
- **Conflict Prevention Engine**: Automatically prevents double-booking of venues and overlapping schedules during event creation.
- **QR Code Check-in System**: Secure, instant check-in at venues to streamline event entry and accurately track attendance.
- **Automated Certificate Generation**: Issues PDF certificates to attendees who have successfully checked in and completed the event.
- **Event Recommendations**: Suggests events to students based on their past registrations and stated interests.

## 🛠️ Technology Stack
- **Frontend**: React.js, Tailwind CSS (Stitch UI styling), Framer Motion, Zustand (State Management), React Router.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ORM).
- **Other Services**: JWT Authentication, PDFKit (Certificates), QRCode (Check-in), Nodemailer (Emails/Password Reset), Html5-Qrcode (Scanner).

## 📂 Project Structure
This repository contains two main directories:
- `/client`: The complete React frontend application.
- `/server`: The Express/Node.js backend REST API.

---

## 💻 Running Locally

### Prerequisites
- Node.js (v16+)
- MongoDB (Running locally or via MongoDB Atlas)

### 1. Setup Backend
1. Open a terminal and navigate to the \`server\` directory:
   \`\`\`bash
   cd server
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a \`.env\` file in the \`server\` root with the following variables:
   \`\`\`env
   PORT=4000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:5173
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   \`\`\`
4. Run the development server (runs with nodemon):
   \`\`\`bash
   npm run dev
   \`\`\`

### 2. Setup Frontend
1. Open a new terminal and navigate to the \`client\` directory:
   \`\`\`bash
   cd client
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Run the React development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. View the application at \`http://localhost:5173\` (or whichever port Vite defaults to).

---

## 🎨 Design System

**CampusHive** utilizes a custom implementation of the "Stitch" UI design system. Key characteristics include:
- Deep dark slate backgrounds mixed with stark, vibrant accents (\`primary\` blue, success \`green\`, warning \`yellow\`, error \`red\`).
- Clean, blocky cards with subtle borders.
- Material Symbols Outlined for sharp, scalable iconography.
- Micro-interactions powered by Framer Motion (hover states, smooth entrance animations).
- Strong typographic hierarchy using 'Public Sans' and 'Inter' fonts.
