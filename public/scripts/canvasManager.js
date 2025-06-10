// Konva Canvas Manager for AI Image Generator
// Import Konva from CDN: https://unpkg.com/konva@9/konva.min.js

class CanvasManager {
    constructor() {
        this.stage = null;
        this.mainLayer = null;
        this.uiLayer = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.lastLine = null;
        this.transformer = null;
        this.zoomLevel = 0.25; // Start at 25%
        this.isDragging = false;
        this.selectedElement = null;
        this.textEditMode = false;
        
        this.init();
    }

    init() {
        this.setupStage();
        this.setupLayers();
        this.setupTransformer();
        this.setupEventListeners();
        this.updateEmptyState();
    }

    setupStage() {
        const container = document.getElementById('konva-stage');
        if (!container) return;

        // Get container dimensions
        const containerRect = container.getBoundingClientRect();
        
        this.stage = new Konva.Stage({
            container: 'konva-stage',
            width: containerRect.width,
            height: containerRect.height,
            draggable: false
        });

        // Set initial zoom
        this.setZoom(this.zoomLevel);
        
        // Center the stage
        this.centerStage();
    }

    setupLayers() {
        // Main content layer
        this.mainLayer = new Konva.Layer();
        this.stage.add(this.mainLayer);

        // UI layer for selection handles, etc.
        this.uiLayer = new Konva.Layer();
        this.stage.add(this.uiLayer);
    }

    setupTransformer() {
        this.transformer = new Konva.Transformer({
            nodes: [],
            keepRatio: false,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'],
            borderStroke: '#2563eb',
            borderStrokeWidth: 2,
            anchorFill: '#2563eb',
            anchorStroke: '#ffffff',
            anchorSize: 8,
        });
        this.uiLayer.add(this.transformer);
    }

    setupEventListeners() {
        // Tool change listeners
        this.setupToolListeners();
        
        // Stage event listeners
        this.setupStageListeners();
        
        // Window resize listener
        window.addEventListener('resize', () => this.handleResize());
        
        // Zoom control listeners
        this.setupZoomListeners();
    }

