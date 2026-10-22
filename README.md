<h1 align="center">Nexora</h1>

<p align="center">
  A personal assistant that keeps tasks, calendar, notes, habits, money, meals and wellness in one app, with Gemini doing the parsing and the chat.
  <br />
  <a href="https://arif481.github.io/Nexora/"><strong>Live app</strong></a>
</p>

## Features

The dashboard shows the day's tasks and events with a short AI summary. Around it:

- tasks with priorities and suggested next actions
- a calendar synced with Google Calendar
- rich-text notes, and a journal with mood tracking and sentiment analysis of entries
- habits with streaks, and goals broken into milestones
- a Pomodoro focus timer with ambient sounds
- flashcards with spaced repetition
- expense tracking with currency conversion and receipt scanning through Gemini's vision model
- sleep, activity and nutrition logs
- a meal planner that pulls a recipe from a URL and builds a grocery list
- a bookmarklet that saves the current page into Nexora, with film, TV and book details filled in from TMDB and Open Library
- AI chat on Gemini 2.5 Flash, falling back to Gemini 2.0 Flash-Lite

## Tech stack

Next.js 14 (App Router), React 18 and TypeScript, Tailwind CSS, Zustand, Framer Motion, Firebase (Auth, Firestore, Storage) and the Google Gemini API.

## Running it locally

You need Node.js 18 or newer, a Firebase project and a Gemini API key. The TMDB key and Google Calendar OAuth client are only needed for those features.

```bash
git clone https://github.com/arif481/Nexora.git
cd Nexora
npm install
cp .env.example .env.local   # add your Firebase, Gemini, TMDB and Google OAuth values
npm run dev
```

Then open http://localhost:3000.

## Contributing

Bug reports and pull requests are welcome.

## License

[MIT](LICENSE)
