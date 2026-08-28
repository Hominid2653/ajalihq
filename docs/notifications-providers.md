# External notifications (Resend email)

EMAIL goes through **Resend**. SMS (Africa's Talking) is deferred — rows are still created and marked `dry_run`.

## Env (`backend/.env`)

```env
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Ajali! <onboarding@resend.dev>
NOTIFICATIONS_EMAIL_ENABLED=true
```

- Missing / empty `RESEND_API_KEY` → **dry_run** (notification row saved; no provider call).
- `NOTIFICATIONS_EMAIL_ENABLED=false` → same dry-run behaviour.
- With `onboarding@resend.dev`, Resend only delivers to **your Resend account email**. Verify a domain for production.

## Behaviour

1. Lifecycle / admin enqueue **inserts** a `notifications` row in the DB transaction.
2. After **commit**, EMAIL channels call Resend.
3. Result is stored on `notifications.metadata` (`deliveryStatus`: `sent` | `dry_run` | `failed` | `skipped`, plus `providerId` / `error`).

### Triggers that send EMAIL

| Trigger | Destination |
| --- | --- |
| Resolve with `notifyCitizen.email` | Incident `reporterEmail` |
| `POST /api/v1/notifications` with `channel: EMAIL` | `toEmail` or recipient user's email |

Department-assigned EMAIL rows currently have no destination → `skipped` until departments store contact emails.

## Manual test (Swagger)

1. Login as admin → Authorize.
2. `POST /api/v1/notifications`:

```json
{
  "type": "CITIZEN_STATUS_NOTIFY",
  "channel": "EMAIL",
  "title": "Ajali! test",
  "body": "Hello from Ajali backend",
  "toEmail": "your-resend-login@email.com"
}
```

3. Check Resend dashboard → Emails, and the response `deliveryStatus`.
