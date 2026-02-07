# Nexora Widget Implementation Plan (Linux, Windows, Android, Apple)

## Goal
Ship read-only + quick-action widgets that surface `tasks`, `today events`, `wellness streak`, and `focus status` with consistent UX across platforms.

## Architecture
1. Create a `Widget Data API` in Nexora:
- Endpoint(s): `/api/widget/summary`, `/api/widget/tasks`, `/api/widget/wellness`.
- Auth: short-lived widget token scoped to read-only + selected quick actions.
- Cache: 1-5 minute cache window per user for battery/performance.

2. Add shared widget schema:
- JSON contract versioned with `version`.
- Sections: `tasks`, `calendar`, `wellness`, `focus`, `actions`.
- Include `updatedAt` and graceful fallback values.

3. Build platform adapters:
- Each native widget reads the same payload and maps to native UI components.

## Platform Plan
### Android (Jetpack Glance)
1. Use `GlanceAppWidget` + `WorkManager` refresh.
2. Support sizes: small, medium, large.
3. Quick actions via deep links to Nexora PWA routes.
4. Token stored in encrypted shared prefs.

### iOS + iPadOS (WidgetKit + AppIntents)
1. WidgetKit timeline provider with refresh every 15-60 minutes.
2. Families: `.systemSmall`, `.systemMedium`, `.systemLarge`.
3. AppIntent-based quick actions (complete task, start focus).
4. Keychain token storage and signed requests.

### macOS
1. Reuse WidgetKit extension from iOS.
2. Add desktop-specific layout for medium/large cards.
3. Deep links open Nexora in browser/PWA app wrapper.

### Windows
1. Use `Windows App SDK` + `AdaptiveCards` widget surface.
2. Poll Widget Data API with background task.
3. Handle sign-in handoff via browser OAuth + callback.
4. Add compact layout optimized for task list.

### Linux
1. Phase 1: Electron/Tauri mini-widget window (always-on-top optional).
2. Phase 2: GNOME/KDE plugin adapters if demand is high.
3. Reuse same widget schema and token auth.

## Delivery Phases
1. `Phase 0`:
- Finalize API schema + auth token flow.
- Implement `/api/widget/*` endpoints and contract tests.

2. `Phase 1`:
- Android + iOS MVP widgets (small/medium + deep links).
- Show tasks due today + streak + quick add.

3. `Phase 2`:
- macOS + Windows widget adapters.
- Add quick action confirmations and offline fallback state.

4. `Phase 3`:
- Linux mini-widget.
- Optional GNOME/KDE native shells if adoption justifies.

## Security + Privacy
1. Scoped widget token per device, revocable from Settings.
2. No sensitive free-text notes in widget payload by default.
3. Device-level lockscreen privacy mode (hide details, show counts only).

## QA Checklist
1. Token revoke/logout invalidates widget within one refresh cycle.
2. Widget refresh under poor network and offline conditions.
3. Timezone/date correctness for due dates and cycle predictions.
4. Accessibility: contrast, dynamic type scaling, screen reader labels.

## Success Metrics
1. Widget daily active users.
2. Widget quick-action conversion (open app, complete task).
3. Median refresh latency.
4. Crash-free rate for each platform extension.
