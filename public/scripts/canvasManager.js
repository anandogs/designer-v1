// Enhanced Konva Canvas Manager for AI Image Generator
// More robust and consistent implementation

class CanvasManager {
    constructor() {
        this.stage = null;
        this.mainLayer = null;
        this.uiLayer = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.lastLine = null;
        this.transformer = null;
        this.zoomLevel = 0.25;
        this.isDragging = false;
        this.selectedElement = null;
        this.textEditMode = false;
        this.isPanning = false;
        this.lastPointerPosition = null;
        
        // Better state management
        this.isInitialized = false;
        this.eventListeners = new Map();
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM and Konva to be ready
            await this.waitForDependencies();
            
            this.setupStage();
            this.setupLayers();
            this.setupTransformer();
            this.setupEventListeners();
            this.updateEmptyState();
            
            this.isInitialized = true;
            console.log('Canvas Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Canvas Manager:', error);
        }
    }

    async waitForDependencies() {
        // Wait for Konva
        let attempts = 0;
        while (typeof Konva === 'undefined' && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof Konva === 'undefined') {
            throw new Error('Konva.js not loaded');
        }

        // Wait for DOM element
        attempts = 0;
        while (!document.getElementById('konva-stage') && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!document.getElementById('konva-stage')) {
            throw new Error('Canvas container not found');
        }
    }

    setupStage() {
        const container = document.getElementById('konva-stage');
        if (!container) {
            throw new Error('Canvas container not found');
        }

        const containerRect = container.getBoundingClientRect();
        
        this.stage = new Konva.Stage({
            container: 'konva-stage',
            width: containerRect.width,
            height: containerRect.height,
            draggable: false
        });

        this.setZoom(this.zoomLevel);
        this.centerStage();
    }

    setupLayers() {
        // Main content layer
        this.mainLayer = new Konva.Layer();
        this.stage.add(this.mainLayer);

        // UI layer for selection handles
        this.uiLayer = new Konva.Layer();
        this.stage.add(this.uiLayer);
        
        console.log('Layers created:', { mainLayer: this.mainLayer, uiLayer: this.uiLayer });
    }

    setupTransformer() {
        this.transformer = new Konva.Transformer({
            nodes: [],
            keepRatio: false,
            enabledAnchors: [
                'top-left', 'top-center', 'top-right',
                'middle-left', 'middle-right',
                'bottom-left', 'bottom-center', 'bottom-right'
            ],
            borderStroke: '#2563eb',
            borderStrokeWidth: 2,
            anchorFill: '#2563eb',
            anchorStroke: '#ffffff',
            anchorSize: 8,
            anchorStrokeWidth: 2,
            borderDash: [3, 3],
            rotateEnabled: true,
            resizeEnabled: true,
            boundBoxFunc: (oldBox, newBox) => {
                // Prevent negative dimensions
                if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                }
                return newBox;
            }
        });
        
        this.uiLayer.add(this.transformer);
        console.log('Transformer created and added to UI layer');
    }

    setupEventListeners() {
        // Clear existing listeners
        this.clearEventListeners();
        
        // Tool change listeners
        this.setupToolListeners();
        
        // Stage event listeners with better event management
        this.setupStageListeners();
        
        // Window events
        this.addEventListenerWithCleanup(window, 'resize', () => this.handleResize());
        
        // Zoom control listeners
        this.setupZoomListeners();
        
        console.log('Event listeners set up');
    }

    addEventListenerWithCleanup(element, event, handler) {
        element.addEventListener(event, handler);
        
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ event, handler });
    }

    clearEventListeners() {
        this.eventListeners.forEach((listeners, element) => {
            listeners.forEach(({ event, handler }) => {
                element.removeEventListener(event, handler);
            });
        });
        this.eventListeners.clear();
    }

    setupToolListeners() {
        const toolButtons = document.querySelectorAll('[data-tool]');
        toolButtons.forEach(button => {
            const handler = (e) => {
                const tool = e.currentTarget.getAttribute('data-tool');
                this.setTool(tool);
                
                // Update button states
                toolButtons.forEach(btn => btn.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
            };
            
            this.addEventListenerWithCleanup(button, 'click', handler);
        });
    }

    setupStageListeners() {
        // Mouse/touch events with proper binding
        const mouseDownHandler = (e) => this.handleMouseDown(e);
        const mouseMoveHandler = (e) => this.handleMouseMove(e);
        const mouseUpHandler = (e) => this.handleMouseUp(e);
        const clickHandler = (e) => this.handleClick(e);
        const dblClickHandler = (e) => this.handleDoubleClick(e);
        const wheelHandler = (e) => this.handleWheel(e);

        this.stage.on('mousedown touchstart', mouseDownHandler);
        this.stage.on('mousemove touchmove', mouseMoveHandler);
        this.stage.on('mouseup touchend', mouseUpHandler);
        this.stage.on('click tap', clickHandler);
        this.stage.on('dblclick dbltap', dblClickHandler);
        this.stage.on('wheel', wheelHandler);

        // Store references for cleanup
        this.stageEventHandlers = {
            mouseDownHandler, mouseMoveHandler, mouseUpHandler,
            clickHandler, dblClickHandler, wheelHandler
        };
    }

    setupZoomListeners() {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomDisplay = document.getElementById('zoom-display');

        if (zoomInBtn) {
            this.addEventListenerWithCleanup(zoomInBtn, 'click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            this.addEventListenerWithCleanup(zoomOutBtn, 'click', () => this.zoomOut());
        }
        
        if (zoomDisplay) {
            this.addEventListenerWithCleanup(zoomDisplay, 'click', () => this.resetZoom());
        }
    }

    setTool(tool) {
        console.log(`Switching to tool: ${tool}`);
        
        // Clean up current tool state
        this.cleanupCurrentTool();
        
        this.currentTool = tool;
        this.stage.container().className = `konva-content tool-${tool}`;
        
        // Clear selection when switching tools (except select tool)
        if (tool !== 'select') {
            this.clearSelection();
        }
        
        this.updateCursor();
    }

    cleanupCurrentTool() {
        // Stop any ongoing operations
        this.isDrawing = false;
        this.isPanning = false;
        this.isDragging = false;
        this.lastLine = null;
        
        // Exit text edit mode
        if (this.textEditMode) {
            this.exitTextEditMode();
        }
        
        // Reset stage draggable state
        this.stage.draggable(false);
    }

    updateCursor() {
        const container = this.stage.container();
        const cursorMap = {
            'select': 'default',
            'text': 'text',
            'shape': 'crosshair',
            'pencil': 'crosshair',
            'move': this.isPanning ? 'grabbing' : 'grab'
        };
        
        container.style.cursor = cursorMap[this.currentTool] || 'default';
    }

    handleMouseDown(e) {
        if (!this.isInitialized) return;

        this.lastPointerPosition = this.stage.getPointerPosition();
        
        // Prevent text editing when clicking outside
        if (this.textEditMode && !this.isClickOnText(e)) {
            this.exitTextEditMode();
        }

        switch (this.currentTool) {
            case 'pencil':
                this.startDrawing(e);
                break;
            case 'move':
                this.startPanning(e);
                break;
            case 'text':
                this.handleTextClick(e);
                break;
            case 'shape':
                this.addShape(e);
                break;
            case 'select':
                // Let click handler manage selection
                break;
        }
    }

    handleMouseMove(e) {
        if (!this.isInitialized) return;

        if (this.isDrawing && this.currentTool === 'pencil') {
            this.continueDrawing(e);
        } else if (this.isPanning && this.currentTool === 'move') {
            this.continuePanning(e);
        }
    }

    handleMouseUp(e) {
        if (!this.isInitialized) return;

        if (this.isDrawing) {
            this.stopDrawing();
        }
        if (this.isPanning) {
            this.stopPanning();
        }
        
        this.isDragging = false;
    }

    handleClick(e) {
        if (!this.isInitialized) return;

        if (this.currentTool === 'select') {
            this.handleSelection(e);
        }
    }

    handleDoubleClick(e) {
        if (!this.isInitialized) return;

        const target = e.target;
        if (target.getClassName() === 'Text') {
            e.cancelBubble = true;
            this.editText(target);
        }
    }

    isClickOnText(e) {
        return e.target && e.target.getClassName() === 'Text';
    }

    handleTextClick(e) {
        // Only add new text if clicking on empty space
        if (e.target === this.stage) {
            this.addText(e);
        }
    }

    // Drawing functions
    startDrawing(e) {
        if (e.target !== this.stage) return; // Only draw on empty canvas

        this.isDrawing = true;
        const pos = this.stage.getPointerPosition();
        
        this.lastLine = new Konva.Line({
            stroke: '#2563eb',
            strokeWidth: 3,
            globalCompositeOperation: 'source-over',
            lineCap: 'round',
            lineJoin: 'round',
            points: [pos.x, pos.y, pos.x, pos.y],
            draggable: false, // Drawings shouldn't be draggable by default
        });
        
        this.mainLayer.add(this.lastLine);
        this.updateEmptyState();
        console.log('Started drawing');
    }

    continueDrawing(e) {
        if (!this.isDrawing || !this.lastLine) return;
        
        const pos = this.stage.getPointerPosition();
        const newPoints = this.lastLine.points().concat([pos.x, pos.y]);
        this.lastLine.points(newPoints);
        this.mainLayer.batchDraw();
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        console.log('Stopped drawing');
        
        // Make the line selectable after drawing
        if (this.lastLine) {
            this.lastLine.draggable(true);
            this.setupElementEvents(this.lastLine);
        }
        
        this.lastLine = null;
        this.mainLayer.batchDraw();
    }

    // Panning functions
    startPanning(e) {
        if (e.target !== this.stage) return; // Only pan when clicking empty space

        this.isPanning = true;
        this.updateCursor();
        this.stage.draggable(true);
        console.log('Started panning');
    }

    continuePanning(e) {
        // Handled automatically by Konva's draggable
    }

    stopPanning() {
        if (!this.isPanning) return;
        
        this.isPanning = false;
        this.stage.draggable(false);
        this.updateCursor();
        console.log('Stopped panning');
    }

    // Text functions
    addText(e) {
        const pos = this.stage.getPointerPosition();
        
        const text = new Konva.Text({
            x: pos.x,
            y: pos.y,
            text: 'Double click to edit',
            fontSize: 24,
            fontFamily: 'Arial',
            fill: '#2d2d2d',
            draggable: true,
            wrap: 'word',
            width: 200,
        });
        
        this.setupElementEvents(text);
        this.mainLayer.add(text);
        this.mainLayer.batchDraw();
        this.updateEmptyState();
        
        console.log('Added text element');
        
        // Auto-select and start editing
        this.selectElement(text);
        setTimeout(() => this.editText(text), 100);
    }

    editText(textNode) {
        if (this.textEditMode) return;
        
        console.log('Starting text edit mode');
        this.textEditMode = true;
        
        // Hide the text node temporarily
        textNode.hide();
        this.mainLayer.batchDraw();
        
        // Create textarea for editing
        const textPosition = textNode.absolutePosition();
        const stageBox = this.stage.container().getBoundingClientRect();
        const transform = textNode.getAbsoluteTransform();
        
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        
        // Style the textarea to match the text
        const scale = this.stage.scaleX();
        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = (stageBox.top + textPosition.y * scale) + 'px';
        textarea.style.left = (stageBox.left + textPosition.x * scale) + 'px';
        textarea.style.width = (textNode.width() * scale) + 'px';
        textarea.style.fontSize = (textNode.fontSize() * scale) + 'px';
        textarea.style.border = '2px solid #2563eb';
        textarea.style.padding = '4px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'rgba(255, 255, 255, 0.9)';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.color = textNode.fill();
        textarea.style.zIndex = '1000';
        textarea.style.borderRadius = '4px';
        
        // Store reference to text node
        textarea.textNode = textNode;
        this.currentTextarea = textarea;
        
        textarea.focus();
        textarea.select();
        
        // Event handlers for finishing edit
        const finishEdit = () => {
            if (textarea.parentNode) {
                textNode.text(textarea.value);
                textNode.show();
                textarea.parentNode.removeChild(textarea);
                this.textEditMode = false;
                this.currentTextarea = null;
                this.mainLayer.batchDraw();
                console.log('Finished text edit');
            }
        };
        
        const cancelEdit = () => {
            if (textarea.parentNode) {
                textNode.show();
                textarea.parentNode.removeChild(textarea);
                this.textEditMode = false;
                this.currentTextarea = null;
                this.mainLayer.batchDraw();
                console.log('Cancelled text edit');
            }
        };
        
        textarea.addEventListener('keydown', (e) => {
            e.stopPropagation(); // Prevent canvas shortcuts
            
            if (e.keyCode === 13 && !e.shiftKey) { // Enter
                e.preventDefault();
                finishEdit();
            }
            if (e.keyCode === 27) { // Escape
                e.preventDefault();
                cancelEdit();
            }
        });
        
        textarea.addEventListener('blur', finishEdit);
        
        // Adjust textarea size as user types
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
    }

    exitTextEditMode() {
        if (this.currentTextarea) {
            this.currentTextarea.blur();
        }
    }

    // Shape functions
    addShape(e) {
        const pos = this.stage.getPointerPosition();
        
        const rect = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            width: 100,
            height: 60,
            fill: 'rgba(229, 231, 235, 0.8)',
            stroke: '#2563eb',
            strokeWidth: 2,
            draggable: true,
        });
        
        this.setupElementEvents(rect);
        this.mainLayer.add(rect);
        this.mainLayer.batchDraw();
        this.updateEmptyState();
        
        console.log('Added shape element');
        
        // Auto-select the new shape
        this.selectElement(rect);
    }

    // Enhanced element event setup
    setupElementEvents(element) {
        // Make element interactive
        element.on('mousedown', (e) => {
            if (this.currentTool === 'select') {
                e.cancelBubble = true;
                this.selectElement(element);
            }
        });

        element.on('dragstart', () => {
            if (this.currentTool === 'select') {
                this.selectElement(element);
            }
        });

        element.on('dragend', () => {
            this.mainLayer.batchDraw();
        });

        element.on('transform', () => {
            this.mainLayer.batchDraw();
        });

        element.on('transformend', () => {
            this.mainLayer.batchDraw();
        });
    }

    // Selection functions
    handleSelection(e) {
        if (e.target === this.stage) {
            this.clearSelection();
            return;
        }
        
        this.selectElement(e.target);
    }

    selectElement(element) {
        if (!element || element === this.stage) return;
        
        console.log('Selecting element:', element.getClassName());
        
        this.selectedElement = element;
        this.transformer.nodes([element]);
        this.transformer.forceUpdate();
        this.uiLayer.batchDraw();
        
        // Ensure element is draggable when selected
        if (this.currentTool === 'select') {
            element.draggable(true);
        }
    }

    clearSelection() {
        console.log('Clearing selection');
        
        this.selectedElement = null;
        this.transformer.nodes([]);
        this.uiLayer.batchDraw();
    }

    // Zoom functions
    setZoom(scale) {
        this.zoomLevel = Math.max(0.1, Math.min(5, scale));
        this.stage.scale({ x: this.zoomLevel, y: this.zoomLevel });
        this.centerStage();
        this.updateZoomDisplay();
        this.stage.batchDraw();
    }

    zoomIn() {
        const newZoom = Math.min(this.zoomLevel * 1.2, 5);
        this.setZoom(newZoom);
    }

    zoomOut() {
        const newZoom = Math.max(this.zoomLevel / 1.2, 0.1);
        this.setZoom(newZoom);
    }

    resetZoom() {
        this.setZoom(1);
    }

    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoom-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.zoomLevel * 100) + '%';
        }
    }

    handleWheel(e) {
        e.evt.preventDefault();
        
        const scaleBy = 1.1;
        const stage = this.stage;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const clampedScale = Math.max(0.1, Math.min(5, newScale));
        
        stage.scale({ x: clampedScale, y: clampedScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };
        
        stage.position(newPos);
        
        this.zoomLevel = clampedScale;
        this.updateZoomDisplay();
        this.stage.batchDraw();
    }

    centerStage() {
        const containerRect = this.stage.container().getBoundingClientRect();
        const stageWidth = containerRect.width;
        const stageHeight = containerRect.height;
        
        this.stage.position({
            x: stageWidth / 2,
            y: stageHeight / 2
        });
    }

    // Image functions
    addGeneratedImage(imageUrl, width = 512, height = 512) {
        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous'; // Handle CORS
        
        imageObj.onload = () => {
            const image = new Konva.Image({
                x: -width / 2,
                y: -height / 2,
                image: imageObj,
                width: width,
                height: height,
                draggable: true,
            });
            
            this.setupElementEvents(image);
            this.mainLayer.add(image);
            this.mainLayer.batchDraw();
            this.updateEmptyState();
            
            console.log('Added generated image');
            
            // Auto-select the new image
            this.selectElement(image);
        };
        
        imageObj.onerror = () => {
            console.error('Failed to load image:', imageUrl);
        };
        
        imageObj.src = imageUrl;
    }

    // Utility functions
    updateEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const hasContent = this.mainLayer && this.mainLayer.children.length > 0;
        
        if (emptyState) {
            emptyState.style.display = hasContent ? 'none' : 'flex';
        }
    }

    handleResize() {
        const container = document.getElementById('konva-stage');
        if (!container || !this.stage) return;
        
        const containerRect = container.getBoundingClientRect();
        this.stage.size({
            width: containerRect.width,
            height: containerRect.height
        });
        
        this.stage.batchDraw();
        console.log('Canvas resized');
    }

    // Export functions
    exportAsImage(format = 'png', quality = 1) {
        if (!this.stage) return null;
        
        return this.stage.toDataURL({
            mimeType: `image/${format}`,
            quality: quality,
            pixelRatio: 2
        });
    }

    exportAsJSON() {
        if (!this.stage) return null;
        return this.stage.toJSON();
    }

    loadFromJSON(json) {
        try {
            const stage = Konva.Node.create(json, 'konva-stage');
            this.stage.destroy();
            this.stage = stage;
            this.mainLayer = stage.children[0];
            this.uiLayer = stage.children[1] || new Konva.Layer();
            this.setupTransformer();
            this.setupEventListeners();
            this.updateEmptyState();
            console.log('Loaded from JSON');
        } catch (error) {
            console.error('Failed to load from JSON:', error);
        }
    }

    // Clear canvas
    clear() {
        if (!this.mainLayer) return;
        
        this.mainLayer.destroyChildren();
        this.clearSelection();
        this.mainLayer.batchDraw();
        this.updateEmptyState();
        console.log('Canvas cleared');
    }

    // Delete selected element
    deleteSelected() {
        if (this.selectedElement) {
            console.log('Deleting selected element');
            this.selectedElement.destroy();
            this.clearSelection();
            this.mainLayer.batchDraw();
            this.updateEmptyState();
        }
    }

    // Cleanup function
    destroy() {
        this.clearEventListeners();
        
        if (this.stage) {
            this.stage.destroy();
        }
        
        this.isInitialized = false;
        console.log('Canvas Manager destroyed');
    }
}

