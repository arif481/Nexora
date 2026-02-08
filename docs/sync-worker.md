# Integration Sync Worker

This worker processes queued sync jobs and imports pending payloads from `integrationSyncInbox` into Nexora collections.

## What It Handles

- Reads `integrationSyncJobs` where `status = queued`
- Claims one job at a time and marks it `running`
- Validates user permissions and provider connection status
- Imports inbox payloads by entity type:
  - `transaction` -> `transactions`
  - `wellnessSnapshot` -> `wellnessEntries`
  - `calendarEvent` -> `calendarEvents`
  - `task` -> `tasks`
- Upserts cross-system IDs in `integrationMappings`
- Writes logs to `integrationSyncLogs`
- Marks job `succeeded`, `partial`, or `failed`

## Runtime Commands

```bash
npm run sync:worker
```

Seed test payloads and queue a manual job:

```bash
npm run sync:seed -- <userId> [provider]
```

Examples:

```bash
npm run sync:seed -- abc123 mobileBridge
npm run sync:seed -- abc123 plaid
npm run sync:seed -- abc123 googleCalendar
```

## Environment Variables

Worker authentication (required in CI and local server environments):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Optional alternative in one secret:

- `FIREBASE_SERVICE_ACCOUNT_JSON`

Alternative local auth:

- `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string)
- or Application Default Credentials (`gcloud auth application-default login`)

Worker tuning:

- `SYNC_WORKER_MAX_JOBS` (default: `20`)
- `SYNC_WORKER_MAX_ITEMS_PER_JOB` (default: `150`)
- `SYNC_WORKER_INBOX_BATCH_SIZE` (default: `25`)

## GitHub Scheduled Worker

Workflow: `.github/workflows/sync-worker.yml`

- Runs every 15 minutes
- Supports manual run via Actions UI
- Requires either:
  - `FIREBASE_SERVICE_ACCOUNT_JSON`, or
  - `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
- `FIREBASE_PROJECT_ID` defaults to `nexora-400d6` in workflow, but can be overridden via secret

## Inbox Payload Shape

Document collection: `integrationSyncInbox`

Required fields:

- `userId: string`
- `provider: string`
- `entityType: 'transaction' | 'wellnessSnapshot' | 'calendarEvent' | 'task'`
- `payload: object`
- `status: 'pending' | 'processing' | 'processed' | 'failed'`
- `createdAt`

Optional fields:

- `externalId`, `checksum`, `source`, `syncJobId`, `error`, `processedAt`

## Notes

- This repo is static-exported (`next.config.js -> output: 'export'`), so the worker runs externally (GitHub Actions, VM, or server).
- For production ingestion from mobile/apps/webhooks, write payloads into `integrationSyncInbox` and queue `integrationSyncJobs`.
