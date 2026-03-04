# Sanskrit Class

## Current State

Full-stack class management app with:
- Teacher login via Internet Identity with admin role check
- Student join via invite code + email + display name
- Study materials upload/view
- Test creation with PDF question paper, start time, duration
- Tab-switch detection during tests
- Answer paper submission
- Marks assignment by teacher
- Notifications for students when tests are uploaded

The teacher login flow is broken: `isCallerAdmin()` on the backend calls `getUserRole()` which traps (throws a runtime error) when the caller's principal is not yet in the roles map. This happens when `isAdmin` is checked before or concurrently with `_initializeAccessControlWithSecret`. The trap is caught by the frontend and interpreted as `false`, showing "This identity is not registered as a teacher."

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `access-control.mo`: Fix `isAdmin` to return `false` gracefully when user is not in the roles map, instead of calling `getUserRole` which traps on unregistered principals
- `LandingPage.tsx`: After login, re-query isAdmin with a small retry delay to ensure `_initializeAccessControlWithSecret` has had time to complete before the admin check runs

### Remove
- Nothing

## Implementation Plan

1. Regenerate backend with fixed `isAdmin` in access-control.mo -- it should use a direct map lookup returning `false` for unregistered principals instead of delegating to `getUserRole` which traps
2. Update `LandingPage.tsx` to add a small retry/delay mechanism: after login success, wait briefly then refetch the isAdmin query before making the redirect/error decision
3. Also ensure `useIsAdmin` in useQueries.ts has `retry: 2` and `retryDelay: 1000` so transient traps during initialization don't permanently return false
