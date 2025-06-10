// Image Generator JavaScript Functionality

// Tool selection functionality
function initializeToolSelection() {
    const toolButtons = document.querySelectorAll('[data-tool]');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            toolButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// Advanced toggle functionality
function initializeAdvancedToggle() {
    const advancedToggle = document.getElementById('advanced-toggle');
    if (advancedToggle) {
        advancedToggle.addEventListener('change', function() {
            console.log('Advanced mode:', this.checked);
        });
    }
}

// Generate button functionality
function initializeGenerateButton() {
    const generateButton = document.getElementById('generate-btn');
    generateButton?.addEventListener('click', function() {
        if (!this.classList.contains('disabled')) {
            this.classList.add('disabled');
            this.innerHTML = `
                <div class="flex items-center">
                    <div class="animate-spin rounded-full border-b-2 border-white mr-2" style="height: 16px; width: 16px;"></div>
                    <span>Generating...</span>
                </div>
            `;
            
            // Simulate generation process
            setTimeout(() => {
                this.classList.remove('disabled');
                this.innerHTML = `
                    <div class="flex items-center">
                        <span class="mr-1">4</span>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                            <path fill="currentColor" d="m5 9.415 1.414-1.414 5.293 5.293L17 8l1.414 1.414-6.707 6.707z"/>
                        </svg>
                    </div>
                    <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.2);"></div>
                    <div class="flex-1 flex justify-center items-center">
                        <span>Generate</span>
                        <div class="ml-2 flex items-center">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <polyline points="13.18 1.37 13.18 9.64 21.45 9.64 10.82 22.63 10.82 14.36 2.55 14.36 13.18 1.37"/>
                            </svg>
                            <span class="ml-1">36</span>
                        </div>
                    </div>
                `;
            }, 3000);
        }
    });
}

// Textarea auto-resize functionality
function initializeTextareaResize() {
    const textarea = document.getElementById('prompt-textarea');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
    }
}

// Image size ratio toggle functionality
function initializeRatioSelector() {
    const ratioSelector = document.getElementById('ratio-selector');
    const ratioText = document.getElementById('ratio-text');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    
    const ratios = ['3:4', '1:1', '4:3', '16:9', '9:16'];
    let currentRatioIndex = 0;

    ratioSelector?.addEventListener('click', function() {
        currentRatioIndex = (currentRatioIndex + 1) % ratios.length;
        ratioText.textContent = ratios[currentRatioIndex];
        
        // Update dimensions based on ratio
        const ratioMap = {
            '3:4': [768, 1024],
            '1:1': [1024, 1024],
            '4:3': [1024, 768],
            '16:9': [1024, 576],
            '9:16': [576, 1024]
        };
        
        const [width, height] = ratioMap[ratios[currentRatioIndex]];
        widthInput.value = width;
        heightInput.value = height;
    });
}

// Zoom controls functionality
function initializeZoomControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomDisplay = document.getElementById('zoom-display');
    
    const zoomLevels = [10, 25, 50, 75, 100, 125, 150, 200];
    let currentZoomIndex = 1; // Start at 25%

    function updateZoom(direction) {
        if (direction === 'in' && currentZoomIndex < zoomLevels.length - 1) {
            currentZoomIndex++;
        } else if (direction === 'out' && currentZoomIndex > 0) {
            currentZoomIndex--;
        }
        
        const zoomLevel = zoomLevels[currentZoomIndex];
        zoomDisplay.textContent = `${zoomLevel}%`;
    }

    zoomInBtn?.addEventListener('click', () => updateZoom('in'));
    zoomOutBtn?.addEventListener('click', () => updateZoom('out'));
}

// Model and LoRA selectors functionality
function initializeSelectors() {
    const modelSelector = document.getElementById('model-selector');
    const loraSelector = document.getElementById('lora-selector');
    const templatesBtn = document.getElementById('templates-btn');

    modelSelector?.addEventListener('click', function() {
        console.log('Model selection clicked');
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });

    loraSelector?.addEventListener('click', function() {
        console.log('LoRA selection clicked');
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });

    templatesBtn?.addEventListener('click', function() {
        console.log('Templates clicked');
    });
}

// Ripple effect for buttons
function initializeRippleEffect() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.classList.contains('nav-icon-btn')) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.style.position = 'absolute';
                ripple.style.borderRadius = '50%';
                ripple.style.background = 'rgba(255, 255, 255, 0.6)';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                ripple.style.pointerEvents = 'none';
                
                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            }
        });
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeToolSelection();
    initializeAdvancedToggle();
    initializeGenerateButton();
    initializeTextareaResize();
    initializeRatioSelector();
    initializeZoomControls();
    initializeSelectors();
    initializeRippleEffect();
});

// Export functions for potential external use
export {
    initializeToolSelection,
    initializeAdvancedToggle,
    initializeGenerateButton,
    initializeTextareaResize,
    initializeRatioSelector,
    initializeZoomControls,
    initializeSelectors,
    initializeRippleEffect
};