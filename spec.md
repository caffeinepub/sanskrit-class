# Sanskrit Class

## Current State

The app has a teacher portal (Tests page) where the teacher can create tests by uploading a question paper (PDF/image) and setting a title, start time, and duration. The upload flow uses a `StorageClient` that:
1. Calls `_caffeineStorageCreateCertificate` on the backend actor to get an upload certificate
2. Uses the certificate to upload file chunks to the storage gateway

The `useStorageClient` hook creates a new `StorageClient` whenever `identity` changes, but is **not** tied to actor readiness. The `useActor` hook calls `_initializeAccessControlWithSecret` after login before the actor is considered ready — but the `storageClient` can be used before this initialization completes, causing the certificate call to fail with a permissions/access error.

Additionally, in `TestsPage.tsx`, the `handleCreate` function wraps the entire upload+create flow but the error messages may not surface clearly enough to diagnose what's failing.

## Requested Changes (Diff)

### Add
- A `useActorReady` export from `useActor.ts` (or inline check) so the `useStorageClient` hook can verify the actor is fully initialized before allowing uploads

### Modify
- `useStorageClient.ts`: Gate the returned `StorageClient` on actor readiness (not just identity presence). Return `null` until the actor is both present and not fetching, so `storageClient` is only non-null when safe to use.
- `TestsPage.tsx`: Improve error surfacing — show the actual caught error message in toast so debugging is easier. Also disable the submit button more clearly when the actor/storage is not yet ready.

### Remove
- Nothing removed

## Implementation Plan

1. Update `useStorageClient.ts` to accept (or use) the `isFetching` state from `useActor` so it returns `null` while the actor is still initializing.
2. Update `TestsPage.tsx` to show the actual error message from caught exceptions in the toast, and improve the disabled state logic.
