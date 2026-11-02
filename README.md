# Apartment Room Booking & Daily Availability Dashboard

A lightweight, responsive, and fully functional Apartment Room Booking and Availability Management Application built with **React**, **Vite**, **Tailwind CSS**, and **Firebase Firestore**.

---

## 🌟 Features

- **Live Status & Real-time Room Availability Dashboard**:
  - Color-coded room status:
    - 🟢 **Available** (Green)
    - 🔴 **Booked** (Red)
    - 🟠 **Cleaning** (Orange)
    - 🔵 **Checked In** (Blue)
    - ⚪ **Checked Out** (Grey)
  - Responsive 2-to-3 column grid on desktop, single-column on mobile.
  - Room cards with quick actions: *Book*, *Check-in*, *Check-out*, *Mark Cleaning*, *Set Ready*.
  - Status transitions strictly prevent overriding active bookings.

- **Dynamic Availability Calculation**:
  - Availability is computed dynamically using booking intervals and active state.
  - Future bookings do **not** prematurely block rooms before their check-in time.
  - After guest check-out, the room automatically transitions to **Cleaning** status.

- **Booking Management & Conflict Validation**:
  - Full booking workflow: Create, View, Edit, and Cancel bookings.
  - **Atomic conflict detection**: Prevents overlapping bookings for the same room.
  - Real-time client & store validation for dates, times, guest counts, and phone numbers.
  - Confirmation modals with optional cancellation reasons.

- **Daily Activity Dashboard & Timeline**:
  - Dedicated interactive date selector with quick **Today**, **Previous Day**, and **Next Day** buttons or custom calendar date.
  - **6 Key daily metrics**: Total Bookings, Check-ins Scheduled, Check-outs Scheduled, Currently Occupied Rooms, Available Rooms, Upcoming Arrivals.
  - **Chronological Activity Timeline**: Real-time events showing scheduled arrivals, departures, check-ins, check-outs, and housekeeping activities.

- **Dual-Mode Data Layer (Firebase Firestore + Local Reactive Store)**:
  - Connects to **Firebase Firestore** with real-time listeners (`onSnapshot`) and transactions.
  - Out of the box, includes an in-memory/localStorage reactive store pre-seeded with 10 sample rooms and bookings for immediate testing without manual setup!
  - Built-in UI modal to view or connect your Firebase credentials.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Firebase Setup (Optional for Live Multi-User Sync)

The application works instantly in local reactive mode. To connect your live Firebase Firestore project:

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database**.
3. Create a `.env` file in the root folder with your credentials (see `.env.example`):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*(Alternatively, click the **Local Data / Firestore** badge in the top dashboard header to input credentials directly into the UI!)*

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
    }
    match /bookings/{bookingId} {
      allow read, write: if true;
    }
    match /dailyActivities/{activityId} {
      allow read, write: if true;
    }
  }
}
```

---

## 📦 Deployment (Vercel)

1. Build the production bundle:
```bash
npm run build
```
2. Deploy to **Vercel**:
   - Install Vercel CLI: `npm i -g vercel` or push repository to GitHub/GitLab and import on [vercel.com](https://vercel.com).
   - Set framework preset to **Vite**.
   - Add environment variables in Vercel Project Settings if using Firebase.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: React Toastify (`react-toastify`)
- **Database**: Firebase Firestore
