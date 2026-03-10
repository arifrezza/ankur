const BasePage = require('./BasePage');

class LoginPage extends BasePage {
    constructor(page) {
        super(page);
    }

    // ─── Navigate to Login Page ───────────────────────────────────────────────
    async navigateToLoginPage() {
        await this.page.goto('https://api.vantagecircle.co.in/');
        const title = await this.page.title();
        console.log(`Page title: ${title}`);
    }

    // ─── Ensure Logged Out ────────────────────────────────────────────────────
    async ensureLoggedOut() {
        try {
            const currentUrl = this.page.url();
            if (currentUrl.includes('vantagecircle.co.in/ng') || currentUrl.includes('app.vantagecircle')) {
                console.log("Previous session detected, resetting to login page...");
                await this.page.goto('https://api.vantagecircle.co.in/');
                await this.page.waitForTimeout(2000);
            }
        } catch (error) {
            console.log("ensureLoggedOut check skipped:", error.message);
        }
    }

    // ─── Login ────────────────────────────────────────────────────────────────
    async login(email, password) {
        console.log(`Attempting login for: ${email}`);
        
        // Click login dropdown
        await this.waitForElement('(//button[@id="logindropdown"])[1]');
        await this.page.click('(//button[@id="logindropdown"])[1]');

        // Fill email
        await this.waitForElement("//form[@id='login-form']//input[@id='LoginForm_email']");
        await this.page.fill("//form[@id='login-form']//input[@id='LoginForm_email']", email);

        // Fill password
        await this.waitForElement("//input[@id='LoginForm_password']");
        await this.page.fill("//input[@id='LoginForm_password']", password);
        
        // Click login button
        await this.waitForElement("//button[@id='loginbtn']");
        await this.page.click("//button[@id='loginbtn']");
        
        // Wait for login to complete
        await this.page.waitForTimeout(4000);
    }

    // ─── Handle Redeem Popup ──────────────────────────────────────────────────
    async handleRedeemPopup() {
        try {
            // Wait for popup to appear
            await this.waitForElement("//div[@class='dialog-body dining_disclaimer p-2']", 10000);
            
            // Click the X close button
            await this.page.click("//*[@id='Capa_1']");
            
            await this.page.waitForTimeout(2000);
            console.log("Redeem popup handled");
        } catch (error) {
            console.log("Redeem popup not found or already handled:", error.message);
        }
    }

    // ─── Navigate to Survey ───────────────────────────────────────────────────
    async navigateToSurvey(surveyId) {
        const surveyUrl = `https://app.vantagecircle.co.in/ng/vantagepulse?id=${surveyId}`;
        console.log(`Navigating to survey: ${surveyUrl}`);
        await this.page.goto(surveyUrl);
        await this.page.waitForTimeout(3000);
        
        // Handle redeem popup if it appears on survey page
        await this.handleRedeemPopup();
    }

    // ─── Complete Survey (Main Wrapper) ───────────────────────────────────────
    async completeSurvey(surveyId) {
        try {
            await this.navigateToSurvey(surveyId);
            await this.attemptSurvey();
            return true;
        } catch (error) {
            console.log("Error completing survey:", error.message);
            return false;
        }
    }

    // ─── Attempt Survey (Smart Question Handler) ──────────────────────────────
    async attemptSurvey() {
        try {
            console.log("Starting survey...");
            
            // Click start/accept button if present
            try {
                await this.waitForElement("//div[@class='vc-accept-button-small vc-smooth vc-pulse vc_transform_c']", 10000);
                await this.page.click("//div[@class='vc-accept-button-small vc-smooth vc-pulse vc_transform_c']");
                console.log("Survey start button clicked");
                await this.page.waitForTimeout(2000);
            } catch (e) {
                console.log("No start button found, continuing...");
            }
            
            // Keep answering questions until submit button appears
            let questionHandled = true;
            
            while (questionHandled) {
                questionHandled = false;
                await this.page.waitForTimeout(1000);

                // Check which question type is currently visible
                const isRating = await this.page.locator("//*[@class='questionscale']").isVisible().catch(() => false);
                const isMCQ = await this.page.locator("//mat-radio-button[@id='mat-radio-4']").isVisible().catch(() => false);
                const isOpenEnded = await this.page.locator("//div[@class='question_wrapper']").isVisible().catch(() => false);

                if (isRating) {
                    await this.handleRatingQuestion();
                    questionHandled = true;

                } else if (isMCQ) {
                    await this.handleMCQQuestion();
                    questionHandled = true;

                } else if (isOpenEnded) {
                    await this.handleOpenEndedQuestion();
                    questionHandled = true;
                }

                // Try to click Next button to advance to the next question
                if (questionHandled) {
                    try {
                        const nextBtn = this.page.locator("//button[normalize-space()='Next']");
                        const isNextVisible = await nextBtn.isVisible().catch(() => false);
                        if (isNextVisible) {
                            await nextBtn.click();
                            await this.page.waitForTimeout(1000);
                            console.log("Clicked Next button");
                        }
                    } catch (e) {
                        // Next button not found, survey may auto-advance
                    }
                }

                // Check if submit button is visible, break if so
                const isSubmitVisible = await this.page.locator("//button[normalize-space()='Submit']").isVisible().catch(() => false);
                if (isSubmitVisible) {
                    console.log("Submit button found, breaking loop");
                    break;
                }
            }

            // Submit the survey
            await this.submitSurvey();

        } catch (error) {
            console.log("Error during survey attempt:", error.message);
        }
    }

