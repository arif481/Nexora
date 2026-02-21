# Contributing to Nexora

Thank you for your interest in contributing to Nexora! Nexora is an intelligent life operating system built to leverage modern AI to streamline everyday tasks, journaling, finance, and wellness tracking. 

We welcome contributions of all kinds, including bug reports, feature requests, documentation improvements, and code changes!

## Getting Started

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn
- Firebase account
- Google Gemini API Key

### 2. Fork & Clone
Fork the repository to your own GitHub account, then clone it to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/Nexora.git
cd Nexora
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment Variables
Copy `.env.example` to `.env.local` and add your keys (Firebase config, Gemini, TMDB, Google OAuth, etc.).

### 5. Running the Project
```bash
npm run dev
```

The application will be running at `http://localhost:3000`.

## Branching Strategy

- `main` is the primary stable branch.
- Feature branches should be branched off `main`.
- Branch naming convention: `feature/your-feature-name`, `bugfix/issue-description`, `docs/what-you-changed`.

## Developing

1. Create a new branch: `git checkout -b feature/amazing-feature`.
2. Make your amazing changes.
3. Write/update tests if applicable.
4. Ensure the type-checker and linter pass: 
    ```bash
    npm run type-check
    npm run lint
    ```
5. Commit your changes following the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

## Pull Requests

1. Push your branch to your fork: `git push origin feature/amazing-feature`.
2. Open a Pull Request on the main repository comparing against `main`.
3. Provide a clear description of the problem you solved or the feature you added. Fill out the PR template.
4. Link any related issues within the PR description (e.g., `Closes #123`).
5. A maintainer will review your PR and provide feedback. Once approved, it will be merged into `main`.

## Code Style

This project follows consistent formatting and linting rules:
- **TypeScript**: We enforce strict typing. Avoid `any` whenever possible.
- **Styling**: We use Tailwind CSS. Complex classes should be abstracted using the `cn()` utility found in `src/lib/utils.ts`.
- **Components**: Use functional components and React Hooks. Keep components small, reusable, and focused on a single responsibility.

Thank you for helping make Nexora better! 🚀
