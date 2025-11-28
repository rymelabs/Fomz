# AI Usage Limits Feature (Fomzy)

## Overview
The Fomzy AI form generator now has daily usage limits for anonymous (non-logged-in) users to prevent abuse while encouraging sign-ups.

## Limits

### Anonymous Users
- **5 AI generations per day**
- Limit resets at midnight (local time)
- Tracked using browser localStorage
- Usage persists until browser data is cleared

### Logged-In Users
- **Unlimited AI generations**
- No tracking required
- Premium feature to encourage authentication

## Implementation

### Files Created/Modified

1. **New Service**: `src/services/aiUsageLimitService.js`
   - Tracks AI usage in localStorage
   - Provides limit checking functions
   - Calculates time until reset
   - Returns usage statistics

2. **Updated Store**: `src/store/formBuilderStore.js`
   - Added `checkAILimit()` method
   - Modified `generateForm()` to accept `isAuthenticated` parameter
   - Returns detailed result object with limit info

3. **Updated Component**: `src/components/dashboard/AIGeneratorModal.jsx`
   - Shows usage stats (X/5 generations used)
   - Visual progress bar
   - Warns when nearing limit
   - Displays error when limit reached
   - Encourages sign-in for unlimited access

4. **Updated Pages**:
   - `src/pages/Dashboard/CreateForm.jsx`
   - `src/pages/Builder/BuilderMain.jsx`
   - Both now handle limit errors gracefully

## User Experience

### Visual Indicators

1. **Usage Stats Display**
   ```
   Daily generations: 3/5
   [===========     ] 60%
   2 left
   ```

2. **Warning State** (4-5 uses)
   ```
   Daily generations: 4/5
   [================] 80%
   ⚠️ Running low! Sign in for unlimited generations
   ```

3. **Limit Reached**
   ```
   ❌ Daily Limit Reached
   You've used all 5 free AI generations today.
   Resets in: 8h 32m
   
   👑 Sign in for unlimited generations
   ```

### Benefits

#### For Users
- ✅ Can try AI features without account
- ✅ Clear visibility of remaining uses
- ✅ Predictable reset time
- ✅ Easy upgrade path (sign in)

#### For Platform
- ✅ Prevents API abuse
- ✅ Controls costs
- ✅ Encourages user registration
- ✅ Fair usage for all users
- ✅ Premium feature differentiation

## Technical Details

### localStorage Schema

```json
{
  "fomz_ai_usage": {
    "date": "2025-11-28",
    "count": 3
  }
}
```

### API Response Format

```javascript
// Success
{
  success: true,
  limitInfo: {
    allowed: true,
    remaining: 2,
    limit: 5,
    resetsAt: Date,
    isUnlimited: false
  }
}

// Limit Reached
{
  success: false,
  error: 'LIMIT_REACHED',
  limitInfo: {
    allowed: false,
    remaining: 0,
    limit: 5,
    resetsAt: Date,
    isUnlimited: false
  }
}

// Generation Failed
{
  success: false,
  error: 'GENERATION_FAILED',
  message: 'Error details...'
}
```

## Testing

### Test Scenarios

1. **Anonymous User - First Use**
   - Should show 5/5 available
   - Should allow generation
   - Should update to 4/5 after use

2. **Anonymous User - 5th Use**
   - Should show 1/5 remaining
   - Should show warning
   - Should allow generation
   - Should update to 0/5 after use

3. **Anonymous User - Limit Reached**
   - Should prevent generation
   - Should show error message
   - Should show time until reset
   - Should suggest sign-in

4. **Logged-In User**
   - Should show "Unlimited" or no limit UI
   - Should never block generation
   - Should not track usage

5. **Reset at Midnight**
   - Usage should reset at start of new day
   - Should work across different timezones

### Manual Testing Commands

```javascript
// Check current usage (in browser console)
localStorage.getItem('fomz_ai_usage')

// Manually set usage to 4 (test warning state)
localStorage.setItem('fomz_ai_usage', JSON.stringify({
  date: new Date().toISOString().split('T')[0],
  count: 4
}))

// Manually set usage to 5 (test limit reached)
localStorage.setItem('fomz_ai_usage', JSON.stringify({
  date: new Date().toISOString().split('T')[0],
  count: 5
}))

// Reset usage (test fresh state)
localStorage.removeItem('fomz_ai_usage')
```

## Future Enhancements

### Possible Improvements

1. **Flexible Limits**
   - Admin-configurable daily limits
   - Different tiers (free: 5, basic: 20, premium: unlimited)

2. **Backend Tracking**
   - Track by IP address for better enforcement
   - Prevent localStorage manipulation

3. **Grace Period**
   - Allow 1 extra use with "upgrade" prompt
   - Trial period for new users

4. **Usage Analytics**
   - Track conversion rates
   - Optimize limit based on data
   - A/B test different limits

5. **Reward System**
   - Earn extra generations
   - Referral bonuses
   - Daily streaks

## Marketing Angle

**Headline**: "Try Fomzy AI Free - 5 Generations Daily"

**Value Proposition**:
- No credit card required
- Try before signing up
- Sign in for unlimited access
- Fair usage for everyone

## Support

If users report issues:
1. Check browser localStorage is enabled
2. Verify date/time is correct
3. Clear localStorage if corrupted
4. Suggest signing in as workaround

## Changelog

### v1.0.0 (2025-11-28)
- Initial implementation
- 5 generations per day for anonymous users
- Unlimited for logged-in users
- Visual usage indicators
- Error handling and user feedback
