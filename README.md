# Vantage Circle Survey Automation

This project automates survey completion for multiple users on the Vantage Circle platform using Playwright and Node.js.

## Features

- ✅ Automated login for 50+ users
- ✅ Survey navigation and completion
- ✅ Parallel execution (3 workers by default)
- ✅ Credential management from JSON file
- ✅ Error handling and screenshots
- ✅ Detailed logging
- ✅ HTML test reports

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npm run install:browsers
```

## Configuration

### 1. Add User Credentials

Edit `data/credentials.json` and add your user credentials:

```json
[
  {
    "email": "user1@example.com",
    "password": "password1"
  },
  {
    "email": "user2@example.com",
    "password": "password2"
  }
  // Add up to 50 users...
]
```

### 2. Configure Survey ID

In `tests/survey-automation.spec.js`, update the survey ID if needed:

```javascript
const SURVEY_ID = '737'; // Change this to your survey ID
```

### 3. Adjust Settings

In `tests/survey-automation.spec.js`, you can modify:

```javascript
const MAX_USERS = 50;           // Maximum number of users to process
const PARALLEL_WORKERS = 3;     // Number of parallel executions
```

In `playwright.config.js`, you can adjust:

```javascript
workers: 3,              // Number of parallel workers
headless: false,         // Set to true for headless mode (no browser UI)
timeout: 180 * 1000,     // Test timeout (3 minutes)
```

## Usage

### Run All Tests (50 users)

```bash
npm test
```

### Run Tests in Headed Mode (see browser)

```bash
npm run test:headed
```

### Run Single User Test (for testing)

```bash
npm run test:single
```

### Run in Debug Mode

```bash
npm run test:debug
```

### Run with UI Mode (Interactive)

```bash
npm run test:ui
```

### View HTML Report

After tests complete:

```bash
npm run report
```

## Project Structure

```
survey-automation/
├── pages/
│   ├── BasePage.js           # Base page object class
│   └── LoginPage.js          # Login and survey automation logic
├── tests/
│   └── survey-automation.spec.js  # Main test file
├── data/
│   └── credentials.json      # User credentials (add your data here)
├── test-results/             # Test artifacts (screenshots, videos, reports)
├── error-screenshots/        # Error screenshots
├── playwright.config.js      # Playwright configuration
├── package.json             # Project dependencies
└── README.md               # This file
```

## How It Works

For each user, the automation:

1. **Navigates** to `https://api.vantagecircle.co.in/`
2. **Logs in** with the user's credentials
3. **Handles** any popup dialogs (redeem popup)
4. **Clicks** the "Work" button in navigation
5. **Navigates** to the survey URL: `https://app.vantagecircle.co.in/ng/vantagepulse?id=737`
6. **Starts** the survey
7. **Answers** all survey questions (selects middle/neutral options)
8. **Submits** the survey
9. **Logs out**

## Parallel Execution

By default, 3 users are processed in parallel. You can adjust this in:

- `playwright.config.js`: Change the `workers` setting
- `tests/survey-automation.spec.js`: Change `PARALLEL_WORKERS`

## Error Handling

- Screenshots are automatically taken on failures
- Tests retry once on failure
- Detailed console logging for debugging
- HTML reports with test results

## Customization

### Modify Survey Answering Logic

Edit the `answerSurveyQuestions()` method in `pages/LoginPage.js` to customize how questions are answered.

### Add More Selectors

If elements are not found, add more selectors to the arrays in `LoginPage.js`:

```javascript
const startButtonSelectors = [
    "//button[contains(text(), 'Start Survey')]",
    "button:has-text('Start Survey')",
    // Add more selectors here
];
```

## Troubleshooting

### Browser Not Installed
```bash
npm run install:browsers
```

### Element Not Found Errors
- Check if selectors in `LoginPage.js` match your application
- Increase timeout values
- Run in headed mode to see what's happening

### Login Failures
- Verify credentials in `data/credentials.json`
- Check if the login page structure has changed
- Increase wait times after login

### Survey Not Completing
- Run single user test to debug: `npm run test:single`
- Check survey selectors in `answerSurveyQuestions()` method
- Enable debug mode: `npm run test:debug`

## Performance Tips

1. **Reduce parallel workers** if system resources are limited
2. **Enable headless mode** for faster execution
3. **Disable video recording** in `playwright.config.js` for speed
4. **Batch processing**: Process users in smaller batches

## Notes

- The current implementation uses generic selectors for survey questions
- You may need to customize the `answerSurveyQuestions()` method based on your specific survey structure
- Always test with a single user first before running bulk automation
- Respect rate limits and terms of service of the platform

## License

ISC