// Enhanced initialization with better error handling
let canvasManager;

function initializeCanvasManager() {
    try {
        canvasManager = new CanvasManager();
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!canvasManager || !canvasManager.isInitialized) return;
            
            // Don't trigger shortcuts when editing text
            if (canvasManager.textEditMode) return;
            
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    canvasManager.deleteSelected();
                }
            }
            
            // Tool shortcuts (Ctrl/Cmd + number)
            if (e.ctrlKey || e.metaKey) {
                const toolMap = {
                    '1': 'select',
                    '2': 'text', 
                    '3': 'shape',
                    '4': 'pencil',
                    '5': 'move'
                };
                
                if (toolMap[e.key]) {
                    e.preventDefault();
                    canvasManager.setTool(toolMap[e.key]);
                    
                    // Update UI
                    const button = document.querySelector(`[data-tool="${toolMap[e.key]}"]`);
                    if (button) {
                        document.querySelectorAll('[data-tool]').forEach(btn => btn.classList.remove('selected'));
                        button.classList.add('selected');
                    }
                }
            }
        });
        
        // Make canvasManager globally available
        window.canvasManager = canvasManager;
        
    } catch (error) {
        console.error('Failed to initialize canvas manager:', error);
    }
}

// Better initialization timing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeCanvasManager, 100);
    });
} else {
    setTimeout(initializeCanvasManager, 100);
}

// Export for module use
export { CanvasManager, canvasManager };