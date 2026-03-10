// ─── Vantage Circle Survey Automation - Background Service Worker ────────────

const VC_LOGIN_URL = "https://api.vantagecircle.co.in/";
const VC_SURVEY_BASE = "https://app.vantagecircle.co.in/ng/vantagepulse?id=";
const VC_DOMAINS = [".vantagecircle.co.in"];

let abortRequested = false;

// ─── Open side panel on extension icon click ────────────────────────────────

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

// ─── Cookie Clearing ────────────────────────────────────────────────────────

async function clearVCCookies() {
  for (const domain of VC_DOMAINS) {
    const cookies = await chrome.cookies.getAll({ domain });
    for (const cookie of cookies) {
      const protocol = cookie.secure ? "https" : "http";
      const url = `${protocol}://${cookie.domain.replace(/^\./, "")}${cookie.path}`;
      await chrome.cookies.remove({ url, name: cookie.name });
    }
  }
}

// ─── Wait for content script to be ready on a tab ───────────────────────────

function waitForContentScript(tabId, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function ping() {
      chrome.tabs.sendMessage(tabId, { type: "PING" }, (response) => {
        if (chrome.runtime.lastError) {
          if (Date.now() - startTime > timeout) {
            reject(new Error("Content script not ready (timeout)"));
            return;
          }
          setTimeout(ping, 500);
          return;
        }
        if (response && response.alive) {
          resolve();
        } else {
          setTimeout(ping, 500);
        }
      });
    }

    ping();
  });
}

// ─── Send message to content script (promisified) ───────────────────────────

function sendToContentScript(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

// ─── Navigate tab and wait for load ─────────────────────────────────────────

function navigateTab(tabId, url) {
  return new Promise((resolve) => {
    function onUpdated(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.update(tabId, { url });
  });
}

// ─── Inject content script if not already present ───────────────────────────

async function ensureContentScript(tabId) {
  try {
    await waitForContentScript(tabId, 3000);
  } catch {
    // Content script not present, inject it
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    await waitForContentScript(tabId, 10000);
  }
}

// ─── Broadcast to side panel ────────────────────────────────────────────────

function notifySidePanel(data) {
  chrome.runtime.sendMessage(data).catch(() => {
    // Side panel might not be open, ignore
  });
}

// ─── Single User Mode ───────────────────────────────────────────────────────

async function runSingleUser(tabId, surveyId) {
  notifySidePanel({ type: "STATUS", status: "running", message: "Starting single-user survey..." });

  try {
    // Navigate to survey
    const surveyUrl = `${VC_SURVEY_BASE}${surveyId}`;
    notifySidePanel({ type: "LOG", message: `Navigating to survey: ${surveyUrl}` });
    await navigateTab(tabId, surveyUrl);
    await new Promise((r) => setTimeout(r, 3000));

    // Ensure content script is running
    await ensureContentScript(tabId);

    // Run survey automation
    const result = await sendToContentScript(tabId, { type: "COMPLETE_SURVEY", surveyId });

    if (result && result.success) {
      notifySidePanel({ type: "STATUS", status: "completed", message: "Survey completed successfully!" });
    } else {
      notifySidePanel({
        type: "STATUS",
        status: "error",
        message: "Survey completion failed: " + (result?.error || "Unknown error"),
      });
    }
  } catch (error) {
    notifySidePanel({ type: "STATUS", status: "error", message: "Error: " + error.message });
  }
}

// ─── Multi User Mode ────────────────────────────────────────────────────────

async function runMultiUser(tabId, surveyId, credentials) {
  abortRequested = false;
  const total = credentials.length;
  let successCount = 0;
  let failCount = 0;

  notifySidePanel({
    type: "STATUS",
    status: "running",
    message: `Starting bulk automation for ${total} users...`,
  });

  for (let i = 0; i < total; i++) {
    if (abortRequested) {
      notifySidePanel({ type: "LOG", message: "Automation aborted by user" });
      break;
    }

    const user = credentials[i];
    const userNum = i + 1;

    notifySidePanel({
      type: "PROGRESS",
      current: userNum,
      total,
      success: successCount,
      fail: failCount,
      email: user.email,
    });

    notifySidePanel({ type: "LOG", message: `── Processing User ${userNum}/${total}: ${user.email} ──` });

    try {
      // Step 1: Clear cookies
      await clearVCCookies();
      notifySidePanel({ type: "LOG", message: "Cookies cleared" });

      // Step 2: Navigate to login page
      await navigateTab(tabId, VC_LOGIN_URL);
      await new Promise((r) => setTimeout(r, 3000));

      // Step 3: Ensure content script
      await ensureContentScript(tabId);

      // Step 4: Login
      notifySidePanel({ type: "LOG", message: `Logging in as ${user.email}...` });
      const loginResult = await sendToContentScript(tabId, {
        type: "LOGIN",
        email: user.email,
        password: user.password,
      });

      if (!loginResult || !loginResult.success) {
        throw new Error("Login failed: " + (loginResult?.error || "Unknown"));
      }

      // Step 5: Navigate to survey
      const surveyUrl = `${VC_SURVEY_BASE}${surveyId}`;
      notifySidePanel({ type: "LOG", message: "Navigating to survey..." });
      await navigateTab(tabId, surveyUrl);
      await new Promise((r) => setTimeout(r, 3000));

      // Step 6: Ensure content script on the new page
      await ensureContentScript(tabId);

      // Step 7: Complete survey
      notifySidePanel({ type: "LOG", message: "Completing survey..." });
      const surveyResult = await sendToContentScript(tabId, {
        type: "COMPLETE_SURVEY",
        surveyId,
      });

      if (surveyResult && surveyResult.success) {
        successCount++;
        notifySidePanel({ type: "LOG", message: `Survey completed for ${user.email}` });
      } else {
        failCount++;
        notifySidePanel({
          type: "LOG",
          message: `Survey failed for ${user.email}: ${surveyResult?.error || "Unknown"}`,
        });
      }
    } catch (error) {
      failCount++;
      notifySidePanel({ type: "LOG", message: `Error for ${user.email}: ${error.message}` });
    }

    // Update progress
    notifySidePanel({
      type: "PROGRESS",
      current: userNum,
      total,
      success: successCount,
      fail: failCount,
      email: user.email,
    });
  }

  notifySidePanel({
    type: "STATUS",
    status: "completed",
    message: `Bulk automation finished. Success: ${successCount}, Failed: ${failCount}`,
  });
}

// ─── Message Handler ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_SINGLE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        runSingleUser(tabs[0].id, message.surveyId);
      }
    });
    sendResponse({ started: true });
    return;
  }

  if (message.type === "START_MULTI") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        runMultiUser(tabs[0].id, message.surveyId, message.credentials);
      }
    });
    sendResponse({ started: true });
    return;
  }

  if (message.type === "ABORT") {
    abortRequested = true;
    sendResponse({ aborted: true });
    return;
  }

  // Forward LOG messages from content script to side panel
  if (message.type === "LOG" && sender.tab) {
    notifySidePanel(message);
    return;
  }
});
