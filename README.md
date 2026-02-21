<br/>
<p align="center">
  <h1 align="center">Nexora</h1>
  <p align="center">
    <strong>Futuristic AI Personal Assistant - Your Intelligent Life Operating System</strong>
  </p>
  <p align="center">
    <a href="https://github.com/arif481/Nexora/issues">
      <img src="https://img.shields.io/github/issues/arif481/Nexora.svg?style=for-the-badge&color=00e5ff" alt="Issues" />
    </a>
    <a href="https://github.com/arif481/Nexora/pulls">
      <img src="https://img.shields.io/github/issues-pr/arif481/Nexora.svg?style=for-the-badge&color=00e5ff" alt="Pull Requests" />
    </a>
    <a href="https://github.com/arif481/Nexora/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/arif481/Nexora.svg?style=for-the-badge" alt="License" />
    </a>
  </p>
</p>

---

## 🚀 Overview

**Nexora** is a state-of-the-art AI-powered personal assistant application built to streamline your daily life. It serves as an intelligent life operating system, seamlessly integrating task management, advanced scheduling, media planning, smart journaling, wellness tracking, and native AI chat capabilities.

Built with **Next.js 14**, **React 18**, **TypeScript**, and **Firebase**, Nexora delivers a lightning-fast, highly responsive, and beautiful dark-themed neon user interface inspired by futuristic sci-fi aesthetics.

## ✨ Key Features

*   📊 **Dashboard**: High-level overview of your day with actionable AI insights.
*   ✅ **Smart Tasks**: Intelligent task management with priority sorting and automated suggestions.
*   📅 **Calendar & Sync**: Event scheduling seamlessly integrated with Google/Apple calendars.
*   📝 **Rich Notes**: WYSIWYG note-taking and knowledge organization.
*   📔 **Journal**: Daily journaling paired with sentiment analysis and mood tracking.
*   🎯 **Habit Tracker**: Build consistency with gamified streaks and visual tracking.
*   🧘 **Focus Mode**: Built-in Pomodoro timer featuring ambient sounds and automated DND.
*   📚 **Study/Flashcards**: Spaced repetition learning system.
*   🏆 **Goal Tracking**: Long-term goal mapping with hierarchical milestones.
*   💰 **Finance Dashboard**: AI-powered receipt scanning (`Gemini Vision`), currency conversion, and expense tracking.
*   ❤️ **Wellness**: Health metric tracking including sleep, activity, and nutrition.
*   🍳 **Meal Planner**: Gemini-powered recipe extraction from URLs and automated grocery list generation.
*   🤖 **Integrated AI & Auto-Collection**: 
    * Gemini 1.5 Flash integrated natively for chat and data parsing.
    * 1-click Quick Capture Bookmarklet.
    * Auto-parsing of TMDB & Open Library metadata for entertainment.

## 🛠 Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
*   **UI Library**: [React 18](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom neon design system
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **AI Integration**: [Google Gemini API](https://ai.google.dev/)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
*   [Node.js](https://nodejs.org/en/) (v18.0.0 or higher)
*   npm or yarn or pnpm
*   A Firebase project
*   Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/arif481/Nexora.git
    cd Nexora
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Copy the sample environment file and configure it with your credentials:
    ```bash
    cp .env.example .env.local
    ```
    *Open `.env.local` and add your Firebase credentials and APIs (TMDB, Google Calendar OAuth, Gemini API).*

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing

We welcome contributions from the community! From bug reports to feature requests to pull requests, any contribution is appreciated.

Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started, our commit conventions, and the pull request process.

Please ensure you adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<p align="center">Crafted with ❤️ for productivity and the future.</p>
