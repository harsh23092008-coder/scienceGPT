// jarvis-voice.js - ScienceGPT Full Jarvis Mode
// Version: 2.0 - All Features Included
// Created by: harsh23092008

(function() {
  'use strict';

  // CSS inject karo
  const style = document.createElement('style');
  style.textContent = `
    @keyframes jarvisPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.08); }
    }
  .jarvis-pulse { animation: jarvisPulse 1s infinite; }
    #jarvis-container * {
      box-sizing: border-box;
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
    }
    #jarvis-container button {
      transition: all 0.2s;
      cursor: pointer;
      border: none;
      outline: none;
    }
    #jarvis-container button:hover {
      transform: scale(1.05);
    }
    #jarvis-container button:active {
      transform: scale(0.95);
    }
  `;
  document.head.appendChild(style);

  class ScienceGPTJarvis {
    constructor() {
      this.isFirstActivation = true;
      this.isSleeping = false;
      this.status = 'wakeword';
      this.recognition = null;
      this.lastTranscript = '';
      this.originalSendMessage = window.sendMessage || null;

      // Tony Stark wale responses - sab rakha hai
      this.jarvisResponses = {
        wakeup: [
          "At your service, sir",
          "Online and ready, sir",
          "Good to see you again, sir",
          "Systems activated. How can I help?",
          "Jarvis here. What do you need?",
          "ScienceGPT online. Ready for your queries"
        ],
        sleep: [
          "Going offline, sir. Call me when you need me",
          "Sleep mode activated. Say 'Hey Jarvis' to wake me",
          "Understood. I'll be here when you need me, sir",
          "Shutting down non-essential systems",
          "Goodbye for now, sir",
          "Powering down. Jarvis out"
        ],
        thanks: [
          "Always a pleasure, sir",
          "You're welcome, sir",
          "Just doing my job",
          "Anytime, sir",
          "Glad I could help",
          "My pleasure, sir",
          "Kaam ka hai tu - wait, I mean... happy to help"
        ],
        firstTime: [
          "Haan sir, ScienceGPT ready hai. Ab aap 'Sunno' bol kar doubt pooch sakte hain",
          "Systems online. From now on, just say 'Sunno' and ask away",
          "Jarvis activated. Use 'Sunno' for your queries, sir",
          "Connection established. 'Sunno' bol ke doubt poocho"
        ],
        error: [
          "Sorry sir, I didn't catch that. Please repeat",
          "Could you say that again, sir?",
          "I'm having trouble understanding. One more time?",
          "Audio unclear. Please speak again"
        ]
      };

      this.init();
    }

    init() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.createUI());
      } else {
        this.createUI();
      }
    }

    getRandomResponse(type) {
      const responses = this.jarvisResponses[type];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    sanitizeForSpeech(text) {
      return text
     .replace(/\$\$(.*?)\$\$/g, '$1')
     .replace(/\$(.*?)\$/g, '$1')
     .replace(/\^2/g, ' square')
     .replace(/\^3/g, ' cube')
     .replace(/\^(\w+)/g, ' to the power $1')
     .replace(/\\frac{(.*?)}{(.*?)}/g, '$1 divided by $2')
     .replace(/\\sqrt{(.*?)}/g, 'square root of $1')
     .replace(/\\int/g, 'integral')
     .replace(/\\sum/g, 'summation')
     .replace(/\\pi/g, 'pi')
     .replace(/\\theta/g, 'theta')
     .replace(/\\alpha/g, 'alpha')
     .replace(/\\beta/g, 'beta')
     .replace(/\\Delta/g, 'delta')
     .replace(/\\/g, '')
     .replace(/\{|\}/g, '')
     .replace(/_/g, ' sub ');
    }

    createUI() {
      const container = document.createElement('div');
      container.id = 'jarvis-container';
      container.innerHTML = `
        <div style="position:fixed; bottom:20px; right:20px; display:flex; flex-direction:column; gap:12px; align-items:end; z-index:99999;">
          <div id="jarvis-transcript" style="background:linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color:white; padding:10px 16px; border-radius:16px; font-size:14px; max-width:280px; display:none; box-shadow:0 8px 24px rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1);"></div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button id="jarvis-power" title="Sleep/Wake Jarvis" style="background:#dc2626; padding:12px; border-radius:50%; box-shadow:0 4px 12px rgba(220,38,38,0.4);">
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/></svg>
            </button>
            <button id="jarvis-stop" title="Stop Speaking" style="background:#dc2626; padding:12px; border-radius:50%; display:none; box-shadow:0 4px 12px rgba(220,38,38,0.4);">
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
            </button>
            <div id="jarvis-mic" title="Jarvis Status" style="background:#3b82f6; padding:16px; border-radius:50%; transition:all 0.3s; box-shadow:0 4px 12px rgba(59,130,246,0.4);">
              <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1.45 1 1v6c0.55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
            </div>
          <div id="jarvis-status" style="font-size:12px; color:white; background:rgba(0,0,0,0.8); padding:8px 14px; border-radius:999px; backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1);">
            Bolo "Hey Jarvis"
          </div>
        </div>
      `;
      document.body.appendChild(container);

      document.getElementById('jarvis-power').onclick = () => this.toggleSleep();
      document.getElementById('jarvis-stop').onclick = () => this.stopSpeaking();

      this.startListening();
      this.hookAPIResponse();
      console.log('%c🎩 Jarvis Activated for ScienceGPT', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
    }

    hookAPIResponse() {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = args[0];

        if (typeof url === 'string' && (url.includes('chat') || url.includes('api') || url.includes('gpt'))) {
          const clone = response.clone();
          clone.json().then(data => {
            const answer = data.answer || data.response || data.message || data.text || data.reply;
            if (answer && typeof answer === 'string') {
              setTimeout(() => this.speak(answer), 300);
            }
          }).catch(() => {});
        }
        return response;
      };
    }

    speak(text, callback) {
      window.speechSynthesis.cancel();
      const clean = this.sanitizeForSpeech(text);
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = 'hi-IN';
      utter.rate = 0.95;
      utter.pitch = 1.1;
      utter.volume = 1;

      utter.onstart = () => {
        this.status = 'speaking';
        this.updateUI();
      };
      utter.onend = () => {
        this.status = this.isSleeping? 'sleeping' : 'wakeword';
        this.updateUI();
        if (callback) callback();
        else if (!this.isSleeping) this.startListening();
      };
      utter.onerror = () => {
        this.status = 'wakeword';
        this.updateUI();
        this.startListening();
      };

      window.speechSynthesis.speak(utter);
    }

    updateUI() {
      const mic = document.getElementById('jarvis-mic');
      const status = document.getElementById('jarvis-status');
      const stop = document.getElementById('jarvis-stop');
      const power = document.getElementById('jarvis-power');
      const transcript = document.getElementById('jarvis-transcript');

      if (this.isSleeping) {
        mic.style.background = '#4b5563';
        mic.classList.remove('jarvis-pulse');
        status.textContent = 'Sleeping... Bolo "Hey Jarvis"';
        stop.style.display = 'none';
        power.style.background = '#16a34a';
        power.title = 'Wake Jarvis';
      } else if (this.status === 'wakeword') {
        mic.style.background = this.isFirstActivation? '#f97316' : '#3b82f6';
        mic.classList.remove('jarvis-pulse');
        status.textContent = this.isFirstActivation? 'Bolo "Hey Jarvis"' : 'Bolo "Sunno" + doubt';
        stop.style.display = 'none';
        power.style.background = '#dc2626';
        power.title = 'Sleep Jarvis';
      } else if (this.status === 'listening') {
        mic.style.background = '#22c55e';
        mic.classList.add('jarvis-pulse');
        status.textContent = 'Processing...';
        transcript.style.display = 'block';
      } else if (this.status === 'speaking') {
        mic.style.background = '#a855f7';
        mic.classList.remove('jarvis-pulse');
        status.textContent = 'Speaking...';
        stop.style.display = 'block';
      }
    }

    sendToChat(query) {
      // Multiple methods try karo
      const input = document.querySelector('input[type="text"], textarea, #chat-input,.chat-input, [contenteditable="true"]');
      const form = document.querySelector('form');
      const button = document.querySelector('button[type="submit"], #send-btn,.send-button, [aria-label*="send"], [aria-label*="Send"]');

      if (input) {
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
          input.value = query;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          input.textContent = query;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      setTimeout(() => {
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } else if (button) {
          button.click();
        } else if (this.originalSendMessage) {
          this.originalSendMessage(query);
        } else if (input) {
          // Enter key press simulate karo
          const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true
          });
          input.dispatchEvent(enterEvent);
        }
      }, 100);
    }

    startListening() {
      if (!('webkitSpeechRecognition' in window)) {
        console.error('Speech recognition not supported. Use Chrome.');
        return;
      }

      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (this.status!== 'speaking' &&!this.isSleeping) {
          this.status = 'wakeword';
          this.updateUI();
        }
      };

      recognition.onresult = (e) => {
        let final = '';
        let interim = '';

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0].transcript.toLowerCase();
          if (e.results[i].isFinal) {
            final += text + ' ';
          } else {
            interim += text;
          }
        }

        const transcript = document.getElementById('jarvis-transcript');
        if (interim || final) {
          transcript.style.display = 'block';
          transcript.textContent = interim || final;
        }

        if (!final) return;
        this.lastTranscript = final;

        // Sleep commands - sab rakha hai
        const sleepCommands = ['goodbye jarvis', 'sleep now', 'shutdown', 'so ja', 'band kar', 'thats enough', 'thats enough jarvis', 'good night'];
        if (sleepCommands.some(cmd => final.includes(cmd))) {
          recognition.stop();
          this.isSleeping = true;
          this.speak(this.getRandomResponse('sleep'));
          return;
        }

        // Wake commands - sab rakha hai
        const wakeCommands = ['hey jarvis', 'jarvis', 'wake up', 'wake up jarvis', 'jarvis online', 'uth ja', 'wake'];
        if (this.isSleeping && wakeCommands.some(cmd => final.includes(cmd))) {
          recognition.stop();
          this.isSleeping = false;
          this.isFirstActivation = false;
          this.speak(this.getRandomResponse('wakeup'));
          return;
        }

        if (this.isSleeping) return;

        // Thanks commands - sab rakha hai
        const thanksCommands = ['thanks jarvis', 'thank you jarvis', 'thank you', 'good job', 'shabash', 'kaam ka hai', 'nice', 'awesome'];
        if (thanksCommands.some(cmd => final.includes(cmd))) {
          recognition.stop();
          this.speak(this.getRandomResponse('thanks'));
          return;
        }

        // Doubt detection - full logic
        const firstWords = ['hey jarvis', 'jarvis', 'wake up jarvis', 'hey science gpt'];
        const normalWords = ['sunno', 'suno', 'listen', 'jarvis', 'hey science gpt', 'science gpt'];
        const activeWords = this.isFirstActivation? firstWords : normalWords;

        if (activeWords.some(word => final.includes(word)) && final.trim().length > 5) {
          let query = final;
          [...firstWords,...normalWords,...sleepCommands,...wakeCommands,...thanksCommands].forEach(word => {
            query = query.replace(new RegExp(word, 'g'), '');
          });
          query = query.trim();

          // First time activation
          if (this.isFirstActivation && firstWords.some(w => final.includes(w))) {
            recognition.stop();
            this.isFirstActivation = false;
            if (query.length <= 3) {
              this.speak(this.getRandomResponse('firstTime'));
              return;
            }
          }

          // Send doubt
          if (query.length > 3) {
            recognition.stop();
            this.status = 'listening';
            this.updateUI();
            this.isFirstActivation = false;
            document.getElementById('jarvis-transcript').textContent = `Doubt: ${query}`;
            this.sendToChat(query);
          }
        }
      };

      recognition.onerror = (e) => {
        console.log('Speech error:', e.error);
        if (e.error!== 'no-speech' && e.error!== 'aborted') {
          setTimeout(() => this.startListening(), 1000);
        }
      };

      recognition.onend = () => {
        if (this.status!== 'speaking' &&!this.isSleeping) {
          setTimeout(() => this.startListening(), 500);
        }
      };

      try {
        this.recognition = recognition;
        recognition.start();
        this.updateUI();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }

    stopSpeaking() {
      window.speechSynthesis.cancel();
      this.status = 'wakeword';
      this.updateUI();
      this.startListening();
    }

    toggleSleep() {
      this.isSleeping =!this.isSleeping;
      this.speak(this.isSleeping? this.getRandomResponse('sleep') : this.getRandomResponse('wakeup'));
      this.updateUI();
    }
  }

  // Auto start
  new ScienceGPTJarvis();
})();
