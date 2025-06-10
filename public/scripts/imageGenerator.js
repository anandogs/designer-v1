// Enhanced Image Generator JavaScript with Canvas Integration

// Tool selection functionality
function initializeToolSelection() {
    const toolButtons = document.querySelectorAll('[data-tool]');
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            toolButtons.forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            
            // Update canvas tool if available
            const tool = this.getAttribute('data-tool');
            if (window.canvasManager) {
                window.canvasManager.setTool(tool);
            }
        });
    });
}

// Advanced toggle functionality
function initializeAdvancedToggle() {
    const advancedToggle = document.getElementById('advanced-toggle');
    if (advancedToggle) {
        advancedToggle.addEventListener('change', function() {
            console.log('Advanced mode:', this.checked);
            
            // Show/hide advanced options
            const advancedOptions = document.querySelector('.advanced-options');
            if (advancedOptions) {
                advancedOptions.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
}

// Generate button functionality (enhanced for canvas integration)
function initializeGenerateButton() {
    const generateButton = document.getElementById('generate-btn');
    const promptTextarea = document.getElementById('prompt-textarea');
    
    generateButton?.addEventListener('click', async function() {
        if (!this.classList.contains('disabled')) {
            const prompt = promptTextarea?.value?.trim() || 'A beautiful landscape';
            
            // Validate prompt
            if (prompt.length < 3) {
                alert('Please enter a more detailed prompt');
                return;
            }
            
            this.classList.add('disabled');
            this.innerHTML = `
                <div class="flex items-center justify-center w-full">
                    <div class="animate-spin rounded-full border-b-2 border-white mr-2" style="height: 16px; width: 16px;"></div>
                    <span>Generating...</span>
                </div>
            `;
            
            try {
                // Get current image size settings
                const width = parseInt(document.getElementById('width-input')?.value) || 512;
                const height = parseInt(document.getElementById('height-input')?.value) || 512;
                
                await generateImage(prompt, width, height);
                
                // Show success notification
                showNotification('Image generated successfully!', 'success');
                
            } catch (error) {
                console.error('Generation failed:', error);
                showNotification('Generation failed. Please try again.', 'error');
            } finally {
                // Reset button
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
            }
        }
    });
}

// Image generation function
async function generateImage(prompt, width = 512, height = 512) {
    return new Promise((resolve, reject) => {
        // Simulate processing time
        const processingTime = 2000 + Math.random() * 3000; // 2-5 seconds
        
        setTimeout(() => {
            try {
                // For demo purposes, use different placeholder services
                const imageServices = [
                    `https://picsum.photos/${width}/${height}?random=${Date.now()}`,
                    `https://source.unsplash.com/${width}x${height}/?nature,landscape&sig=${Date.now()}`,
                    `https://loremflickr.com/${width}/${height}/nature,art?random=${Date.now()}`
                ];
                
                const imageUrl = imageServices[Math.floor(Math.random() * imageServices.length)];
                
                // Add the generated image to canvas
                if (window.canvasManager) {
                    window.canvasManager.addGeneratedImage(imageUrl, width, height);
                }
                
                resolve(imageUrl);
            } catch (error) {
                reject(error);
            }
        }, processingTime);
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="flex items-center justify-between p-3 rounded-lg shadow-lg">
            <span class="text-sm font-medium">${message}</span>
            <button class="ml-3 text-lg leading-none" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    const colors = {
        success: 'background: #10b981; color: white;',
        error: 'background: #ef4444; color: white;',
        info: 'background: #3b82f6; color: white;'
    };
    
    notification.firstElementChild.style.cssText = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Textarea auto-resize functionality
function initializeTextareaResize() {
    const textarea = document.getElementById('prompt-textarea');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
        
        // Add placeholder suggestions
        textarea.addEventListener('focus', function() {
            if (!this.value) {
                showPromptSuggestions();
            }
        });
    }
}

// Prompt suggestions
function showPromptSuggestions() {
    const suggestions = [
        "A serene mountain landscape at sunset with golden light",
        "Abstract digital art with vibrant colors and geometric shapes",
        "A cozy coffee shop interior with warm lighting",
        "Futuristic cityscape with neon lights and flying cars",
        "Watercolor painting of a peaceful garden with flowers",
        "Minimalist modern architecture against a clear sky"
    ];
    
    console.log('Prompt suggestions:', suggestions);
    // Could implement a dropdown here
}

// Image size ratio toggle functionality
function initializeRatioSelector() {
    const ratioSelector = document.getElementById('ratio-selector');
    const ratioText = document.getElementById('ratio-text');
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    
    const ratios = [
        { name: '3:4', width: 768, height: 1024 },
        { name: '1:1', width: 1024, height: 1024 },
        { name: '4:3', width: 1024, height: 768 },
        { name: '16:9', width: 1024, height: 576 },
        { name: '9:16', width: 576, height: 1024 }
    ];
    
    let currentRatioIndex = 0;

    ratioSelector?.addEventListener('click', function() {
        currentRatioIndex = (currentRatioIndex + 1) % ratios.length;
        const ratio = ratios[currentRatioIndex];
        
        ratioText.textContent = ratio.name;
        widthInput.value = ratio.width;
        heightInput.value = ratio.height;
        
        // Update ratio display icon
        updateRatioIcon(ratio.name);
    });
    
    // Manual input handling
    [widthInput, heightInput].forEach(input => {
        input?.addEventListener('input', function() {
            // Calculate and display current ratio
            const w = parseInt(widthInput.value) || 1;
            const h = parseInt(heightInput.value) || 1;
            const gcd = findGCD(w, h);
            const ratioW = w / gcd;
            const ratioH = h / gcd;
            
            // Find closest standard ratio or show custom
            const customRatio = `${ratioW}:${ratioH}`;
            const standardRatio = ratios.find(r => r.name === customRatio);
            
            ratioText.textContent = standardRatio ? standardRatio.name : 'Custom';
        });
    });
}

// Helper function to find GCD
function findGCD(a, b) {
    return b === 0 ? a : findGCD(b, a % b);
}

// Update ratio icon based on ratio
function updateRatioIcon(ratioName) {
    const ratioIcon = document.querySelector('#ratio-selector .border');
    if (ratioIcon) {
        const iconStyles = {
            '3:4': 'width: 9px; height: 12px;',
            '1:1': 'width: 10px; height: 10px;',
            '4:3': 'width: 12px; height: 9px;',
            '16:9': 'width: 14px; height: 8px;',
            '9:16': 'width: 8px; height: 14px;'
        };
        
        ratioIcon.style.cssText = iconStyles[ratioName] || 'width: 9px; height: 12px;';
    }
}

// Enhanced zoom controls functionality
function initializeZoomControls() {
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomDisplay = document.getElementById('zoom-display');
    
    // These now work directly with the canvas manager
    zoomInBtn?.addEventListener('click', () => {
        if (window.canvasManager) {
            window.canvasManager.zoomIn();
        }
    });
    
    zoomOutBtn?.addEventListener('click', () => {
        if (window.canvasManager) {
            window.canvasManager.zoomOut();
        }
    });
    
    zoomDisplay?.addEventListener('click', () => {
        if (window.canvasManager) {
            window.canvasManager.resetZoom();
        }
    });
}

// Model and LoRA selectors functionality
function initializeSelectors() {
    const modelSelector = document.getElementById('model-selector');
    const loraSelector = document.getElementById('lora-selector');
    const templatesBtn = document.getElementById('templates-btn');

    modelSelector?.addEventListener('click', function() {
        showModelSelection();
        addClickAnimation(this);
    });

    loraSelector?.addEventListener('click', function() {
        showLoRASelection();
        addClickAnimation(this);
    });

    templatesBtn?.addEventListener('click', function() {
        showTemplates();
    });
}

// Model selection modal
function showModelSelection() {
    const models = [
        { name: 'Shakker Zeno-1', description: 'High-quality realistic images' },
        { name: 'SDXL Turbo', description: 'Fast generation, good quality' },
        { name: 'Stable Diffusion 2.1', description: 'Versatile and reliable' },
        { name: 'Midjourney Style', description: 'Artistic and creative outputs' }
    ];
    
    console.log('Available models:', models);
    // Could implement a modal here
}

// LoRA selection modal  
function showLoRASelection() {
    const loraStyles = [
        { name: 'Photorealistic', description: 'Enhanced realism' },
        { name: 'Anime Style', description: 'Japanese animation style' },
        { name: 'Oil Painting', description: 'Classical painting style' },
        { name: 'Cyberpunk', description: 'Futuristic neon aesthetic' }
    ];
    
    console.log('Available LoRA styles:', loraStyles);
    // Could implement a modal here
}

// Template prompts
function showTemplates() {
    const templates = [
        {
            name: 'Portrait Photography',
            prompt: 'Professional portrait photography, studio lighting, high detail, sharp focus'
        },
        {
            name: 'Landscape Art',
            prompt: 'Beautiful landscape painting, golden hour lighting, detailed scenery, masterpiece'
        },
        {
            name: 'Abstract Design',
            prompt: 'Abstract digital art, geometric patterns, vibrant colors, modern composition'
        },
        {
            name: 'Architectural',
            prompt: 'Modern architecture, clean lines, minimalist design, professional photography'
        }
    ];
    
    // Apply template to prompt textarea
    const templateMenu = createTemplateMenu(templates);
    document.body.appendChild(templateMenu);
}

// Create template selection menu
function createTemplateMenu(templates) {
    const menu = document.createElement('div');
    menu.className = 'template-menu';
    menu.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 400px;
        max-height: 500px;
        overflow-y: auto;
    `;
    
    menu.innerHTML = `
        <div class="p-4 border-b">
            <h3 class="text-lg font-semibold">Prompt Templates</h3>
            <button class="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onclick="this.closest('.template-menu').remove()">
                ✕
            </button>
        </div>
        <div class="p-2">
            ${templates.map(template => `
                <div class="template-item p-3 hover:bg-gray-50 cursor-pointer rounded" onclick="applyTemplate('${template.prompt}'); this.closest('.template-menu').remove();">
                    <div class="font-medium text-sm">${template.name}</div>
                    <div class="text-xs text-gray-500 mt-1">${template.prompt.substring(0, 60)}...</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
    `;
    backdrop.onclick = () => {
        menu.remove();
        backdrop.remove();
    };
    
    document.body.appendChild(backdrop);
    
    return menu;
}

// Apply template to prompt
function applyTemplate(prompt) {
    const textarea = document.getElementById('prompt-textarea');
    if (textarea) {
        textarea.value = prompt;
        textarea.dispatchEvent(new Event('input')); // Trigger resize
        textarea.focus();
    }
}

// Click animation helper
function addClickAnimation(element) {
    element.style.transform = 'scale(0.98)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 100);
}

// Enhanced ripple effect for buttons
function initializeRippleEffect() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.classList.contains('nav-icon-btn') || this.classList.contains('generate-button')) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
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

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only trigger if not in text input
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            // Tool shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        selectTool('select');
                        break;
                    case '2':
                        e.preventDefault();
                        selectTool('text');
                        break;
                    case '3':
                        e.preventDefault();
                        selectTool('shape');
                        break;
                    case '4':
                        e.preventDefault();
                        selectTool('pencil');
                        break;
                    case '5':
                        e.preventDefault();
                        selectTool('move');
                        break;
                    case 's':
                        e.preventDefault();
                        exportCanvas();
                        break;
                    case 'n':
                        e.preventDefault();
                        clearCanvas();
                        break;
                }
            }
            
            // Single key shortcuts
            switch(e.key) {
                case 'Escape':
                    if (window.canvasManager) {
                        window.canvasManager.clearSelection();
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                    if (window.canvasManager && !window.canvasManager.textEditMode) {
                        window.canvasManager.deleteSelected();
                    }
                    break;
            }
        }
        
        // Global shortcuts (work even in inputs)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('generate-btn')?.click();
        }
    });
}

// Tool selection helper
function selectTool(toolName) {
    const toolButton = document.querySelector(`[data-tool="${toolName}"]`);
    if (toolButton) {
        toolButton.click();
    }
}

// Canvas export functionality
function exportCanvas() {
    if (window.canvasManager) {
        const dataURL = window.canvasManager.exportAsImage('png', 1);
        const link = document.createElement('a');
        link.download = `ai-generated-image-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        showNotification('Image exported successfully!', 'success');
    }
}

// Clear canvas functionality
function clearCanvas() {
    if (window.canvasManager && confirm('Are you sure you want to clear the canvas?')) {
        window.canvasManager.clear();
        showNotification('Canvas cleared', 'info');
    }
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for canvas manager to be ready
    setTimeout(() => {
        initializeToolSelection();
        initializeAdvancedToggle();
        initializeGenerateButton();
        initializeTextareaResize();
        initializeRatioSelector();
        initializeZoomControls();
        initializeSelectors();
        initializeRippleEffect();
        initializeKeyboardShortcuts();
        
        console.log('Image Generator enhanced with canvas integration');
    }, 200);
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .template-item:hover {
        background-color: #f3f4f6;
    }
    
    .notification {
        animation: slideIn 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.applyTemplate = applyTemplate;
window.exportCanvas = exportCanvas;
window.clearCanvas = clearCanvas;

// Export functions for potential external use
export {
    initializeToolSelection,
    initializeAdvancedToggle,
    initializeGenerateButton,
    initializeTextareaResize,
    initializeRatioSelector,
    initializeZoomControls,
    initializeSelectors,
    initializeRippleEffect,
    initializeKeyboardShortcuts,
    generateImage,
    showNotification,
    exportCanvas,
    clearCanvas
};