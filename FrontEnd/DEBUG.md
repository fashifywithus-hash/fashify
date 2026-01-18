# Debugging Guide - Fashify Recommendations

## How to See Logs

### Browser Console (Most Important)

1. **Open Developer Tools:**
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Press `Cmd+Option+I` (need to enable Developer menu first)

2. **Go to Console Tab:**
   - Click on the "Console" tab in the developer tools

3. **Look for these logs:**
   - `Loaded X items from inventory` - Shows if CSV loaded successfully
   - `User preferences:` - Shows your saved preferences
   - `Available genders in inventory:` - Shows what genders exist in CSV
   - `Scored X items` - Shows how many items passed filtering
   - `Recommendations: X shirts, X jackets, X jeans, X shoes` - Final counts
   - Any errors in red

### Server Logs (Terminal)

If you started the server in a terminal, you'll see:
- Vite build logs
- Any server errors
- Hot reload messages

### Common Issues & Solutions

#### Issue 1: "No recommendations found"

**Check Console For:**
- `No items passed the scoring filter!`
- Gender mismatch messages
- `Available genders in inventory:` vs your gender

**Common Causes:**
- Gender mismatch: If you selected "female" but inventory only has "Male" items
- All items have score 0 (maybe due to very strict preferences)

**Solution:**
1. Check console logs to see what gender you selected vs what's in inventory
2. Try updating your preferences to match available items
3. Check if your profile saved correctly in Supabase

#### Issue 2: CSV not loading

**Check Console For:**
- `Error loading inventory CSV`
- `Failed to load inventory`

**Solution:**
1. Verify CSV file exists at `public/Backend/Item-attributes.csv`
2. Check network tab in browser console to see if CSV request failed
3. Try accessing CSV directly: `http://localhost:8080/Backend/Item-attributes.csv`

#### Issue 3: All items filtered out

**Check Console For:**
- `Scored 0 items`
- `X items with score = 0`

**Solution:**
1. Look at top scored items in console
2. Check match details to see why items are scoring 0
3. Verify your preferences saved correctly

## Quick Debug Steps

1. **Open Browser Console** (F12)
2. **Navigate to Suggestions page**
3. **Look for logs starting with:**
   - `Loaded` - CSV loading
   - `User preferences` - Your saved data
   - `Scored` - Item scoring
   - `Recommendations` - Final results
4. **Check for red errors**
5. **Share console logs** if still having issues

## Testing Checklist

- [ ] CSV file exists and is accessible
- [ ] User profile saved in Supabase
- [ ] Gender matches inventory (Male/Female/Unisex)
- [ ] Console shows items being loaded
- [ ] Console shows items being scored
- [ ] No errors in console
