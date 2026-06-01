// ===== DOM ELEMENTS =====
const DOM = {
  chat: document.getElementById('chat-box'),
  userInput: document.getElementById('user-input'),
  sendBtn: document.getElementById('send-btn'),
  statusText: document.getElementById('status-text'),
  newChatBtn: document.getElementById('new-chat-btn'),
  themeToggle: document.getElementById('theme-toggle'),
  exportBtn: document.getElementById('export-btn'),
  clearBtn: document.getElementById('clear-btn')
};

// ===== GLOBAL STATE =====
let conversationHistory = [
  { role: 'system', content: 'You are ScienceGPT, a helpful AI tutor for Physics, Chemistry, Biology and Maths. Explain concepts clearly with examples. Use markdown for formulas: $E=mc^2$' }
];
let isLoading = false;
const STORAGE_KEY = 'sciencegpt_chat';

// ===== THEME HANDLER =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (DOM.themeToggle) DOM.themeToggle.checked = savedTheme === 'light';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark'? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// ===== MARKDOWN + CODE PARSER =====
function parseMarkdown(text) {
  // Code blocks ```js ... ```
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const id = 'code-' + Math.random().toString(36).substr(2, 9);
    return `<div class="code-block">
      <div class="code-header">
        <span>${lang || 'code'}</span>
        <button class="copy-btn" onclick="copyCode('${id}')">Copy</button>
      </div>
      <pre><code id="${id}">${escapeHtml(code.trim())}</code></pre>
    </div>`;
  });

  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic *text*
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Math $formula$
  text = text.replace(/\$(.*?)\$/g, '<span class="math">$1</span>');
  
  // Line breaks
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.copyCode = function(id) {
  const codeEl = document.getElementById(id);
  navigator.clipboard.writeText(codeEl.textContent);
  event.target.textContent = 'Copied!';
  setTimeout(() => event.target.textContent = 'Copy', 2000);
}

// ===== LOCALSTORAGE =====
function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory));
}

function loadFromLocal() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    conversationHistory = JSON.parse(saved);
    DOM.chat.innerHTML = '';
    conversationHistory.forEach(msg => {
      if (msg.role !== 'system') {
        addMessage(msg.content, msg.role === 'user', false, false);
      }
    });
  }
}

// ===== CORE FUNCTIONS =====
function addMessage(text, isUser = false, isTyping = false, shouldSave = true) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${isUser? 'user' : 'bot'} ${isTyping? 'typing' : ''}`;

  if (isTyping) {
    msgDiv.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  } else {
    msgDiv.innerHTML = parseMarkdown(text);
  }

  DOM.chat.appendChild(msgDiv);
  DOM.chat.scrollTop = DOM.chat.scrollHeight;
  
  if (shouldSave &&!isTyping) saveToLocal();
  return msgDiv;
}

async function sendMessage() {
  const userText = DOM.userInput.value.trim();
  if (!userText || isLoading) return;

  // UI Lock
  isLoading = true;
  DOM.sendBtn.disabled = true;
  DOM.statusText.textContent = "ScienceGPT is thinking...";

  // User ka message dikhao
  addMessage(userText, true);
  DOM.userInput.value = '';

  // Typing indicator banao
  const typingDiv = addMessage("Typing...", false, true);

  try {
    // History me user message add karo
    conversationHistory.push({ role: 'user', content: userText });

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: conversationHistory,
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }

    const reply = data.reply || data.choices[0].message.content;

    // FIX: Safe remove - crash nahi karega
    typingDiv?.remove();

    // AI ka reply dikhao
    addMessage(reply, false);

    // History me AI reply add karo
    conversationHistory.push({ role: 'assistant', content: reply });
    saveToLocal();

  } catch (err) {
    typingDiv?.remove();
    let errorMsg = `Error: ${err.message}`;
    if (err.message.includes('Failed to fetch')) {
      errorMsg += '\n\nBackend check karo: /api/chat';
    }
    addMessage(errorMsg, false);
  } finally {
    // UI Unlock
    isLoading = false;
    DOM.sendBtn.disabled = false;
    DOM.statusText.textContent = "Physics | Chemistry | Biology | Maths | Anything";
    DOM.userInput.focus();
  }
}

function newChat() {
  if (confirm('Start new chat? Current chat will be cleared.')) {
    DOM.chat.innerHTML = '';
    conversationHistory = [conversationHistory[0]]; // Keep system prompt
    localStorage.removeItem(STORAGE_KEY);
    addMessage('Hi! I am ScienceGPT. Ask me anything about Science or Maths 🚀', false);
  }
}

function clearChat() {
  if (confirm('Clear all messages?')) {
    DOM.chat.innerHTML = '';
    conversationHistory = [conversationHistory[0]];
    localStorage.removeItem(STORAGE_KEY);
    addMessage('Chat cleared. Ask me anything! 🚀', false);
  }
}

function exportChat() {
  const text = conversationHistory
    .filter(m => m.role !== 'system')
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ScienceGPT-Chat-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== EVENT LISTENERS =====
DOM.sendBtn.addEventListener('click', sendMessage);

DOM.userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' &&!e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

DOM.userInput.addEventListener('input', () => {
  DOM.userInput.style.height = 'auto';
  DOM.userInput.style.height = DOM.userInput.scrollHeight + 'px';
});

if (DOM.newChatBtn) DOM.newChatBtn.addEventListener('click', newChat);
if (DOM.clearBtn) DOM.clearBtn.addEventListener('click', clearChat);
if (DOM.exportBtn) DOM.exportBtn.addEventListener('click', exportChat);
if (DOM.themeToggle) DOM.themeToggle.addEventListener('change', toggleTheme);

// ===== INIT =====
initTheme();
loadFromLocal();
if (DOM.chat.children.length === 0) {
  addMessage('Hi! I am ScienceGPT. Ask me anything about Science or Maths 🚀', false, false, false);
}