    // ─── Handler: Rating Scale ────────────────────────────────────────────────
    async handleRatingQuestion() {
        try {
            console.log("Handling Rating question...");

            await this.waitForElement("//*[@class='questionscale']", 5000);

            // Select rating 4
            //await this.page.click("//*[@class='questionscale']//*[@class='rating-value']//*[name()='svg'][4]"); // //*[@id="fluent:emoji-32-regular"]
            await this.page.click("//*[@id='fluent:emoji-32-regular']");
            console.log("Selected rating 4");

            await this.page.waitForTimeout(500);

            // Fill textarea below rating (use broad selector — Angular changes ng- classes)
            const textarea = this.page.locator("textarea").first();
            const hasTextarea = await textarea.isVisible().catch(() => false);

            if (hasTextarea) {
                await textarea.click();
                await textarea.fill("Nice one");
                console.log("Filled rating textarea");
            }

            await this.page.waitForTimeout(500);

        } catch (error) {
            console.log("Error handling rating question:", error.message);
        }
    }

    // ─── Handler: MCQ ─────────────────────────────────────────────────────────
    async handleMCQQuestion() {
        try {
            console.log("Handling MCQ question...");

            // Wait for the radio button itself (question_wrapper may not exist)
            await this.waitForElement("//mat-radio-button[@id='mat-radio-4']", 5000);

            // Angular Material needs click on the inner label, not the outer element
            const radioLabel = this.page.locator("//mat-radio-button[@id='mat-radio-4']//label");
            const radioInput = this.page.locator("//mat-radio-button[@id='mat-radio-4']//input");

            // Try label first, then input, then outer element
            if (await radioLabel.isVisible().catch(() => false)) {
                await radioLabel.click();
                console.log("Selected MCQ option via label");
            } else if (await radioInput.count() > 0) {
                await radioInput.click({ force: true });
                console.log("Selected MCQ option via input");
            } else {
                await this.page.click("//mat-radio-button[@id='mat-radio-4']");
                console.log("Selected MCQ option via outer element");
            }

            await this.page.waitForTimeout(1000);

            // Fill textarea if present
            const textarea = this.page.locator("textarea").first();
            const hasTextarea = await textarea.isVisible().catch(() => false);

            if (hasTextarea) {
                await textarea.click();
                await textarea.fill("Nice one MCQ");
                console.log("Filled MCQ textarea");
            }

            await this.page.waitForTimeout(500);

        } catch (error) {
            console.log("Error handling MCQ question:", error.message);
        }
    }

    // ─── Handler: Open Ended ──────────────────────────────────────────────────
    async handleOpenEndedQuestion() {
        try {
            console.log("Handling Open Ended question...");

            // Use a broader textarea selector (Angular changes ng- classes dynamically)
            const textarea = this.page.locator("textarea").first();
            await textarea.waitFor({ state: 'visible', timeout: 5000 });
            await textarea.click();
            await textarea.fill("Nice one with openEnded");
            console.log("Filled open ended textarea");

            await this.page.waitForTimeout(500);

        } catch (error) {
            console.log("Error handling open ended question:", error.message);
        }
    }

    // ─── Submit Survey ────────────────────────────────────────────────────────
    async submitSurvey() {
        try {
            console.log("Submitting survey...");

            // Wait for the Submit button to be visible
            const submitBtn = this.page.locator("//button[normalize-space()='Submit']");
            await submitBtn.waitFor({ state: 'visible', timeout: 10000 });

            // Wait for the button to become enabled (not disabled)
            await this.page.waitForFunction(() => {
                const btn = document.querySelector('button');
                const buttons = document.querySelectorAll('button');
                for (const b of buttons) {
                    if (b.textContent.trim() === 'Submit' && !b.disabled) return true;
                }
                return false;
            }, { timeout: 15000 });

            console.log("Submit button is enabled, clicking...");
            await submitBtn.click();
            console.log("Survey submitted successfully!");
            await this.page.waitForTimeout(2000);
        } catch (error) {
            console.log("Error submitting survey:", error.message);
        }
    }

    // ─── Reset for Next User ──────────────────────────────────────────────────
    async resetForNextUser() {
        try {
            console.log("Resetting browser for next user...");

            // Clear cookies and storage so the next user gets a fresh login page
            const context = this.page.context();
            await context.clearCookies();
            await this.page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            // Navigate back to login page (now with clean session)
            await this.page.goto('https://api.vantagecircle.co.in/');
            await this.page.waitForTimeout(2000);

            console.log("Ready for next user");
        } catch (error) {
            console.log("Error during reset:", error.message);
        }
    }

    // ─── Logout (kept for reference, not used in automation) ──────────────────
    async logout() {
        try {
            // Click profile
            await this.waitForElement("(//img[@alt='profileImage'])[1]", 10000);
            await this.page.click("(//img[@alt='profileImage'])[1]");
            await this.page.waitForTimeout(1000);

            // Click logout
            const logoutSelectors = [
                "//span[contains(text(), 'Logout')]",
                "//button[contains(text(), 'Logout')]",
                "a:has-text('Logout')"
            ];

            for (const selector of logoutSelectors) {
                try {
                    await this.page.click(selector);
                    console.log("Logged out successfully");
                    await this.page.waitForTimeout(2000);
                    break;
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            console.log("Error during logout:", error.message);
        }
    }
}

module.exports = LoginPage;