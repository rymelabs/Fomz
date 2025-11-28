# Anonymous Mode Testing Checklist

## Overview
This document provides a comprehensive testing plan for the anonymous (non-logged-in) user mode implementation in Fomz.

## Features to Test

### 1. AI Usage Limits ✓
- [ ] **Anonymous users see usage counter**
  - Navigate to `/dashboard/create` without signing in
  - Open AI Generator modal
  - Verify "X of 5 uses remaining today" message displays

- [ ] **5/day limit enforced**
  - Use AI generator 5 times (create 5 forms with AI)
  - Attempt 6th generation
  - Verify error: "Daily AI limit reached. Sign in for unlimited access."

- [ ] **Limit resets at midnight**
  - Wait until midnight or manually test by clearing localStorage
  - Verify counter resets to 5/5

- [ ] **Authenticated users bypass limits**
  - Sign in with Google
  - Open AI Generator
  - Verify no usage counter shown
  - Generate multiple forms (>5) without errors

### 2. Local Form Creation
- [ ] **Create form manually (anonymous)**
  - Visit `/dashboard/create`
  - Click "Start from Scratch"
  - Add questions (text, multiple choice, email, etc.)
  - Configure form settings
  - Click "Save Locally"
  - Verify success toast

- [ ] **Create form with AI (anonymous)**
  - Visit `/dashboard/create`
  - Click "Start with AI"
  - Enter prompt: "Customer satisfaction survey"
  - Generate form
  - Review and edit if needed
  - Click "Save Locally"

- [ ] **Form stored in localStorage**
  - Open browser DevTools → Application → Local Storage
  - Find key: `fomz_local_published_forms`
  - Verify form data structure includes: id, title, description, questions, shareId, createdAt

- [ ] **Share link generated**
  - After saving, verify share URL format: `http://localhost:3001/fill/{shareId}`
  - Copy link
  - Open in new incognito window
  - Verify form loads correctly

### 3. Local Forms Dashboard (`/local/forms`)
- [ ] **Navigation works for anonymous users**
  - Sign out or open incognito window
  - Visit `/local/forms` or click "My Local Forms" in nav
  - Verify page loads

- [ ] **Forms list displays correctly**
  - Verify each form card shows:
    - Form title
    - Response count
    - Created date
    - Share button
    - Delete button
    - View Analytics button

- [ ] **Empty state**
  - Clear localStorage or use fresh browser
  - Visit `/local/forms`
  - Verify empty state message with "Create Form" CTA

- [ ] **UpgradeBanner displays**
  - Verify banner at top shows benefits of signing in
  - Click "Sign In" button
  - Verify redirects to Google auth

- [ ] **Storage quota warning**
  - Create multiple large forms (to reach 80% of ~5MB limit)
  - Verify warning banner appears: "Storage almost full"

- [ ] **Share link functionality**
  - Click "Share" button on a form
  - Verify copy-to-clipboard success toast
  - Paste link in new tab
  - Verify form opens correctly

- [ ] **Delete form**
  - Click delete icon on a form
  - Verify confirmation dialog appears
  - Confirm deletion
  - Verify form removed from list
  - Verify responses also deleted from localStorage

### 4. Response Collection (Anonymous Forms)
- [ ] **Submit response to local form**
  - Copy share link from local form
  - Open in new incognito window
  - Fill out all questions
  - Click "Submit"
  - Verify success message

- [ ] **Response saved in localStorage**
  - Open DevTools → Local Storage
  - Find key: `fomz_local_responses_{shareId}`
  - Verify response data includes: id, formId, shareId, answers, submittedAt

- [ ] **Multiple responses**
  - Submit 3-5 responses to same form (use different browsers/incognito windows)
  - Go to `/local/forms`
  - Verify response count increments for that form

### 5. Local Analytics (`/local/forms/{formId}/analytics`)
- [ ] **Navigation to analytics**
  - From `/local/forms`, click "View Analytics" on a form
  - Verify navigates to `/local/forms/{formId}/analytics`

- [ ] **Stats cards display**
  - Verify 4 stat cards show:
    - Total Responses
    - Completion Rate (always 100% for submitted forms)
    - Average Time (mock value)
    - Last Response (time ago)

- [ ] **Question statistics**
  - For each question, verify:
    - Question text and type
    - Response distribution (bar charts for multiple choice, list for text)
    - Percentage breakdown

- [ ] **Recent responses section**
  - Verify table shows last 10 responses
  - Columns: Response ID, Submitted At, View button
  - Click "View" → verify navigates (or shows full response if implemented)

- [ ] **Export functionality**
  - Click "Export Responses (JSON)"
  - Verify JSON file downloads
  - Open file, verify structure matches response data

- [ ] **Analytics caching**
  - View analytics for a form
  - Navigate away and back
  - Verify loads quickly (5-min cache)

- [ ] **Empty state**
  - View analytics for form with 0 responses
  - Verify helpful empty state message

### 6. Form Builder UX (Anonymous)
- [ ] **Local form indicators in FormSettings**
  - Create/edit local form
  - Open form settings panel
  - Verify banner: "This form will be saved locally..."
  - Verify "Save Locally" button (not just "Save")

- [ ] **Email receipt settings disabled**
  - In form settings for local form
  - Verify "Send email receipt" toggle is disabled or hidden
  - Tooltip/message: "Available for signed-in users"

- [ ] **Upgrade prompts in builder**
  - Verify UpgradeBanner shows in builder for anonymous users
  - Compact variant with CTA

