# Background & Haptics Enhancements Plan

## Goals
- Expand app background options (20 total) with base colors and matching blobs/gradient overlays.
- Apply chosen background to: app shell (layout), gradient blobs, and avatar chip.
- Update profile page selector to use new background options.
- Add haptic feedback on primary nav tabs (My Forms, Create, Analytics).

## Implementation Notes
- Extend `themeStore` with `appBackgroundOptions` and `appBackgroundId` (default `sky`), including blob/overlay colors and avatar background.
- Update `DashboardLayout` to use selected background option for base color and blob colors (fallback to defaults).
- Update `Profile` preferences section to render all options (20) and store selection via `setAppBackground`.
- Avatar background sourced from current background option’s `avatarBg`.
- Add `navigator.vibrate(10)` on nav tab clicks (desktop + mobile nav links).
