// ─── Vantage Circle Survey Automation - Side Panel Logic ─────────────────────

(function () {
  "use strict";

  // ─── DOM Elements ─────────────────────────────────────────────────────────

  const surveyIdInput = document.getElementById("surveyId");
  const btnSingleMode = document.getElementById("btnSingleMode");
  const btnMultiMode = document.getElementById("btnMultiMode");
  const singlePanel = document.getElementById("singlePanel");
  const multiPanel = document.getElementById("multiPanel");
  const btnStartSingle = document.getElementById("btnStartSingle");
  const btnStartMulti = document.getElementById("btnStartMulti");
  const fileInput = document.getElementById("fileInput");
  const fileInfo = document.getElementById("fileInfo");
  const progressSection = document.getElementById("progressSection");
  const progressText = document.getElementById("progressText");
  const currentEmail = document.getElementById("currentEmail");
  const progressBar = document.getElementById("progressBar");
  const successCountEl = document.getElementById("successCount");
  const failCountEl = document.getElementById("failCount");
  const statusBadge = document.getElementById("statusBadge");
  const btnStop = document.getElementById("btnStop");
  const logContainer = document.getElementById("logContainer");
  const btnClearLog = document.getElementById("btnClearLog");

  let credentials = [];
  let isRunning = false;

  // ─── Load saved survey ID ─────────────────────────────────────────────────

  chrome.storage.local.get(["surveyId"], (result) => {
    if (result.surveyId) {
      surveyIdInput.value = result.surveyId;
    }
  });

  surveyIdInput.addEventListener("change", () => {
    chrome.storage.local.set({ surveyId: surveyIdInput.value });
  });

  // ─── Mode Toggle ──────────────────────────────────────────────────────────

  btnSingleMode.addEventListener("click", () => {
    btnSingleMode.classList.add("active");
    btnMultiMode.classList.remove("active");
    singlePanel.classList.remove("hidden");
    multiPanel.classList.add("hidden");
  });

  btnMultiMode.addEventListener("click", () => {
    btnMultiMode.classList.add("active");
    btnSingleMode.classList.remove("active");
    multiPanel.classList.remove("hidden");
    singlePanel.classList.add("hidden");
  });

  // ─── File Import ──────────────────────────────────────────────────────────

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!Array.isArray(data)) {
          throw new Error("JSON must be an array of {email, password} objects");
        }

        // Validate structure
        const valid = data.every(
          (item) =>
            typeof item === "object" &&
            typeof item.email === "string" &&
            typeof item.password === "string"
        );

        if (!valid) {
          throw new Error("Each entry must have 'email' and 'password' string fields");
        }

        credentials = data;
        fileInfo.textContent = `${credentials.length} user(s) loaded`;
        fileInfo.style.color = "#27ae60";
        btnStartMulti.disabled = false;
        addLog(`Imported ${credentials.length} credentials from ${file.name}`, "success");
      } catch (err) {
        fileInfo.textContent = `Error: ${err.message}`;
        fileInfo.style.color = "#e74c3c";
        credentials = [];
        btnStartMulti.disabled = true;
        addLog(`Failed to import: ${err.message}`, "error");
      }
    };
    reader.readAsText(file);
  });

  // ─── Start Single User ────────────────────────────────────────────────────

  btnStartSingle.addEventListener("click", () => {
    if (isRunning) return;

    const surveyId = surveyIdInput.value.trim();
    if (!surveyId) {
      addLog("Please enter a survey ID", "error");
      return;
    }

    setRunning(true);
    addLog(`Starting single-user survey (ID: ${surveyId})...`, "info");

    chrome.runtime.sendMessage({
      type: "START_SINGLE",
      surveyId,
    });
  });

  // ─── Start Multi User ────────────────────────────────────────────────────

  btnStartMulti.addEventListener("click", () => {
    if (isRunning) return;

    const surveyId = surveyIdInput.value.trim();
    if (!surveyId) {
      addLog("Please enter a survey ID", "error");
      return;
    }

    if (credentials.length === 0) {
      addLog("Please import credentials first", "error");
      return;
    }

    setRunning(true);
    progressSection.classList.remove("hidden");
    addLog(`Starting bulk automation for ${credentials.length} users (Survey ID: ${surveyId})...`, "info");

    chrome.runtime.sendMessage({
      type: "START_MULTI",
      surveyId,
      credentials,
    });
  });

  // ─── Stop ─────────────────────────────────────────────────────────────────

  btnStop.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "ABORT" });
    addLog("Stop requested...", "error");
  });

  // ─── Clear Log ────────────────────────────────────────────────────────────

  btnClearLog.addEventListener("click", () => {
    logContainer.innerHTML = "";
  });

  // ─── Incoming Messages from Background ────────────────────────────────────

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "LOG") {
      // Classify log messages
      let logType = "info";
      const msg = message.message || "";
      if (msg.includes("Error") || msg.includes("failed") || msg.includes("Failed")) {
        logType = "error";
      } else if (msg.includes("success") || msg.includes("completed") || msg.includes("Success")) {
        logType = "success";
      }
      addLog(msg, logType);
    }

    if (message.type === "PROGRESS") {
      const pct = Math.round((message.current / message.total) * 100);
      progressBar.style.width = pct + "%";
      progressText.textContent = `${message.current} / ${message.total} users`;
      currentEmail.textContent = message.email || "";
      successCountEl.textContent = `${message.success} passed`;
      failCountEl.textContent = `${message.fail} failed`;
    }

    if (message.type === "STATUS") {
      setStatus(message.status, message.message);

      if (message.status === "completed" || message.status === "error") {
        setRunning(false);
      }
    }
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function setRunning(running) {
    isRunning = running;
    btnStartSingle.disabled = running;
    btnStartMulti.disabled = running || credentials.length === 0;
    surveyIdInput.disabled = running;
    fileInput.disabled = running;

    if (running) {
      btnStop.classList.remove("hidden");
    } else {
      btnStop.classList.add("hidden");
    }
  }

  function setStatus(status, message) {
    statusBadge.textContent = message || status;
    statusBadge.className = "status-badge";
    if (status === "running") statusBadge.classList.add("running");
    else if (status === "completed") statusBadge.classList.add("completed");
    else if (status === "error") statusBadge.classList.add("error");
  }

  function addLog(message, type = "info") {
    const entry = document.createElement("p");
    entry.className = `log-entry log-${type}`;
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    entry.textContent = `[${time}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }
})();
