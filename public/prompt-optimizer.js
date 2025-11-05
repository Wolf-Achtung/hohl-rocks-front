/**
 * Prompt Optimizer for hohl.rocks
 * Analyzes and improves user prompts with before/after comparison
 */

class PromptOptimizer {
    constructor() {
        // Get API base from meta tag or use default
        const metaApiBase = document.querySelector('meta[name="x-api-base"]');
        this.apiBase = metaApiBase 
            ? metaApiBase.getAttribute('content') 
            : 'https://hohl-rocks-back-production.up.railway.app';
        
        this.isOptimizing = false;
        this.init();
    }

    init() {
        // Event Listeners
        const optimizeBtn = document.getElementById('optimize-prompt-btn');
        const promptInput = document.getElementById('prompt-input-text');
        
        if (optimizeBtn && promptInput) {
            optimizeBtn.addEventListener('click', () => this.optimizePrompt());
            
            // Enter key support (with Ctrl/Cmd for multiline)
            promptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !this.isOptimizing) {
                    e.preventDefault();
                    this.optimizePrompt();
                }
            });
        }
    }

    async optimizePrompt() {
        const promptInput = document.getElementById('prompt-input-text');
        const optimizeBtn = document.getElementById('optimize-prompt-btn');
        const resultsContainer = document.getElementById('optimizer-results');
        
        const prompt = promptInput.value.trim();
        
        // Validation
        if (!prompt || prompt.length < 5) {
            this.showToast('⚠️ Bitte gib einen Prompt ein (min. 5 Zeichen)', 'warning');
            promptInput.focus();
            return;
        }

        if (this.isOptimizing) {
            return;
        }

        try {
            this.isOptimizing = true;
            
            // Update UI - Loading State
            optimizeBtn.disabled = true;
            optimizeBtn.innerHTML = '<span class="spinner"></span> Analysiere...';
            resultsContainer.innerHTML = this.getLoadingHTML();
            resultsContainer.style.display = 'block';
            
            // API Call
            const response = await fetch(`${this.apiBase}/api/prompt-optimizer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            // Display Results
            this.displayResults(data);
            this.showToast('✨ Prompt optimiert!', 'success');
            
        } catch (error) {
            console.error('Optimization Error:', error);
            this.showToast('❌ Optimierung fehlgeschlagen. Bitte versuche es erneut.', 'error');
            resultsContainer.innerHTML = this.getErrorHTML();
            
        } finally {
            this.isOptimizing = false;
            optimizeBtn.disabled = false;
            optimizeBtn.innerHTML = '⚡ Optimieren';
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('optimizer-results');
        
        const scoreColor = this.getScoreColor(data.original_score);
        const improvedScoreColor = this.getScoreColor(data.improved_score);
        
        const html = `
            <div class="optimizer-result">
                
                <!-- Score Comparison -->
                <div class="score-comparison">
                    <div class="score-card original">
                        <div class="score-label">Original Score</div>
                        <div class="score-value" style="color: ${scoreColor}">
                            ${data.original_score}/10
                        </div>
                    </div>
                    
                    <div class="score-arrow">→</div>
                    
                    <div class="score-card improved">
                        <div class="score-label">Optimiert</div>
                        <div class="score-value" style="color: ${improvedScoreColor}">
                            ${data.improved_score}/10
                        </div>
                    </div>
                </div>

                <!-- Problems & Improvements -->
                <div class="analysis-grid">
                    <div class="analysis-card problems">
                        <h3>❌ Probleme</h3>
                        <ul>
                            ${data.problems.map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="analysis-card improvements">
                        <h3>✅ Verbesserungen</h3>
                        <ul>
                            ${data.improvements.map(i => `<li>${this.escapeHtml(i)}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <!-- Before/After Comparison -->
                <div class="prompt-comparison">
                    <div class="prompt-box original-prompt">
                        <div class="prompt-header">
                            <h3>Vorher</h3>
                            <button class="copy-btn-small" onclick="promptOptimizer.copyText('${this.escapeHtml(data.original_prompt)}')">
                                📋 Copy
                            </button>
                        </div>
                        <div class="prompt-text">${this.escapeHtml(data.original_prompt)}</div>
                    </div>
                    
                    <div class="prompt-box improved-prompt">
                        <div class="prompt-header">
                            <h3>Nachher</h3>
                            <button class="copy-btn-small" onclick="promptOptimizer.copyText('${this.escapeHtml(data.improved_prompt)}')">
                                📋 Copy
                            </button>
                        </div>
                        <div class="prompt-text">${this.escapeHtml(data.improved_prompt)}</div>
                    </div>
                </div>

                <!-- Explanation -->
                <div class="explanation-box">
                    <h3>💡 Warum ist der neue Prompt besser?</h3>
                    <p>${this.escapeHtml(data.explanation)}</p>
                </div>

                <!-- Copy Improved Prompt Button -->
                <div class="action-buttons">
                    <button class="primary-btn" onclick="promptOptimizer.copyText('${this.escapeHtml(data.improved_prompt)}')">
                        📋 Verbesserten Prompt kopieren
                    </button>
                    <button class="secondary-btn" onclick="promptOptimizer.useImprovedPrompt('${this.escapeHtml(data.improved_prompt)}')">
                        ✏️ Als Vorlage verwenden
                    </button>
                </div>

            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }

    getScoreColor(score) {
        if (score >= 8) return '#51cf66'; // Green
        if (score >= 6) return '#ffd43b'; // Yellow
        if (score >= 4) return '#ff922b'; // Orange
        return '#ff6b6b'; // Red
    }

    async copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('✅ In Zwischenablage kopiert!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showToast('❌ Kopieren fehlgeschlagen', 'error');
        }
    }

    useImprovedPrompt(prompt) {
        const promptInput = document.getElementById('prompt-input-text');
        if (promptInput) {
            promptInput.value = prompt;
            promptInput.focus();
            this.showToast('✅ Prompt als Vorlage geladen!', 'success');
            
            // Scroll to input
            promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/'/g, '&#39;');
    }

    getLoadingHTML() {
        return `
            <div class="optimizer-loading">
                <div class="loading-spinner"></div>
                <p>Analysiere deinen Prompt...</p>
                <div class="loading-steps">
                    <div class="step active">✓ Prompt empfangen</div>
                    <div class="step active">⏳ Probleme identifizieren</div>
                    <div class="step">⏳ Verbesserungen generieren</div>
                    <div class="step">⏳ Score berechnen</div>
                </div>
            </div>
        `;
    }

    getErrorHTML() {
        return `
            <div class="optimizer-error">
                <div class="error-icon">⚠️</div>
                <h3>Optimierung fehlgeschlagen</h3>
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
let promptOptimizer;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        promptOptimizer = new PromptOptimizer();
    });
} else {
    promptOptimizer = new PromptOptimizer();
}
