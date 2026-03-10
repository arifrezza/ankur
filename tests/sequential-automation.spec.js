const { test } = require("@playwright/test");
const LoginPage = require("../pages/LoginPage");
const fs = require("fs");
const path = require("path");

/**
 * Sequential Survey Automation
 * This runs users one at a time instead of in parallel
 * Better for systems with limited resources or to avoid rate limiting
 */

// Read credentials from JSON file
const credentialsPath = path.join(__dirname, "../data", "credentials.json");
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

// Survey ID
const SURVEY_ID = "746";

// Configuration
const MAX_USERS = 50;

test.describe.configure({ mode: "serial" }); // Run tests serially

test.describe("Sequential Survey Automation", () => {
  let context;
  let page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("Process all users sequentially", async () => {
    const loginPage = new LoginPage(page);
    const usersToProcess = credentials.slice(0, MAX_USERS);
    let successCount = 0;
    let failCount = 0;

    console.log(
      `\n========== Starting Sequential Processing of ${usersToProcess.length} Users ==========\n`,
    );

    for (let i = 0; i < usersToProcess.length; i++) {
      const user = usersToProcess[i];
      console.log(
        `\n[${i + 1}/${usersToProcess.length}] Processing: ${user.email}`,
      );

      try {
        // Step 1: Navigate to login page
        await loginPage.navigateToLoginPage();

        // Step 2: Login
        await loginPage.login(user.email, user.password);

        // Step 3: Handle redeem popup (if any)
        await loginPage.handleRedeemPopup();

        // Step 4: Complete survey (navigate to survey, attempt all questions, submit)
        const success = await loginPage.completeSurvey(SURVEY_ID);

        if (success) {
          successCount++;
          console.log(`✓ SUCCESS: Survey completed for ${user.email}`);
        } else {
          failCount++;
          console.log(`✗ FAILED: Survey completion failed for ${user.email}`);
        }

        // Step 5: Reset for next user (go back to login page)
        await loginPage.resetForNextUser();

        // Small delay between users
        await page.waitForTimeout(2000);
      } catch (error) {
        failCount++;
        console.error(`✗ ERROR processing ${user.email}:`, error.message);

        // Take screenshot on error
        try {
          await page.screenshot({
            path: `error-screenshots/sequential-user-${i + 1}-${Date.now()}.png`,
            fullPage: true,
          });
        } catch (e) {
          console.log("Screenshot failed");
        }

        // Try to recover by going back to start
        try {
          await page.goto("https://api.vantagecircle.co.in/");
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log("Recovery failed");
        }
      }
    }

    console.log(`\n========== Processing Complete ==========`);
    console.log(`Total Users: ${usersToProcess.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(
      `Success Rate: ${((successCount / usersToProcess.length) * 100).toFixed(2)}%`,
    );
    console.log(`==========================================\n`);
  });
});
