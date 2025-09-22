# TO‑DO

A clean and simple React + Firebase task manager for creating, organizing, and tracking tasks in real time.

---

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Quickstart](#quickstart)
* [Project Structure](#project-structure)
* [Usage](#usage)
* [Deployment](#deployment)
* [License](#license)

---

## Overview

**TO‑DO** is a React‑based task management app that provides user authentication, real‑time task updates, and drag‑and‑drop reordering. It is built with Firebase for backend services and React for the user interface.

---

## Features

* User authentication (Firebase Auth)
* Add, edit, and delete tasks
* Drag‑and‑drop task reordering
* Real‑time sync with Firestore
* Modular UI components (AddTaskModal, Avatar, SortableTaskItem, TaskSkeleton)
* Basic performance monitoring

---

## Quickstart

1. **Clone the repo**

   ```bash
   git clone https://github.com/<your-username>/to-do.git
   cd to-do
   ```
2. **Install dependencies**

   ```bash
   npm install
   ```
3. **Setup Firebase config** → Create `.env.local` file in project root:

   ```dotenv
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=yourapp.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=yourapp.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxxxx
   VITE_FIREBASE_APP_ID=xxxxxxx
   ```
4. **Run app locally**

   ```bash
   npm start
   ```

---

## Project Structure

```
to-do/
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ AddTaskModal.js
│  │  ├─ Avatar.js
│  │  ├─ SortableTaskItem.js
│  │  └─ TaskSkeleton.js
│  ├─ App.js
│  ├─ App.css
│  ├─ App.test.js
│  ├─ firebase.js
│  ├─ index.js
│  ├─ index.css
│  ├─ logo.svg
│  ├─ reportWebVitals.js
│  └─ setupTests.js
├─ package.json
└─ README.md
```

---

## Usage

1. Sign in with Firebase Auth (Google or Email/Password). (Soon)
2. Create a task list and add tasks.
3. Drag and drop tasks to reorder.
4. Update task details or delete when done.

---

## Deployment

### Vercel

* Push repo to GitHub/GitLab/Bitbucket
* Import repo into Vercel
* Add environment variables
* Deploy

### Firebase Hosting

```bash
npm run build
firebase deploy
```

---

## License

MIT License
