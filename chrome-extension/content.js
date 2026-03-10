// ─── Vantage Circle Survey Automation - Content Script ──────────────────────
// Ported from pages/LoginPage.js (Playwright) to native DOM APIs

(function () {
  "use strict";

  // ─── Utilities ──────────────────────────────────────────────────────────────

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Query an element by XPath and return the first match.
   */
  function queryXPath(xpath) {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  }

  /**
   * Query all elements matching an XPath expression.
   */
  function queryAllXPath(xpath) {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    const nodes = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i));
    }
    return nodes;
  }

  /**
   * Check if an element is visible (non-zero dimensions and not hidden).
   */
  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  /**
   * Wait for an element matching the selector (XPath or CSS) to appear.
   */
  function waitForElement(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const isXPath = selector.startsWith("/") || selector.startsWith("(");

      function check() {
        const el = isXPath ? queryXPath(selector) : document.querySelector(selector);
        if (el && isElementVisible(el)) {
          resolve(el);
          return;
        }
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for element: ${selector}`));
          return;
        }
        requestAnimationFrame(check);
      }

      check();
    });
  }

  /**
   * Set an input/textarea value in a way that Angular detects the change.
   */
  function setInputValue(el, value) {
    // Focus the element
    el.focus();
    el.click();

    // Clear existing value
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));

    // Set new value
    el.value = value;

    // Dispatch events so Angular/React picks up the change
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  /**
   * Send a log message back to the background/sidepanel.
   */
  function log(message) {
    console.log(`[VC Survey] ${message}`);
    chrome.runtime.sendMessage({ type: "LOG", message });
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  async function login(email, password) {
    log(`Attempting login for: ${email}`);

    // Click login dropdown
    const loginDropdown = await waitForElement('(//button[@id="logindropdown"])[1]');
    loginDropdown.click();
    await sleep(1000);

    // Fill email
    const emailInput = await waitForElement(
      "//form[@id='login-form']//input[@id='LoginForm_email']"
    );
    setInputValue(emailInput, email);
    await sleep(500);

    // Fill password
    const passwordInput = await waitForElement("//input[@id='LoginForm_password']");
    setInputValue(passwordInput, password);
    await sleep(500);

    // Click login button
    const loginBtn = await waitForElement("//button[@id='loginbtn']");
    loginBtn.click();

    log("Login button clicked, waiting for page to load...");
    await sleep(4000);
  }

  // ─── Handle Redeem Popup ──────────────────────────────────────────────────

  async function handleRedeemPopup() {
    try {
      const popup = await waitForElement(
        "//div[@class='dialog-body dining_disclaimer p-2']",
        5000
      );
      if (popup) {
        const closeBtn = queryXPath("//*[@id='Capa_1']");
        if (closeBtn) {
          closeBtn.click();
          await sleep(1000);
          log("Redeem popup closed");
        }
      }
    } catch (e) {
      log("No redeem popup found (ok)");
    }
  }

  // ─── Handle Rating Question ───────────────────────────────────────────────

  async function handleRatingQuestion() {
    try {
      log("Handling Rating question...");

      await waitForElement("//*[@class='questionscale']", 5000);

      // Click the rating emoji (rating 4)
      const ratingEl = queryXPath("//*[@id='fluent:emoji-32-regular']");
      if (ratingEl) {
        ratingEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        log("Selected rating");
      }

      await sleep(500);

      // Fill textarea if present
      const textarea = document.querySelector("textarea");
      if (textarea && isElementVisible(textarea)) {
        setInputValue(textarea, "Nice one");
        log("Filled rating textarea");
      }

      await sleep(500);
    } catch (error) {
      log("Error handling rating question: " + error.message);
    }
  }

  // ─── Handle MCQ Question ─────────────────────────────────────────────────

  async function handleMCQQuestion() {
    try {
      log("Handling MCQ question...");

      await waitForElement("//mat-radio-button[@id='mat-radio-4']", 5000);

      // Try clicking the label first (Angular Material)
      const radioLabel = queryXPath("//mat-radio-button[@id='mat-radio-4']//label");
      const radioInput = queryXPath("//mat-radio-button[@id='mat-radio-4']//input");
      const radioOuter = queryXPath("//mat-radio-button[@id='mat-radio-4']");

      if (radioLabel && isElementVisible(radioLabel)) {
        radioLabel.click();
        log("Selected MCQ option via label");
      } else if (radioInput) {
        radioInput.click();
        log("Selected MCQ option via input");
      } else if (radioOuter) {
        radioOuter.click();
        log("Selected MCQ option via outer element");
      }

      await sleep(1000);

      // Fill textarea if present
      const textarea = document.querySelector("textarea");
      if (textarea && isElementVisible(textarea)) {
        setInputValue(textarea, "Nice one MCQ");
        log("Filled MCQ textarea");
      }

      await sleep(500);
    } catch (error) {
      log("Error handling MCQ question: " + error.message);
    }
  }

  // ─── Handle Open Ended Question ───────────────────────────────────────────

  async function handleOpenEndedQuestion() {
    try {
      log("Handling Open Ended question...");

      const textarea = document.querySelector("textarea");
      if (textarea && isElementVisible(textarea)) {
        setInputValue(textarea, "Nice one with openEnded");
        log("Filled open ended textarea");
      }

      await sleep(500);
    } catch (error) {
      log("Error handling open ended question: " + error.message);
    }
  }

  // ─── Submit Survey ────────────────────────────────────────────────────────

  async function submitSurvey() {
    try {
      log("Looking for Submit button...");

      const submitBtn = await waitForElement(
        "//button[normalize-space()='Submit']",
        10000
      );

      // Wait for button to be enabled
      let attempts = 0;
      while (submitBtn.disabled && attempts < 30) {
        await sleep(500);
        attempts++;
      }

      if (!submitBtn.disabled) {
        log("Submit button is enabled, clicking...");
        submitBtn.click();
        log("Survey submitted successfully!");
        await sleep(2000);
      } else {
        log("Submit button remained disabled");
      }
    } catch (error) {
      log("Error submitting survey: " + error.message);
    }
  }

  // ─── Attempt Survey (Smart Question Handler Loop) ─────────────────────────

  async function attemptSurvey() {
    log("Starting survey question loop...");

    // Click start/accept button if present
    try {
      const startBtn = await waitForElement(
        "//div[@class='vc-accept-button-small vc-smooth vc-pulse vc_transform_c']",
        8000
      );
      if (startBtn) {
        startBtn.click();
        log("Survey start button clicked");
        await sleep(2000);
      }
    } catch (e) {
      log("No start button found, continuing...");
    }

    // Keep answering questions until submit appears
    let questionHandled = true;

    while (questionHandled) {
      questionHandled = false;
      await sleep(1000);

      // Detect question type
      const ratingEl = queryXPath("//*[@class='questionscale']");
      const isRating = ratingEl && isElementVisible(ratingEl);

      const mcqEl = queryXPath("//mat-radio-button[@id='mat-radio-4']");
      const isMCQ = mcqEl && isElementVisible(mcqEl);

      const openEndedEl = queryXPath("//div[@class='question_wrapper']");
      const isOpenEnded = openEndedEl && isElementVisible(openEndedEl);

      if (isRating) {
        await handleRatingQuestion();
        questionHandled = true;
      } else if (isMCQ) {
        await handleMCQQuestion();
        questionHandled = true;
      } else if (isOpenEnded) {
        await handleOpenEndedQuestion();
        questionHandled = true;
      }

      // Try to click Next button
      if (questionHandled) {
        try {
          const nextBtn = queryXPath("//button[normalize-space()='Next']");
          if (nextBtn && isElementVisible(nextBtn)) {
            nextBtn.click();
            await sleep(1000);
            log("Clicked Next button");
          }
        } catch (e) {
          // Next button not found, survey may auto-advance
        }
      }

      // Check for Submit button
      const submitBtn = queryXPath("//button[normalize-space()='Submit']");
      if (submitBtn && isElementVisible(submitBtn)) {
        log("Submit button found, ending question loop");
        break;
      }
    }

    // Submit the survey
    await submitSurvey();
  }

  // ─── Message Handler ──────────────────────────────────────────────────────

  let isRunning = false;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "LOGIN") {
      (async () => {
        try {
          await login(message.email, message.password);
          await handleRedeemPopup();
          sendResponse({ success: true });
        } catch (error) {
          log("Login failed: " + error.message);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // keep message channel open for async response
    }

    if (message.type === "COMPLETE_SURVEY") {
      if (isRunning) {
        sendResponse({ success: false, error: "Already running" });
        return;
      }
      isRunning = true;

      (async () => {
        try {
          // Handle redeem popup on the survey page
          await handleRedeemPopup();
          await attemptSurvey();
          sendResponse({ success: true });
        } catch (error) {
          log("Survey completion failed: " + error.message);
          sendResponse({ success: false, error: error.message });
        } finally {
          isRunning = false;
        }
      })();
      return true;
    }

    if (message.type === "PING") {
      sendResponse({ alive: true });
      return;
    }
  });

  log("Content script loaded and ready");
})();
