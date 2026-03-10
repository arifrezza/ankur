const { test } = require("@playwright/test");
const LoginPage = require("../pages/LoginPage");
const fs = require("fs");
const path = require("path");

// Read credentials from JSON file
const credentialsPath = path.join(__dirname, "../data", "credentials.json");
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

// Survey ID
const SURVEY_ID = "746";

// Configuration
const MAX_USERS = 50; // Maximum number of users to process
const HEADLESS = false; // Set to true for headless mode
const PARALLEL_WORKERS = 3; // Number of parallel executions

test.describe("Mass Survey Automation", () => {
  // Process each user's credentials
  credentials.slice(0, MAX_USERS).forEach((user, index) => {
    test(`User ${index + 1}: ${user.email} - Complete Survey`, async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);

      try {
        console.log(
          `\n========== Processing User ${index + 1}/${Math.min(MAX_USERS, credentials.length)} ==========`,
        );
        console.log(`Email: ${user.email}`);

        // Step 1: Navigate to login page
        await loginPage.navigateToLoginPage();

        // Step 2: Login
        await loginPage.login(user.email, user.password);

        // Step 3: Handle redeem popup (if any)
        await loginPage.handleRedeemPopup();

        // Step 4: Complete survey (navigate to survey, attempt all questions, submit)
        const success = await loginPage.completeSurvey(SURVEY_ID);

        if (success) {
          console.log(`✓ Survey completed successfully for ${user.email}`);
        } else {
          console.log(`✗ Survey completion failed for ${user.email}`);
        }

        // Step 5: Reset for next user (go back to login page)
        await loginPage.resetForNextUser();

        console.log(`========== Finished User ${index + 1} ==========\n`);
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error.message);

        // Take screenshot on error
        try {
          await page.screenshot({
            path: `error-screenshots/user-${index + 1}-${Date.now()}.png`,
            fullPage: true,
          });
        } catch (screenshotError) {
          console.log("Could not take screenshot");
        }
      }
    });
  });
});

// Individual test for single user (for testing purposes)
test.describe("Single User Survey Test", () => {
  test.skip("Test single user survey flow", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Use first user from credentials
    const testUser = credentials[0];

    console.log(`Testing with user: ${testUser.email}`);

    await loginPage.navigateToLoginPage();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.handleRedeemPopup();
    await loginPage.completeSurvey(SURVEY_ID);
    await loginPage.resetForNextUser();

    console.log("Single user test completed");
  });
});