    setupToolListeners() {
        const toolButtons = document.querySelectorAll('[data-tool]');
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tool = e.currentTarget.getAttribute('data-tool');
                this.setTool(tool);
            });
        });
    }

    setupStageListeners() {
        // Mouse events
        this.stage.on('mousedown touchstart', (e) => this.handleMouseDown(e));
        this.stage.on('mousemove touchmove', (e) => this.handleMouseMove(e));
        this.stage.on('mouseup touchend', () => this.handleMouseUp());
        
        // Click for selection
        this.stage.on('click tap', (e) => this.handleClick(e));
        
        // Double click for text editing
        this.stage.on('dblclick', (e) => this.handleDoubleClick(e));
        
        // Wheel event for zooming
        this.stage.on('wheel', (e) => this.handleWheel(e));
    }

    setupZoomListeners() {
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomDisplay = document.getElementById('zoom-display');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }
        
        if (zoomDisplay) {
            zoomDisplay.addEventListener('click', () => this.resetZoom());
        }
    }

    setTool(tool) {
        this.currentTool = tool;
        this.stage.container().className = `konva-content tool-${tool}`;
        
        // Clear selection when switching tools
        if (tool !== 'select') {
            this.clearSelection();
        }
        
        // Update cursor
        this.updateCursor();
        
        console.log(`Tool changed to: ${tool}`);
    }

    updateCursor() {
        const container = this.stage.container();
        const cursorMap = {
            'select': 'default',
            'text': 'text',
            'shape': 'crosshair',
            'pencil': 'crosshair',
            'move': 'grab'
        };
        
        container.style.cursor = cursorMap[this.currentTool] || 'default';
    }

    handleMouseDown(e) {
        if (this.currentTool === 'pencil') {
            this.startDrawing(e);
        } else if (this.currentTool === 'move') {
            this.startPanning(e);
        } else if (this.currentTool === 'text') {
            this.addText(e);
        } else if (this.currentTool === 'shape') {
            this.startShape(e);
        }
    }

    handleMouseMove(e) {
        if (this.isDrawing && this.currentTool === 'pencil') {
            this.continueDrawing(e);
        } else if (this.isDragging && this.currentTool === 'move') {
            this.continuePanning(e);
        }
    }

    handleMouseUp() {
        if (this.isDrawing) {
            this.stopDrawing();
        }
        if (this.isDragging) {
            this.stopPanning();
        }
    }

    handleClick(e) {
        if (this.currentTool === 'select') {
            this.handleSelection(e);
        }
    }

    handleDoubleClick(e) {
        if (e.target.getClassName() === 'Text') {
            this.editText(e.target);
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
        
        // Limit zoom range
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

    // Drawing functions
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.stage.getPointerPosition();
        
        this.lastLine = new Konva.Line({
            stroke: '#2563eb',
            strokeWidth: 3,
            globalCompositeOperation: 'source-over',
            lineCap: 'round',
            lineJoin: 'round',
            points: [pos.x, pos.y, pos.x, pos.y],
        });
        
        this.mainLayer.add(this.lastLine);
        this.updateEmptyState();
    }

    continueDrawing(e) {
        if (!this.isDrawing) return;
        
        const pos = this.stage.getPointerPosition();
        const newPoints = this.lastLine.points().concat([pos.x, pos.y]);
        this.lastLine.points(newPoints);
        this.stage.batchDraw();
    }

    stopDrawing() {
        this.isDrawing = false;
        this.lastLine = null;
    }

    // Panning functions
    startPanning(e) {
        this.isDragging = true;
        this.stage.container().style.cursor = 'grabbing';
        this.stage.draggable(true);
    }

    continuePanning(e) {
        // Handled by Konva's built-in dragging
    }

    stopPanning() {
        this.isDragging = false;
        this.stage.container().style.cursor = 'grab';
        this.stage.draggable(false);
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
        });
        
        this.mainLayer.add(text);
        this.stage.batchDraw();
        this.updateEmptyState();
        
        // Auto-select the new text
        this.selectElement(text);
    }

    editText(textNode) {
        this.textEditMode = true;
        
        // Create textarea for editing
        const textPosition = textNode.absolutePosition();
        const stageBox = this.stage.container().getBoundingClientRect();
        
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        
        textarea.value = textNode.text();
        textarea.style.position = 'absolute';
        textarea.style.top = (stageBox.top + textPosition.y) + 'px';
        textarea.style.left = (stageBox.left + textPosition.x) + 'px';
        textarea.style.width = textNode.width() + 'px';
        textarea.style.height = textNode.height() + 'px';
        textarea.style.fontSize = textNode.fontSize() + 'px';
        textarea.style.border = 'none';
        textarea.style.padding = '0px';
        textarea.style.margin = '0px';
        textarea.style.overflow = 'hidden';
        textarea.style.background = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.lineHeight = textNode.lineHeight();
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = 'left top';
        textarea.style.textAlign = textNode.align();
        textarea.style.color = textNode.fill();
        
        textarea.focus();
        textarea.select();
        
        const removeTextarea = () => {
            textarea.parentNode.removeChild(textarea);
            this.textEditMode = false;
            this.stage.batchDraw();
        };
        
        textarea.addEventListener('keydown', (e) => {
            if (e.keyCode === 13 && !e.shiftKey) { // Enter key
                textNode.text(textarea.value);
                removeTextarea();
            }
            if (e.keyCode === 27) { // Escape key
                removeTextarea();
            }
        });
        
        textarea.addEventListener('blur', () => {
            textNode.text(textarea.value);
            removeTextarea();
        });
    }

    // Shape functions
    startShape(e) {
        const pos = this.stage.getPointerPosition();
        
        const rect = new Konva.Rect({
            x: pos.x,
            y: pos.y,
            width: 100,
            height: 60,
            fill: '#e5e7eb',
            stroke: '#2563eb',
            strokeWidth: 2,
            draggable: true,
        });
        
        this.mainLayer.add(rect);
        this.stage.batchDraw();
        this.updateEmptyState();
        
        // Auto-select the new shape
        this.selectElement(rect);
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
        this.selectedElement = element;
        this.transformer.nodes([element]);
        this.uiLayer.batchDraw();
    }

    clearSelection() {
        this.selectedElement = null;
        this.transformer.nodes([]);
        this.uiLayer.batchDraw();
    }

    // Zoom functions
    setZoom(scale) {
        this.zoomLevel = scale;
        this.stage.scale({ x: scale, y: scale });
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
        imageObj.onload = () => {
            const image = new Konva.Image({
                x: 0,
                y: 0,
                image: imageObj,
                width: width,
                height: height,
                draggable: true,
            });
            
            // Center the image
            image.position({
                x: -width / 2,
                y: -height / 2
            });
            
            this.mainLayer.add(image);
            this.stage.batchDraw();
            this.updateEmptyState();
            
            // Auto-select the new image
            this.selectElement(image);
        };
        imageObj.src = imageUrl;
    }

    // Utility functions
    updateEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const hasContent = this.mainLayer.children.length > 0;
        
        if (emptyState) {
            emptyState.style.display = hasContent ? 'none' : 'flex';
        }
    }

    handleResize() {
        const container = document.getElementById('konva-stage');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        this.stage.size({
            width: containerRect.width,
            height: containerRect.height
        });
        
        this.stage.batchDraw();
    }

    // Export functions
    exportAsImage(format = 'png', quality = 1) {
        return this.stage.toDataURL({
            mimeType: `image/${format}`,
            quality: quality,
            pixelRatio: 2
        });
    }

    exportAsJSON() {
        return this.stage.toJSON();
    }

    loadFromJSON(json) {
        const stage = Konva.Node.create(json, 'konva-stage');
        this.stage.destroy();
        this.stage = stage;
        this.mainLayer = stage.children[0];
        this.uiLayer = stage.children[1] || new Konva.Layer();
        this.setupTransformer();
        this.setupEventListeners();
        this.updateEmptyState();
    }

    // Clear canvas
    clear() {
        this.mainLayer.destroyChildren();
        this.clearSelection();
        this.stage.batchDraw();
        this.updateEmptyState();
    }

    // Delete selected element
    deleteSelected() {
        if (this.selectedElement) {
            this.selectedElement.destroy();
            this.clearSelection();
            this.stage.batchDraw();
            this.updateEmptyState();
        }
    }
}

// Initialize canvas manager when DOM is loaded
let canvasManager;

document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Konva to load
    setTimeout(() => {
        if (typeof Konva !== 'undefined') {
            canvasManager = new CanvasManager();
            
            // Add keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (canvasManager && !canvasManager.textEditMode) {
                        canvasManager.deleteSelected();
                    }
                }
                
                // Tool shortcuts
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case '1':
                            e.preventDefault();
                            canvasManager.setTool('select');
                            break;
                        case '2':
                            e.preventDefault();
                            canvasManager.setTool('text');
                            break;
                        case '3':
                            e.preventDefault();
                            canvasManager.setTool('shape');
                            break;
                        case '4':
                            e.preventDefault();
                            canvasManager.setTool('pencil');
                            break;
                        case '5':
                            e.preventDefault();
                            canvasManager.setTool('move');
                            break;
                    }
                }
            });
            
            console.log('Canvas Manager initialized');
        } else {
            console.error('Konva.js not loaded. Please include it from CDN.');
        }
    }, 100);
});

// Export for external use
export { CanvasManager, canvasManager };