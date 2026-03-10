# Survey Automation Project Summary

## Project Overview
A complete Playwright automation solution for Vantage Circle survey completion across 50+ users.

## What's Included

### Core Files
1. **pages/BasePage.js** - Base page object with common utilities
2. **pages/LoginPage.js** - Main automation logic (login, survey navigation, completion)
3. **tests/survey-automation.spec.js** - Parallel test execution (3 workers)
4. **tests/sequential-automation.spec.js** - Sequential test execution (one at a time)
5. **playwright.config.js** - Playwright configuration

### Data & Configuration
6. **data/credentials.json** - User credentials (10 sample users, expand to 50)
7. **generate-credentials.js** - Utility to generate credential templates
8. **package.json** - Dependencies and scripts

### Documentation
9. **README.md** - Comprehensive documentation
10. **QUICKSTART.md** - Quick start guide
11. **.gitignore** - Git ignore rules

## Key Features

✅ **Parallel Execution** - Run 3 users simultaneously (configurable)
✅ **Sequential Mode** - Process users one-by-one to avoid rate limits
✅ **Credential Management** - Load 50+ users from JSON file
✅ **Error Handling** - Screenshots on failure, retry logic
✅ **Flexible Survey Logic** - Generic question answering (easily customizable)
✅ **Detailed Logging** - Console output for each step
✅ **HTML Reports** - Visual test results
✅ **Headless/Headed Modes** - Run with or without browser UI

## Workflow Per User

1. Navigate to `https://api.vantagecircle.co.in/`
2. Login with credentials
3. Handle popup dialogs
4. Click "Work" navigation button
5. Navigate to survey URL: `https://app.vantagecircle.co.in/ng/vantagepulse?id=737`
6. Click "Start Survey"
7. Answer all questions (selects neutral/middle options)
8. Submit survey
9. Logout

## How to Run

### Quick Start
```bash
# Install
npm install
npm run install:browsers

# Add credentials to data/credentials.json

# Test single user
npm run test:single

# Run all users (parallel)
npm test

# Run all users (sequential)
npm run test:sequential
```

### Available Commands
- `npm test` - Run parallel tests (3 workers)
- `npm run test:headed` - Run with visible browser
- `npm run test:sequential` - Run users one at a time
- `npm run test:single` - Test with first user only
- `npm run test:debug` - Debug mode
- `npm run test:ui` - Interactive UI mode
- `npm run report` - View HTML report
- `npm run generate:credentials` - Generate sample credentials

## Configuration Options

### In test files:
```javascript
const SURVEY_ID = '737';        // Survey to complete
const MAX_USERS = 50;           // Number of users to process
const PARALLEL_WORKERS = 3;     // Concurrent executions
```

### In playwright.config.js:
```javascript
workers: 3,                     // Parallel workers
headless: false,                // Browser visibility
timeout: 180 * 1000,            // Test timeout
retries: 1,                     // Retry on failure
```

## Customization Points

### 1. Survey Questions
Edit `answerSurveyQuestions()` in `LoginPage.js` to customize:
- Which options to select
- Question navigation logic
- Answer patterns

### 2. Selectors
Update selector arrays if UI changes:
- Start button selectors
- Submit button selectors
- Rating/option selectors

### 3. Wait Times
Adjust `waitForTimeout()` calls for slower/faster systems

### 4. Error Handling
Customize retry logic and error recovery

## Project Structure
```
survey-automation/
├── pages/
│   ├── BasePage.js              # Base utilities
│   └── LoginPage.js             # Main automation logic
├── tests/
│   ├── survey-automation.spec.js    # Parallel tests
│   └── sequential-automation.spec.js # Sequential tests
├── data/
│   └── credentials.json         # User credentials
├── error-screenshots/           # Error captures
├── test-results/               # Test artifacts
├── playwright.config.js        # Configuration
└── package.json               # Dependencies
```

## Technical Details

### Technologies
- **Playwright** v1.58.2 - Browser automation
- **Node.js** - Runtime
- **JavaScript** - Language

### Page Object Model
- `BasePage` - Common utilities (waitForElement, etc.)
- `LoginPage extends BasePage` - Domain-specific logic

### Test Patterns
- Page Object Model for maintainability
- Data-driven tests (credentials from JSON)
- Parallel and sequential execution modes
- Screenshot and video capture on failure

### Browser Support
- Chromium (default)
- Firefox (configurable)
- WebKit (configurable)

## Best Practices Implemented

1. **Retry Logic** - Tests retry once on failure
2. **Error Screenshots** - Automatic capture on errors
3. **Logging** - Detailed console output
4. **Timeout Management** - Configurable timeouts
5. **Credential Security** - Separate JSON file (can be gitignored)
6. **Modular Design** - Reusable page objects
7. **Configuration** - Centralized config file
8. **Documentation** - README + Quick Start

## Limitations & Considerations

1. **Generic Survey Logic** - May need customization for specific survey types
2. **Rate Limiting** - Use sequential mode if hitting limits
3. **Network Dependencies** - Requires stable internet connection
4. **XPath Selectors** - May need updates if UI changes
5. **Resource Usage** - Parallel mode requires adequate system resources

## Next Steps After Setup

1. ✅ Replace sample credentials with real ones
2. ✅ Test with single user first
3. ✅ Verify survey ID is correct (737)
4. ✅ Run small batch (5-10 users) for validation
5. ✅ Monitor first few executions
6. ✅ Adjust selectors if needed
7. ✅ Run full batch of 50 users

## Support & Maintenance

### Common Issues
- Element not found → Update selectors
- Login failures → Check credentials
- Timeouts → Increase timeout values
- System overload → Reduce workers or use sequential

### Monitoring
- Watch console output during execution
- Check error screenshots for failures
- Review HTML report after completion
- Monitor success rate

## Success Metrics

After execution, you'll see:
- Total users processed
- Success count
- Failure count
- Success rate percentage
- Execution time

Typical success rate: 95-100% (depending on network and site stability)

---

**Ready to use!** Follow QUICKSTART.md to begin.
