# Realtime, Reconnect and Reload Recovery

This is the trickiest part of the frontend. Read fully before changing `src/realtime/`.

![Send, stream and finish flow](realtime.png)

## 1. Two channels from Trigger.dev

| Channel | Carries | Goes to |
|---|---|---|
| **Text stream** | assistant tokens, one by one | `liveRun.text` |
| **Run metadata** | status, current step, tools, assets, waitpoint, error (Zod `RunMetadata`) | rest of `liveRun` |

Every metadata update is parsed with the Zod contract. Bad shape → ignore + log, don't crash.

## 2. Send flow

```
user hits Send
 → useSendMessage (clientRequestId = uuid)
 → server returns { chatId, messageId, runId, realtime.accessToken }
 → optimistic user message added to messages cache
 → liveRun.start(runId, accessToken)
 → subscribe to text stream + metadata
```

## 3. Status model (what user sees)

`thinking → working → complete | failed | cancelled | stopping`, plus `waiting` when an approval is pending.

- thinking: dots + "Thinking…" with timer (thinking duration)
- working: current step text + active tool card spinner
- waiting: approval overlay
- complete: finalize (see 5)
- failed / cancelled: keep partial text, show safe error + Retry

## 4. Reconnect (bounded)

```
connection drops
 → status "reconnecting" (small banner)
 → retry with backoff: 1s, 2s, 4s, 8s (max 5 tries)
 → token expired? POST /runs/:id/realtime-token → resubscribe
 → still failing? switch to "polling": GET /runs/:id every 3s
 → when run is terminal → finalize
```

Never retry forever. Never send the message again on reconnect.

## 5. Finalize (no duplicate messages!)

When metadata says terminal:
1. invalidate `messages(chatId)` query and wait for the refetch
2. only then clear `liveRun` for that run

So for a moment both exist, but we hide the live bubble once the saved assistant message with the same `runId` is in the cache. Result: no flicker, no duplicate.

## 6. Reload / switch chat recovery

On opening `/chat/[chatId]`:
1. load messages (query)
2. `GET /chats/:chatId/active-run`
3. if there is an active run → get fresh realtime token → subscribe → live bubble shows current text/steps
4. if waitpoint pending → overlay shows again

Switching chats doesn't cancel anything. The run keeps going on the server; we just unsubscribe and resubscribe when user comes back.

## 7. Approvals overlay

- metadata has `waitpoint: { id, kind, payload, expiresAt }`
- `kind: credit` → "This will use ~X credits. Continue?" Approve / Cancel
- `kind: plan` → shows plan steps, Approve / Edit / Cancel
- click → `POST /waitpoints/:id/respond` with an idempotency key; buttons disabled after first click
- expired → overlay closes, message: "Approval timed out. Send again to continue."
- focus is trapped inside overlay, Esc = cancel

## 8. Tests to write

- MSW: send → stream mock → finalize, no duplicate message
- reconnect: drop connection → backoff → token refresh → polling fallback
- reload mid-run: active-run returns a run → bubble resumes
- waitpoint: double click approve → only one request effect
