# ⚽ JackScores - Live Football Scores Web App

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Render](https://img.shields.io/badge/Render-%2346E3B7.svg?style=for-the-badge&logo=render&logoColor=white)

A modern, responsive web application for tracking live football scores, schedules, and match highlights. This project uses a custom Node.js backend to fetch and cache real-time data from professional football APIs.

## 🟢 Live Demo

👉 **View the live application here:** [https://jackscores.onrender.com](https://jackscores.onrender.com)

## 🚀 Key Features

* **Real-Time Scores:** Live match tracking with automatic data refreshing every 60 seconds.
* **Dynamic Categories:** Seamless navigation between "Past Results", "Live Now", and "Upcoming Matches".
* **Match Highlights:** Integration with ScoreBat API to provide high-quality video highlights for finished matches.
* **Smart Backend Caching:** Optimized server-side caching to reduce API latency and manage rate limits efficiently.
* **Fully Responsive:** Designed with a mobile-first approach using modern CSS Grid and Flexbox layouts.

## 🛠️ Tech Stack

* **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Variables & Keyframe Animations).
* **Backend:** Node.js, Express.js.
* **APIs:** Football-Data.org (Scores) and ScoreBat (Video Highlights).
* **Hosting:** Deployed on Render (Web Service for API & Static Site for Frontend).

## ⚙️ Installation & Setup

To run this project locally, follow these steps:

1. **Clone the repository:**

    git clone https://github.com/kt0skk0s/JackScores.git

2. **Install dependencies:**

    npm install

3. **Setup Environment Variables:**
   Create a .env file in the root directory and add your API Key:

    API_KEY=your_api_key_here

4. **Start the server:**

    node server.js

## 📂 Project Structure

* server.js: Express server with caching logic and API proxy.
* app.js: Main frontend logic, API fetching, and DOM manipulation.
* style.css: Modern dark-theme styling and responsive layouts.
* index.html: Home page displaying live and today's matches.

---
*Created by Kyriacos Tsokkos (kt0skk0s) - Driven by a passion for football and clean code.*
