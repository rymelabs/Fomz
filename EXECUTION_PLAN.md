# Agentic AI Form Builder Execution Plan

## 1. Setup & Configuration
- [x] Install `@mistralai/mistralai` package.
- [x] Create `src/services/aiService.js` to handle API communication.
  - Implement `generateFormFromPrompt(prompt)` function using Mistral AI.
  - Define the system prompt to ensure JSON output matches Fomz schema.

## 2. State Management
- [x] Update `src/store/formBuilderStore.js`:
  - Add `generateForm` action.
  - Add `isGenerating` state.
  - Add logic to populate the store with the returned JSON structure.

## 3. UI Implementation
- [x] Create `src/components/dashboard/AIGeneratorModal.jsx`:
  - Modal component with a textarea for the user's prompt.
  - "Generate Form" button.
  - Loading state with a creative animation (e.g., "Thinking...").
- [x] Update `src/pages/Dashboard/MyForms.jsx`:
  - Add a "Create with AI" button next to the existing "Create Form" button.
  - Wire up the button to open the `AIGeneratorModal`.

## 4. Integration & Logic
- [x] Connect `AIGeneratorModal` to `formBuilderStore`.
- [x] On success:
  - Initialize the form in the store.
  - Save the form to Firebase (optional, or just let user save).
  - Navigate to the Builder page (`/builder`) with the new form loaded.

## 5. Testing & Refinement
- [ ] Test with sample prompts (e.g., "Registration form", "Customer satisfaction survey").
- [ ] Handle errors (invalid JSON, API limits).

# Notifications Feature Implementation Plan

## Overview
Implement a robust notifications system for the Fomz dashboard, supporting both user and admin notifications, with priority-based delivery and UI integration.

## Goals
- Add a notifications icon/button to the dashboard header.
- Show notifications for admin broadcasts, form publishing, link sharing, and saves.
- Admins can create notifications (normal or high priority).
- High priority notifications trigger a modal popup for all users.
- Notification badge for unread items.

## Components
- **Notification Icon/Button**: In dashboard header, shows badge for unread notifications.
- **Notifications Page**: Lists all notifications, allows admin to create new ones.
- **Notification Modal**: Pops up for high-priority notifications.
- **Notification Service**: Handles fetching, creating, and broadcasting notifications.
- **Firestore Schema**: Stores notifications and tracks read/unread state per user.

## User Stories
- As a user, I see a notification icon in the dashboard header with a badge for unread notifications.
- As a user, I can view all notifications in a dedicated page.
- As a user, I receive a modal popup for high-priority admin notifications.
- As an admin, I can create notifications (normal or high priority) to broadcast to all users.

## Data Model
- **notifications** (collection)
  - id
  - title
  - message
  - priority: 'normal' | 'high'
  - createdAt
  - createdBy
- **userNotifications** (subcollection or mapping)
  - userId
  - notificationId
  - read: boolean
  - delivered: boolean

## API/Service
- `getNotifications(userId)`
- `markNotificationRead(userId, notificationId)`
- `createNotification({title, message, priority, createdBy})` (admin only)
- `broadcastNotification(notificationId)`

## UI/UX
- Responsive notification icon with badge
- Notification modal for high-priority
- Admin-only "Create notification" button
- Accessible, mobile-friendly

## Security
- Only admins can create/broadcast notifications
- Users can only mark their own notifications as read

## Testing
- Unit tests for service logic
- Integration tests for UI flows
- Manual QA for admin/user roles

---

# Execution Plan (Notifications)

## 1. Data & Service Layer
- [x] Design Firestore schema for notifications and userNotifications
- [x] Implement notification service (CRUD, broadcast, mark as read)

## 2. UI Components
- [x] Add notification icon/button to dashboard header
- [x] Create notification badge component
- [x] Build notifications page (list, mark as read, admin create form)
- [x] Build notification modal for high-priority alerts

## 3. Admin Features
- [x] Restrict create notification UI to admins
- [x] Add priority selection (normal/high)
- [x] Broadcast logic for new notifications

## 4. Integration
- [x] Connect service to UI components
- [x] Trigger modal for high-priority notifications
- [x] Update badge on new/unread notifications

## 5. Testing & QA
- [ ] Write unit/integration tests
- [ ] Manual QA for user/admin flows

## 6. Documentation
- [ ] Update README and usage docs

---

**Estimated Timeline:** 2-4 days for full implementation and QA.
