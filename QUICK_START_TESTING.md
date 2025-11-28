# Quick Start: Testing Anonymous Mode

## 🚀 Start the App

```bash
npm run dev
```

Visit: **http://localhost:3001**

---

## 🧪 Quick Test Scenarios

### **Scenario 1: Anonymous Form Creation (5 minutes)**

1. Open incognito window → http://localhost:3001
2. Click "Try It Free" or "Create Form"
3. Click "Start with AI"
4. Enter: "Customer feedback survey with 5 questions"
5. Click "Generate"
6. Review generated form
7. Click "Save Locally"
8. Verify success toast

**Expected:**
- Form saved to localStorage
- Redirects to `/local/forms`
- Form appears in list with 0 responses

---

### **Scenario 2: Response Collection (3 minutes)**

1. From `/local/forms`, click "Share" on your form
2. Copy the share link
3. Open link in NEW incognito window
4. Fill out all questions
5. Click "Submit"

**Expected:**
- Success message appears
- Response saved to localStorage
- Original tab shows response count = 1

---

### **Scenario 3: View Analytics (2 minutes)**

1. Go back to `/local/forms`
2. Click "View Analytics" on your form
3. Review stats cards
4. Check question distributions
5. Click "Export Responses (JSON)"

**Expected:**
- Stats show 1 response
- Question breakdown displays
- JSON file downloads with response data

---

### **Scenario 4: AI Usage Limits (5 minutes)**

1. In incognito window, go to `/dashboard/create`
2. Click "Start with AI"
3. Generate 5 different forms (use different prompts each time)
4. Attempt 6th generation

**Expected:**
- After 5th generation: "1 of 5 uses remaining"
- 6th attempt: Error "Daily AI limit reached"
- Upgrade prompt appears

---

### **Scenario 5: Migration on Sign-In (5 minutes)**

1. Ensure you have 2-3 local forms (from Scenario 1)
2. Click "Sign In" button
3. Authenticate with Google
4. Wait for redirect

**Expected:**
- Migration modal appears after 1 second
- Shows summary: "2 forms, X responses"
- Click "Migrate Now"
- Progress bar animates
- Success screen shows migrated forms
- Forms now visible in `/dashboard`

---

### **Scenario 6: Storage Quota Warning (Advanced)**

1. Create 15+ local forms with many questions
2. Visit `/local/forms`

**Expected:**
- Warning banner appears if storage > 80%
- Message: "Your local storage is almost full"
- Upgrade prompt

---

## 🐛 Common Issues & Fixes

### Issue: "Module not found" error
**Fix:** 
```bash
npm install
```

### Issue: Migration modal doesn't appear
**Check:**
- Do you have local forms? (Visit `/local/forms` to verify)
- Are you authenticated? (Check navbar for user avatar)
- Check console for errors

### Issue: Responses not showing
**Fix:**
- Ensure you're submitting from a DIFFERENT browser/incognito window
- Check localStorage in DevTools (Application → Local Storage)
- Look for key: `fomz_local_responses_{shareId}`

### Issue: AI generator not working
**Check:**
- Mistral AI API key configured in environment variables
- Network connectivity
- Console for API errors

---

## 📍 Key URLs to Test

| URL | Purpose | Auth Required |
|-----|---------|---------------|
| `/` | Landing page | No |
| `/dashboard/create` | Create form | No (saves locally) |
| `/local/forms` | Local forms dashboard | No |
| `/local/forms/:id/analytics` | Analytics for local form | No |
| `/dashboard` | Cloud forms (after sign-in) | Yes |
| `/fill/:shareId` | Fill form (anyone) | No |

---

## 🔍 What to Look For

### ✅ Good Signs:
- No console errors
- Smooth page transitions
- Toast notifications appear
- Data persists after refresh
- Migration completes without errors

### ⚠️ Red Flags:
- Console errors (check browser DevTools)
- White screen of death (React render error)
- Forms not appearing in `/local/forms`
- Responses not incrementing
- Migration fails or hangs

---

## 📊 Test Data

### Sample Form Prompts for AI:
- "Customer satisfaction survey"
- "Event registration form with dietary preferences"
- "Job application form with skill assessment"
- "Product feedback form for mobile app"
- "Newsletter signup with interest preferences"

### Sample Response Data:
- Use realistic data (names, emails, etc.)
- Test edge cases (very long text, special characters)
- Submit multiple responses per form

---

## 🎯 Success Criteria

After testing, you should be able to:
- [x] Create forms as anonymous user
- [x] Save forms locally (no sign-in required)
- [x] Collect responses via share link
- [x] View analytics for local forms
- [x] Hit AI usage limit (5/day)
- [x] Migrate forms to cloud on sign-in
- [x] See upgrade prompts throughout

---

## 📝 Reporting Issues

If you find bugs, note:
1. **What you did** (steps to reproduce)
2. **What happened** (actual behavior)
3. **What you expected** (expected behavior)
4. **Console errors** (if any)
5. **Browser/OS** (e.g., Chrome 120 on macOS)

Document in `TESTING_CHECKLIST.md` under "Issues Found" section.

---

## 💡 Tips

- **Use incognito windows** for testing anonymous users (avoids auth state confusion)
- **Check DevTools → Application → Local Storage** to inspect data
- **Clear localStorage** between tests to start fresh
- **Test on multiple browsers** (Chrome, Firefox, Safari)
- **Test on mobile** for responsive design

---

**Ready to test?** Start with Scenario 1 and work through systematically!
