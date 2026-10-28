# UI Fidelity Checklist (clone the live product)

Fidelity is **20%** of the score. Doc says "roughly the same" counts against us. So: keep the live Galaxy Agent Chat open in one window, our app in the other, and compare constantly.

## How to compare (do this for every screen)

1. Same browser width (1440, 1280, 390 mobile).
2. Open devtools on the live product → note exact `padding`, `gap`, `font-size`, `line-height`, `border-radius`, colors, max widths.
3. Put the numbers in the table at the bottom of this file. Use them in Tailwind (arbitrary values like `max-w-[768px]` are fine when needed).
4. Screenshot both at the same size and compare side by side.
5. Copy the **exact text** (button labels, placeholders, empty states, error copy).

Don't copy their code or assets — rebuild with shadcn + Tailwind so it looks the same.

## Things to check

### Shell
- [ ] sidebar width, collapsed state, hover/active chat item, pinned section, search box
- [ ] header (chat title, actions)
- [ ] main column max width, side paddings
- [ ] artifact panel width, open/close transition
- [ ] mobile: drawer sidebar, same controls

### Empty states
- [ ] new chat screen (greeting, suggestions if any)
- [ ] no chats yet, no search results

### Composer
- [ ] height, radius, shadow, padding, placeholder text
- [ ] grows with multiline, max height then scroll
- [ ] attachment chips (preview, progress, remove, error)
- [ ] media picker, plan mode toggle, model/status chip
- [ ] Send ↔ Stop ↔ Stopping states, disabled styles
- [ ] keyboard: Enter / Shift+Enter / Esc

### Messages
- [ ] user bubble style and width
- [ ] assistant text typography (markdown, code blocks, lists)
- [ ] thinking block ("Thought for Xs"), collapsed/expanded
- [ ] streaming cursor / animation
- [ ] failed message style + Retry
- [ ] cancelled message style + Retry
- [ ] copy / actions on hover

### Tool cards
- [ ] label text per tool (exactly as product)
- [ ] pending / running / done / failed / cancelled states
- [ ] duration + credits display
- [ ] expand to see inputs/outputs
- [ ] generated image/video preview inside card, click → artifact panel

### Approval overlay
- [ ] position, backdrop, buttons, copy for credit approval
- [ ] plan approval layout
- [ ] expired state

### Credits
- [ ] balance display location, low balance warning, insufficient credits message

### Small details
- [ ] hover states, focus rings, transitions timing
- [ ] loading skeletons
- [ ] scroll behavior (auto-scroll while streaming, stop if user scrolls up, "jump to bottom" button)
- [ ] toasts / error copy

## Measurements (fill while comparing)

| Element | Property | Live product | Ours |
|---|---|---|---|
| Sidebar | width | 240px expanded / 48px collapsed | same |
| Sidebar | header height / padding | 52px / 10px 8px 0 12px | same |
| Sidebar | container radius / border | 24px / 1px #222222 right | same |
| Nav item | height / radius | 34px / 10px | same |
| Chat column (empty state) | max-width | 1000px | same |
| Chat column (empty state) | heading to composer gap | 48px | same |
| Composer | width | 900px | same |
| Composer | radius / padding | 24px / 16px 16px 12px | same |
| Composer | background | gradient #1a1a1a to #111111 | same |
| Composer | textarea max-height | 384px then scroll | same |
| Composer action buttons | size | 32px circle | same |
| Heading "Your AI worker" | font / size / line-height / weight | Inter / 24px / 32px / 700 | same |
| Subtitle | font / size / line-height / weight | Inter / 14px / 24px / 500 | same |
| Body text | font / size / line-height | Inter / 14px / 20px | same |
| User bubble | padding / radius / bg | not built yet (C3) | - |
| Tool card | radius / border / padding | not built yet (C3) | - |

## Flag things to reviewer

If something in the live product looks off or could be better, don't change it in our clone — just note it here and tell the reviewer. Doc says they like that feedback.

- Collapsed sidebar rail (48px) has no reference screenshot — built from the 48px width spec alone, not verified against the live product.
- "Tasks" nav item has no destination yet (no chat-list route exists), so it renders enabled-looking but does nothing on click. Flagging for the reviewer to confirm that's the right call until a tasks list page exists.
- No logo mark asset for the empty-state header (the live product's mascot icon isn't ours to copy) — substituted a generic Sparkles icon in brand-primary as a placeholder.
- Skipped per task scope: the "Computer" pill in the top bar, category tabs, and template cards below the composer.
