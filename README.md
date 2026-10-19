<h1 align="center">Nexora</h1>

<p align="center">
  A personal assistant that keeps tasks, calendar, notes, habits, money, meals and wellness in one app, with Gemini doing the parsing and the chat.
  <br />
  <a href="https://iamarif.me/Nexora/"><strong>Live app</strong></a>
</p>

## Features

- **Dashboard** with the day's tasks, events and a short AI summary.
- **Tasks** with priorities and suggested next actions.
- **Calendar** synced with Google Calendar.
- **Notes** in a rich-text editor.
- **Journal** with mood tracking and sentiment analysis of entries.
- **Habits** with streaks.
- **Focus mode**: a Pomodoro timer with ambient sounds.
- **Study**: flashcards with spaced repetition.
- **Goals** broken into milestones.
- **Finance**: expense tracking, currency conversion, and receipt scanning with Gemini's vision model.
- **Wellness**: sleep, activity and nutrition logs.
- **Meal planner** that pulls recipes from a URL and builds a grocery list.
- **Quick capture**: a bookmarklet that saves the current page into Nexora, and automatic film, TV and book details from TMDB and Open Library.
- **AI chat** on Gemini 2.5 Flash, falling back to Gemini 2.0 Flash-Lite.

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

Bug reports and pull requests are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers the commit conventions and review process, and the project follows a [code of conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
