# Fomz Profile Page Plan

## Goals
- Keep it minimal: user info, basic edits, preferences, and account actions.
- Reuse existing auth/theme stores and UI components for consistency.
- Ensure mobile-friendly layout within `DashboardLayout`.

## Sections
1) **User Info**: avatar/initials, display name, email, member since.
2) **Edit Basics**: inline name edit (Firebase Auth update), reset password link (email/password users).
3) **Preferences**: theme selector (hook into existing theme store), notification toggle placeholder (hooks into notification service if available).
4) **Account Actions**: sign out (existing auth hook), optional delete account (confirm modal via user service).

## Routing
- Add route: `/dashboard/profile` using `DashboardLayout`.

## Components to Reuse
- Buttons/Inputs/Modal from `components/ui`.
- ThemeSelector from builder (for consistency).
- useAuth/useUserStore/useThemeStore.

## Implementation Notes
- Read-only fields default to `useUserStore` values; edits update Firebase Auth + store.
- Show friendly “Member since” from auth metadata if available.
- Keep copy concise; accent colors aligned to sky/light blue.
