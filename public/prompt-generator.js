/**
 * Live Prompt Generator for hohl.rocks
 * Generates 5 AI prompt styles from any topic
 */

class PromptGenerator {
    constructor() {
        // Get API base from meta tag or use default
        const metaApiBase = document.querySelector('meta[name="x-api-base"]');
        this.apiBase = metaApiBase 
            ? metaApiBase.getAttribute('content') 
            : 'https://hohl-rocks-back-production.up.railway.app';
        
        this.isGenerating = false;
        this.init();
    }

    init() {
        // Event Listeners
        const generateBtn = document.getElementById('generate-prompts-btn');
        const topicInput = document.getElementById('prompt-topic-input');
        
        if (generateBtn && topicInput) {
            generateBtn.addEventListener('click', () => this.generatePrompts());
            
            // Enter key support
            topicInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.isGenerating) {
                    this.generatePrompts();
                }
            });
        }
    }

    async generatePrompts() {
        const topicInput = document.getElementById('prompt-topic-input');
        const generateBtn = document.getElementById('generate-prompts-btn');
        const resultsContainer = document.getElementById('prompt-results');
        
        const topic = topicInput.value.trim();
        
        // Validation
        if (!topic || topic.length < 3) {
            this.showToast('⚠️ Bitte gib ein Topic ein (min. 3 Zeichen)', 'warning');
            topicInput.focus();
            return;
        }

        if (this.isGenerating) {
            return;
        }

        try {
            this.isGenerating = true;
            
            // Update UI - Loading State
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="spinner"></span> Generiere...';
            resultsContainer.innerHTML = this.getLoadingHTML();
            resultsContainer.style.display = 'grid';
            
            // API Call
            const response = await fetch(`${this.apiBase}/api/prompt-generator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Display Results
            this.displayResults(data);
            this.showToast('✨ 5 Prompt-Styles generiert!', 'success');
            
        } catch (error) {
            console.error('Prompt Generation Error:', error);
            this.showToast('❌ Generation fehlgeschlagen. Bitte versuche es erneut.', 'error');
            resultsContainer.innerHTML = this.getErrorHTML();
            
        } finally {
            this.isGenerating = false;
            generateBtn.disabled = false;
            generateBtn.innerHTML = '✨ Generieren';
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('prompt-results');
        
        const html = data.styles.map((style, index) => `
            <div class="prompt-card glass-card" style="animation-delay: ${index * 0.1}s">
                <div class="prompt-card-header">
                    <div class="prompt-icon">${style.icon}</div>
                    <div class="prompt-title">
                        <h3>${style.name}</h3>
                        <p class="prompt-description">${style.description}</p>
                    </div>
                </div>
                <div class="prompt-content">
                    <p class="prompt-text">${style.prompt}</p>
                </div>
                <div class="prompt-card-footer">
                    <button class="copy-prompt-btn" onclick="promptGenerator.copyPrompt('${this.escapeHtml(style.prompt)}', ${index})">
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Copy Prompt</span>
                    </button>
                </div>
            </div>
        `).join('');
        
        resultsContainer.innerHTML = html;
    }

    async copyPrompt(prompt, index) {
        try {
            await navigator.clipboard.writeText(prompt);
            
            // Visual Feedback
            const btn = document.querySelectorAll('.copy-prompt-btn')[index];
            const originalHTML = btn.innerHTML;
            
            btn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Kopiert!</span>';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('copied');
            }, 2000);
            
            this.showToast('✅ Prompt kopiert!', 'success');
            
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('❌ Kopieren fehlgeschlagen', 'error');
        }
    }

    escapeHtml(text) {
        return text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    getLoadingHTML() {
        return `
            <div class="prompt-loading">
                <div class="loading-spinner"></div>
                <p>Generiere 5 Prompt-Styles...</p>
                <div class="loading-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
    }

    getErrorHTML() {
        return `
            <div class="prompt-error">
                <div class="error-icon">⚠️</div>
                <h3>Generation fehlgeschlagen</h3>
                <p>Bitte versuche es erneut oder kontaktiere den Support.</p>
            </div>
        `;
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize when DOM is ready
let promptGenerator;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        promptGenerator = new PromptGenerator();
    });
} else {
    promptGenerator = new PromptGenerator();
}