### 7. Migration to Cloud (Sign-In Flow)
- [ ] **Migration modal triggers on sign-in**
  - Create 2-3 local forms as anonymous
  - Sign in with Google
  - After successful auth, verify MigrationModal appears after 1s delay

- [ ] **Migration summary display**
  - Verify modal shows:
    - Number of forms to migrate
    - Total responses across all forms
    - List of form titles
    - "Migrate Now" and "Cancel" buttons

- [ ] **Backup before migration**
  - Click "Backup Before Migrating"
  - Verify JSON file downloads with all local data

- [ ] **Migration process**
  - Click "Migrate Now"
  - Verify progress bar animates
  - Status text updates: "Migrating X of Y..."
  - Wait for completion

- [ ] **Migration results**
  - After completion, verify results screen shows:
    - Success count
    - Error count (if any)
    - List of migrated forms with status
    - "View My Forms" button

- [ ] **Cloud forms verification**
  - Click "View My Forms"
  - Navigate to `/dashboard`
  - Verify all migrated forms appear
  - Open a form → verify all questions present
  - Check Firestore console → verify documents created

- [ ] **Responses migrated**
  - For each migrated form, click "View Responses"
  - Verify all responses transferred
  - Verify response data intact (answers, timestamps)

- [ ] **Local data cleanup**
  - After successful migration, check localStorage
  - Verify `fomz_local_published_forms` is empty or deleted
  - Verify `fomz_local_responses_*` keys removed

- [ ] **Migration error handling**
  - Simulate network failure during migration
  - Verify error message displays
  - Local data preserved (not deleted on failure)

### 8. Hybrid Storage (Local + Cloud)
- [ ] **Logged-in user creates cloud form**
  - Sign in
  - Create form
  - Verify saves to Firestore (not localStorage)

- [ ] **Logged-in user views only cloud forms**
  - Sign in
  - Go to `/dashboard`
  - Verify shows only cloud forms (local forms hidden/migrated)

- [ ] **Anonymous user redirected correctly**
  - Sign out
  - Try to visit `/dashboard` (cloud forms page)
  - Verify redirects to `/local/forms` or shows appropriate message

### 9. Edge Cases & Error States
- [ ] **Storage quota exceeded**
  - Create many large forms to exceed ~5MB localStorage limit
  - Attempt to save another form
  - Verify error message: "Storage quota exceeded"
  - Verify upgrade prompt appears

- [ ] **Corrupt localStorage data**
  - Manually edit localStorage to invalid JSON
  - Reload page
  - Verify app doesn't crash
  - Verify error logged/handled gracefully

- [ ] **Network offline**
  - Disable network connection
  - Create local form as anonymous → should work
  - Try to sign in → should show network error
  - Try to fill out form → should work for local forms

- [ ] **Form with no questions**
  - Create form without adding any questions
  - Try to save locally
  - Verify validation error or warning

- [ ] **Long form titles**
  - Create form with 200+ character title
  - Verify truncates properly in UI
  - Verify saves and displays correctly

- [ ] **Special characters in form data**
  - Create form with emojis, unicode, HTML in questions
  - Save and view
  - Verify renders correctly (no XSS, proper escaping)

### 10. Cross-Browser Testing
- [ ] **Chrome/Edge**
  - Test all flows in Chrome
  - Verify localStorage persistence

- [ ] **Firefox**
  - Repeat key tests in Firefox
  - Check for localStorage compatibility issues

- [ ] **Safari**
  - Test on Safari (macOS/iOS)
  - Verify localStorage limits (Safari has stricter limits)

- [ ] **Mobile browsers**
  - Test responsive design on mobile
  - Verify touch interactions work
  - Test form filling on mobile

### 11. Performance
- [ ] **Analytics caching works**
  - Visit analytics page
  - Check DevTools → Network
  - Navigate away and back within 5 minutes
  - Verify no recalculation (cached)

- [ ] **Large forms load quickly**
  - Create form with 50+ questions
  - Verify builder loads without lag
  - Verify form filling is smooth

- [ ] **Many local forms (20+)**
  - Create 20+ local forms
  - Visit `/local/forms`
  - Verify list renders quickly
  - No UI freezing

### 12. UI/UX Polish
- [ ] **Loading states**
  - Verify spinners show during:
    - AI generation
    - Form save
    - Migration process
    - Analytics calculation

- [ ] **Success toasts**
  - Verify toast notifications appear for:
    - Form saved
    - Form deleted
    - Link copied
    - Response submitted

- [ ] **Error messages**
  - Verify user-friendly error messages (not technical jargon)
  - Errors provide next steps or solutions

- [ ] **Empty states**
  - All empty states have helpful messages and CTAs
  - Images/illustrations where appropriate

- [ ] **Responsive design**
  - Test on mobile (375px), tablet (768px), desktop (1440px)
  - Verify navigation adapts
  - Forms fill well on mobile

## Test Execution Notes
- **Date:** _____________________
- **Tester:** _____________________
- **Environment:** localhost:3001
- **Browser/Version:** _____________________

## Issues Found
| Issue # | Description | Severity | Status |
|---------|-------------|----------|--------|
| 1       |             |          |        |
| 2       |             |          |        |
| 3       |             |          |        |

## Sign-Off
- [ ] All critical tests passed
- [ ] All P1/P2 bugs fixed
- [ ] Performance acceptable
- [ ] Ready for production deployment

---

**Next Steps After Testing:**
1. Fix any critical bugs found
2. Implement missing error handling
3. Add additional loading states if needed
4. Optimize performance bottlenecks
5. Final code review
6. Deployment prep (environment variables, Firebase config, etc.)
