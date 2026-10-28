# UI Reference — values from the live product

Measured from app.magica.com/chat (dark theme, 1440px wide) by reading the page's computed styles and design tokens. Use these numbers instead of guessing. If something here doesn't match what you see in the live product, the live product wins — update this file.

We rebuild the look with shadcn + Tailwind. We don't copy their code, fonts or image assets.

---

## Colors (dark theme)

| Token | Value | Used for |
|---|---|---|
| `surface-main-background` | `#111111` | page background, main area |
| `surface-main-background-2` | `#111111` | sidebar background |
| `surface-main-background-3` | `#1a1a1a` | raised areas |
| `surface-primary` | `#1a1a1a` | composer top (gradient start), cards |
| `surface-secondary` | `#1b1b1b` | subtle panels |
| `surface-tertiary` | `#2a2a2a` | hover / pressed fills |
| `control-hover` | `#1f1f1f` | icon button hover |
| `surface-hover` | `#222222` | active tab ("All") background, nav item hover |
| `primary-top / primary-bottom` | `#3b3b3b` → `#2b2b2b` | primary button gradient |
| `text-primary` | `#f1f1f1` | main text, headings, icons |
| `text-secondary` | `#9a9a9a` | subtitle, placeholder, composer icons, inactive tabs |
| `text-tertiary` | `#626262` | hints, disabled |
| `border-secondary / tertiary` | `#222222` | sidebar right border, dividers |
| `border-primary` | `#a9a9a9` | strong borders (rare) |
| `brand primary` | `#4f46e6` | brand accent (logo mark) |
| error / success / warning / info | `#dc2626` / `#16a34a` / `#f59e0b` / `#0b62f1` | status colors |

## Spacing scale

`2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 56 · 64 · 80 · 96 · 120 · 160` px (tokens `space-01` … `space-16`).
Page sections use a 48px gap (`space-10`).

## Radius scale

`2 · 4 · 10 · 12 · 16 · 20 · 24 · 28 · 32` px, plus `999px` for round buttons.
- Nav items, tabs, menu items: **10px** (menu items 8px)
- Composer: **24px**
- Sidebar container: **24px**
- Icon buttons: **999px** (circle)

## Typography

- Font: their own "magicaCircular" (not free to use). Use a close free font — **Inter** or **DM Sans** — via `next/font`.
- Body: **14px / 20px, 400**
- Heading "Your AI worker": **24px / 32px, 700**
- Subtitle "Work at the speed of thought.": **14px / 24px, 500**, `text-secondary`
- Sizes in their scale: caption 12, metadata 13, body 14, heading-sm 16, lead 18, heading-md 20, heading-lg 24, page-title 30, display 36

## Shadows (light theme; dark mostly uses none)

- sm: `0 1px 3px rgba(26,26,24,.06), 0 1px 2px rgba(26,26,24,.04)`
- popover: `0 24px 32px -8px rgba(26,26,24,.12), 0 8px 12px -6px rgba(26,26,24,.06)`

---

## Components

### Sidebar
- Width: **240px** expanded, **48px** collapsed (icon-only rail)
- Background `#111111`, right border `#222222`, radius 24px
- Header: **52px** tall, padding `10px 8px 0 12px`. Logo left, search + collapse buttons right (**28px** circle buttons)
- Nav items: **34px** tall, radius **10px**, icon + label, 14px text, gap between items ~ 4–8px
- Nav order: New task · Tasks · Projects · Scheduled · Library · Tools · API / MCP · Help & Support · Unfair Advantage
- Empty list text: **"No tasks yet"** (centered, `text-secondary`)
- Bottom: "More" (⋮) row, then user card (avatar + name)

> For our clone, keep the items our features need (New task, Tasks list, Search). Others can be visible but inactive — ask the reviewer if unsure.

### Top bar (main area)
- Left: model selector "Magica Auto ⌄" (control height **28px**) — ours shows **"OpenRouter Free"**
- Right: "Computer" pill button + credits pill (e.g. "30M") — credit control height **32px**

### Empty state (new chat)
- Centered: small logo mark, time (e.g. "4:47 pm"), heading **"Your AI worker"**, subtitle **"Work at the speed of thought."**
- Content column max width **1000px**, 48px gap between heading block and composer

### Composer
- Width **900px** (inside the 1000px column), radius **24px**
- Padding **16px 16px 12px**, inner gap **12px**
- Background: vertical gradient `#1a1a1a` (top) → `#111111` (bottom), no border, no shadow
- Height ~**132px** when empty (textarea + action row)
- Textarea: 14px / 24px, color `#f1f1f1`, placeholder **"Assign a task or ask anything..."** in `#9a9a9a`, max height **384px** then scroll
- Action row, all icon buttons **32px circles**, icons `#9a9a9a`:
  - left: Attach files (📎) · "Choose project" (text button, 14px/500) · Skills · Connect apps
  - right: Meeting minutes (waveform) · Dictation (mic) · **Send** (↑, background `#111111`, disabled look when empty)

### Category tabs (below composer)
- Height **34px**, radius **10px**, 14px / 500
- Active ("All"): background `#222222`, text `#f1f1f1`
- Inactive: transparent, text `#9a9a9a`
- Labels: All · Viral Video Formats · Video Special Effects · Content Creation · Branding & Design · Image & Editing
- Below: grid of template cards (3 columns), image + title

> Template cards are product marketing content, not part of our task — skip or show a simple placeholder; ask the reviewer if they expect it.
