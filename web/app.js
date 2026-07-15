/* Secure P2P Messenger — UI logic (architecture.md §3.1, §10).
 *
 * The browser performs NO cryptography. It sends plaintext to its own backend
 * over /ws/ui and receives already-decrypted plaintext back, along with the
 * ciphertext for display. All message shapes below are the /ws/ui contract
 * between this UI and YOUR backend — adjust field names to match main.py.
 */

(() => {
  "use strict";

  // ---------- Element refs ----------
  const el = (id) => document.getElementById(id);
  const connectView = el("connectView");
  const chatView = el("chatView");
  const connectForm = el("connectForm");
  const connectBtn = el("connectBtn");
  const connectError = el("connectError");
  const statusDot = el("statusDot");
  const statusText = el("statusText");
  const fingerprintRow = el("fingerprintRow");
  const fingerprintEl = el("fingerprint");
  const sessionMeta = el("sessionMeta");
  const sessionBanner = el("sessionBanner");
  const messageList = el("messageList");
  const messageInput = el("messageInput");
  const sendBtn = el("sendBtn");
  const bubbleTemplate = el("bubbleTemplate");

  let ws = null;

  // ---------- UI socket (localhost, plaintext) ----------
  function connectUiSocket() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    ws = new WebSocket(`${proto}://${location.host}/ws/ui`);

    ws.onopen = () => setStatus("online", "Connected");
    ws.onclose = () => setStatus("", "Disconnected");
    ws.onerror = () => setStatus("error", "Socket error");
    ws.onmessage = (event) => handleServerMessage(JSON.parse(event.data));
  }

  function sendToBackend(obj) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      showError("Not connected to backend.");
      return;
    }
    ws.send(JSON.stringify(obj));
  }

  // ---------- Inbound messages from backend ----------
  // TODO: match these `type` values to what your backend emits on /ws/ui.
  function handleServerMessage(msg) {
    switch (msg.type) {
      case "session": // handshake complete: fingerprint + cipher agreed
        showChatView(msg);
        break;
      case "message": // a decrypted message (from peer or echoed self)
        renderMessage(msg);
        break;
      case "error":
        showError(msg.detail || "Unknown error");
        break;
      default:
        console.warn("Unhandled backend message", msg);
    }
  }

  // ---------- Connection form ----------
  connectForm.addEventListener("submit", (e) => {
    e.preventDefault();
    hideError();
    connectBtn.disabled = true;

    // TODO: shape this to your backend's handshake command.
    sendToBackend({
      type: "connect",
      passphrase: el("passphrase").value,
      cipher: el("cipher").value,
      peerAddress: el("peerAddress").value.trim(),
    });
  });

  function showChatView(session) {
    connectView.classList.add("hidden");
    chatView.classList.remove("hidden");
    if (session.fingerprint) {
      fingerprintEl.textContent = session.fingerprint;
      fingerprintRow.classList.remove("hidden");
    }
    sessionMeta.textContent = `Cipher: ${session.cipher || "—"} | Key: ${session.fingerprint || "—"}`;
    sessionBanner.textContent = `E2E session established · ${session.cipher || ""}`;
  }

  // ---------- Sending ----------
  sendBtn.addEventListener("click", sendText);
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  });
  // Auto-grow textarea.
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  function sendText() {
    const text = messageInput.value.trim();
    if (!text) return;
    sendToBackend({ type: "send", msgType: "text", text });
    messageInput.value = "";
    messageInput.style.height = "auto";
  }

  // ---------- Attachments ----------
  el("imageBtn").addEventListener("click", () => el("imageInput").click());
  el("fileBtn").addEventListener("click", () => el("fileInput").click());
  el("imageInput").addEventListener("change", (e) => sendFile(e.target.files[0], "image"));
  el("fileInput").addEventListener("change", (e) => sendFile(e.target.files[0], "file"));

  function sendFile(file, msgType) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // strip data: prefix
      sendToBackend({
        type: "send",
        msgType,
        filename: file.name,
        mime: file.type,
        data: base64,
      });
    };
    reader.readAsDataURL(file);
  }

  // ---------- Voice recording (MediaRecorder) ----------
  const recordBtn = el("recordBtn");
  let recorder = null;
  let chunks = [];

  recordBtn.addEventListener("click", async () => {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        recordBtn.classList.remove("recording");
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType });
        sendFile(new File([blob], "voice-note", { type: blob.type }), "voice");
      };
      recorder.start();
      recordBtn.classList.add("recording");
    } catch (err) {
      showError("Microphone access denied.");
    }
  });

  // ---------- Rendering ----------
  function renderMessage(msg) {
    const node = bubbleTemplate.content.cloneNode(true);
    const wrapper = node.querySelector(".msg");
    const content = node.querySelector(".content");
    const cipherToggle = node.querySelector(".cipher-toggle");
    const ciphertext = node.querySelector(".ciphertext");
    const timestamp = node.querySelector(".timestamp");

    if (msg.self) wrapper.classList.add("sent");

    switch (msg.msgType) {
      case "text":
        content.textContent = msg.text || "";
        break;
      case "image": {
        const img = document.createElement("img");
        img.src = `data:${msg.mime};base64,${msg.data}`;
        content.appendChild(img);
        break;
      }
      case "voice": {
        const audio = document.createElement("audio");
        audio.controls = true;
        audio.src = `data:${msg.mime};base64,${msg.data}`;
        content.appendChild(audio);
        break;
      }
      case "file": {
        const link = document.createElement("a");
        link.href = `data:${msg.mime};base64,${msg.data}`;
        link.download = msg.filename || "download";
        link.textContent = `📎 ${msg.filename || "file"}`;
        content.appendChild(link);
        break;
      }
      default:
        content.textContent = "[unknown message type]";
    }

    if (msg.ciphertext) {
      ciphertext.textContent = msg.ciphertext;
      cipherToggle.addEventListener("click", () => {
        ciphertext.classList.toggle("hidden");
      });
    } else {
      cipherToggle.remove();
    }

    timestamp.textContent = formatTime(msg.ts);
    messageList.appendChild(node);
    messageList.scrollTop = messageList.scrollHeight;
  }

  // ---------- Helpers ----------
  function setStatus(cls, text) {
    statusDot.className = "status-dot" + (cls ? " " + cls : "");
    statusText.textContent = text;
    if (cls !== "online") connectBtn.disabled = false;
  }
  function showError(text) {
    connectError.textContent = text;
    connectError.classList.remove("hidden");
    connectBtn.disabled = false;
  }
  function hideError() {
    connectError.classList.add("hidden");
  }
  function formatTime(ts) {
    const d = ts ? new Date(ts * 1000) : new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  connectUiSocket();
})();
