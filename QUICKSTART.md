# Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
npm run install:browsers
```

### 2. Add Your Credentials

**Option A: Manual Entry**
Edit `data/credentials.json` and add your users:
```json
[
  {
    "email": "your.email@example.com",
    "password": "yourpassword"
  },
  {
    "email": "another.email@example.com",
    "password": "anotherpassword"
  }
]
```

**Option B: Generate Sample Template**
```bash
node generate-credentials.js 50
```
Then edit `data/credentials.json` with real credentials.

### 3. Update Survey ID (if different)
Edit `tests/survey-automation.spec.js`:
```javascript
const SURVEY_ID = '737'; // Change this if needed
```

## Running Tests

### Test Single User First (Recommended)
```bash
npm run test:single
```
This runs with the first user in your credentials file to verify everything works.

### Run All Users in Parallel (3 at a time)
```bash
npm test
```

### Run All Users Sequentially (one at a time)
```bash
npm run test:sequential
```
Better for avoiding rate limits or if you have limited system resources.

### Run with Browser Visible (Debug Mode)
```bash
npm run test:headed
```

## What Happens During Execution

For each user:
1. ✓ Login to api.vantagecircle.co.in
2. ✓ Handle any popups
3. ✓ Click "Work" button
4. ✓ Navigate to survey (id=737)
5. ✓ Start survey
6. ✓ Answer all questions (neutral/middle options)
7. ✓ Submit survey
8. ✓ Logout

## View Results

After tests complete:
```bash
npm run report
```

This opens an HTML report showing:
- ✅ Which users succeeded
- ❌ Which users failed
- ⏱️ Execution time
- 📸 Screenshots of failures

## Troubleshooting

### "Element not found" errors
- Run in headed mode: `npm run test:headed`
- Check if website structure changed
- Increase timeouts in `playwright.config.js`

### Login failures
- Verify credentials in `data/credentials.json`
- Check if password is correct
- Try single user test first

### Too slow
- Use parallel execution: `npm test`
- Increase workers in `playwright.config.js`
- Enable headless mode

### System overload
- Use sequential: `npm run test:sequential`
- Reduce workers to 1-2
- Process in smaller batches

## Tips

1. **Always test with 1 user first** before running all 50
2. **Run in headed mode initially** to see what's happening
3. **Check error screenshots** in `error-screenshots/` folder
4. **Use sequential mode** if you're hitting rate limits
5. **Review HTML report** after each run

## Need Help?

Check the full README.md for detailed documentation.
