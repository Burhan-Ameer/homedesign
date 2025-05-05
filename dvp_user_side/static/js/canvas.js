// Global variables
let stage = null;
let backgroundLayer = null;
let furnitureLayer = null;
let tr = null;
let history = [];
let currentStep = -1;
let isCanvasInitialized = false;

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Canvas.js loaded");
    
    // Initialize canvas
    initializeCanvas();
    
    // Check if we should load a saved design from the database
    const urlParams = new URLSearchParams(window.location.search);
    const designIdFromUrl = urlParams.get('designId');
    
    if (designIdFromUrl) {
        console.log("Loading design from database, ID:", designIdFromUrl);
        loadDesignFromDatabase(designIdFromUrl);
    } else {
        // Only set up furniture gallery and save initial state if not loading a saved design
        setupFurnitureGallery();
        setupBackgroundUpload();
        setupButtons();
        saveState();
    }
        
    // Enhance mobile support
    enhanceMobileSupport();
});

// Initialize the canvas and layers
function initializeCanvas() {
    const container = document.getElementById('container');
    if (!container) {
        console.error("Canvas container not found!");
        return;
    }
    
    // Create stage
    stage = new Konva.Stage({
        container: 'container',
        width: container.clientWidth,
        height: container.clientHeight || 600
    });
    
    // Create layers
    backgroundLayer = new Konva.Layer({ name: 'backgroundLayer' });
    furnitureLayer = new Konva.Layer({ name: 'furnitureLayer' });
    
    // Add layers to stage
    stage.add(backgroundLayer);
    stage.add(furnitureLayer);
    
    // Create transformer for resizing/rotating furniture
    tr = new Konva.Transformer({
        rotationSnaps: [0, 90, 180, 270],
        borderDash: [5, 5]
    });
    
    furnitureLayer.add(tr);
    
    // Stage click handler (deselect when clicking on empty area)
    stage.on('click', function(e) {
        if (e.target === stage) {
            tr.nodes([]);
            furnitureLayer.draw();
        }
    });
    
    isCanvasInitialized = true;
    console.log("Canvas initialized with size:", stage.width(), "x", stage.height());
}

// Set up furniture gallery click events
function setupFurnitureGallery() {
    // Select all furniture items in the gallery
    const furnitureItems = document.querySelectorAll('.furniture-item');
    
    // Add click event to each item
    furnitureItems.forEach(item => {
        item.addEventListener('click', function() {
            const src = this.getAttribute('data-src');
            const name = this.getAttribute('data-name');
            
            // Visual feedback when clicked
            this.classList.add('bg-gray-200');
            setTimeout(() => this.classList.remove('bg-gray-200'), 200);
            
            // Add furniture to canvas
            addFurnitureToCanvas(src, name);
        });
    });
    
    console.log(`Set up ${furnitureItems.length} furniture items in gallery`);
}

// Function to add furniture to canvas
function addFurnitureToCanvas(src, name) {
    console.log("Adding furniture to canvas:", name);
    
    if (!stage || !furnitureLayer) {
        console.error("Canvas not initialized");
        return;
    }
    
    // Load the image
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = function() {
        // Scale large images
        let width = img.width;
        let height = img.height;
        const maxSize = 200;
        
        if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width *= scale;
            height *= scale;
        }
        
        // Create Konva image
        const furniture = new Konva.Image({
            x: stage.width() / 2 - width / 2,
            y: stage.height() / 2 - height / 2,
            image: img,
            width: width,
            height: height,
            draggable: true,
            name: name,
            imageSrc: src
        });
        
        // Add click handler for selection
        furniture.on('click tap', function() {
            tr.nodes([furniture]);
            furnitureLayer.draw();
        });
        
        // Add double-click to delete
        furniture.on('dblclick dbltap', function() {
            furniture.destroy();
            tr.nodes([]);
            furnitureLayer.draw();
            saveState();
        });
        
        // Save state after drag ends
        furniture.on('dragend', saveState);
        furniture.on('transformend', saveState);
        
        // Add to layer and select it
        furnitureLayer.add(furniture);
        tr.nodes([furniture]);
        furnitureLayer.draw();
        
        // Save the state
        saveState();
    };
    
    img.onerror = function() {
        console.error("Failed to load image:", src);
        alert("Couldn't load the furniture image. Please try again.");
    };
    
    // Start loading the image
    img.src = src;
}

// Set up background image upload
function setupBackgroundUpload() {
    const bgUpload = document.getElementById('background-upload');
    const fileNameDisplay = document.getElementById('file-name');
    
    if (!bgUpload) return;
    
    bgUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show selected filename
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file.name;
        }
        
        // Load the file as background
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Clear background layer
                backgroundLayer.destroyChildren();
                
                // Scale to fit
                const stageWidth = stage.width();
                const stageHeight = stage.height();
                const scale = Math.min(stageWidth / img.width, stageHeight / img.height);
                
                // Create background image
                const bgImage = new Konva.Image({
                    x: (stageWidth - img.width * scale) / 2,
                    y: (stageHeight - img.height * scale) / 2,
                    image: img,
                    width: img.width * scale,
                    height: img.height * scale,
                    imageSrc: event.target.result
                });
                
                // Add to layer
                backgroundLayer.add(bgImage);
                backgroundLayer.draw();
                
                // Update info text
                document.getElementById('canvas-info').textContent = 
                    `Background: ${file.name} (${Math.round(bgImage.width())}×${Math.round(bgImage.height())})`;
                
                // Save state
                saveState();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Set up UI buttons
function setupButtons() {
    // Undo button
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }
    
    // Redo button
    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }
    
    // Clear canvas button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
    }
    
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDesign);
    }
    
    // Save to database button
    const saveBtn = document.getElementById('save-to-database-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            if (!isCanvasInitialized) {
                alert("Canvas not ready. Please try again.");
                return;
            }
            
            // Visual feedback
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
            this.disabled = true;
            
            // Get design name
            const designName = prompt("Name your design:", "My Room Design");
            if (!designName) {
                // User cancelled
                this.innerHTML = originalText;
                this.disabled = false;
                return;
            }
            
            // Create design data
            const thumbnailUrl = stage.toDataURL({
                pixelRatio: 0.5,
                mimeType: 'image/jpeg',
                quality: 0.7
            });
            
            const itemCount = furnitureLayer.find('Image').length;
            
            const designData = {
                designId: new URLSearchParams(window.location.search).get('designId'),
                name: designName,
                stageData: stage.toJSON(),
                thumbnailUrl: thumbnailUrl,
                itemCount: itemCount,
                timestamp: new Date().toISOString()
            };
            
            // Send to server
            fetch('/api/save-design/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),
                },
                body: JSON.stringify(designData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Success
                    this.innerHTML = '<i class="fas fa-check mr-1"></i> Saved!';
                    
                    // Update URL with design ID
                    const url = new URL(window.location);
                    url.searchParams.set('designId', data.designId);
                    window.history.pushState({}, '', url);
                    
                    // Also save to localStorage as backup
                    localStorage.setItem(`canvas_design_${data.designId}`, JSON.stringify({
                        stageData: stage.toJSON(),
                        thumbnailUrl: thumbnailUrl,
                        itemCount: itemCount,
                        name: designName,
                        timestamp: new Date().toISOString()
                    }));
                    
                    console.log("Design saved with ID:", data.designId);
                } else {
                    // Error
                    this.innerHTML = '<i class="fas fa-times mr-1"></i> Failed!';
                    console.error("Save error:", data.error);
                    alert("Error saving design: " + (data.error || "Unknown error"));
                }
                
                // Reset button after delay
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 1500);
            })
            .catch(error => {
                console.error("Save error:", error);
                alert("Error saving design. Check console for details.");
                this.innerHTML = originalText;
                this.disabled = false;
            });
        });
    }

    // Fix visibility button
    const fixVisibilityBtn = document.getElementById('fix-visibility-btn');
    if (fixVisibilityBtn) {
        fixVisibilityBtn.addEventListener('click', fixFurnitureVisibility);
    }

    // Fix background button
    const fixBgBtn = document.getElementById('fix-bg-btn');
    if (fixBgBtn) {
        fixBgBtn.addEventListener('click', function() {
            fixBackgroundVisibility();
            alert("Background visibility fix applied.");
        });
    }
}

// Save state to history
function saveState() {
    if (!stage) return;
    
    // If we're not at the end of the history, remove future states
    if (currentStep < history.length - 1) {
        history = history.slice(0, currentStep + 1);
    }
    
    // Add current state to history
    history.push(stage.toJSON());
    currentStep = history.length - 1;
    
    // Update button states
    updateUndoRedoButtons();
    
    console.log("History state saved. Current step:", currentStep, "Total states:", history.length);
}

// Undo function
function undo() {
    if (currentStep <= 0) return;
    
    currentStep--;
    loadState(currentStep);
    updateUndoRedoButtons();
}

// Redo function
function redo() {
    if (currentStep >= history.length - 1) return;
    
    currentStep++;
    loadState(currentStep);
    updateUndoRedoButtons();
}

// Load state from history
function loadState(index) {
    if (!history[index]) return;
    
    // Store container reference
    const container = stage.container();
    
    // Destroy current stage
    stage.destroy();
    
    // Create new stage from JSON
    stage = Konva.Node.create(history[index], 'container');
    
    // Get layer references
    backgroundLayer = stage.findOne('.Layer:first-child');
    furnitureLayer = stage.findOne('.Layer:nth-child(2)');
    
    // Create transformer
    tr = new Konva.Transformer({
        rotationSnaps: [0, 90, 180, 270],
        borderDash: [5, 5]
    });
    
    furnitureLayer.add(tr);
    
    // Set up events for furniture items
    const furnitureItems = furnitureLayer.find('Image');
    furnitureItems.forEach(item => {
        // Click to select
        item.on('click tap', function() {
            tr.nodes([item]);
            furnitureLayer.draw();
        });
        
        // Double-click to delete
        item.on('dblclick dbltap', function() {
            item.destroy();
            tr.nodes([]);
            furnitureLayer.draw();
            saveState();
        });
        
        // Save after modifications
        item.on('dragend', saveState);
        item.on('transformend', saveState);
    });
    
    // Set stage click handler
    stage.on('click', function(e) {
        if (e.target === stage) {
            tr.nodes([]);
            furnitureLayer.draw();
        }
    });
}

// Update undo/redo button states
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
        undoBtn.disabled = currentStep <= 0;
    }
    
    if (redoBtn) {
        redoBtn.disabled = currentStep >= history.length - 1;
    }
    
    console.log("Button states updated: Undo " + 
                (currentStep <= 0 ? "disabled" : "enabled") + 
                ", Redo " + 
                (currentStep >= history.length - 1 ? "disabled" : "enabled"));
}

// Clear canvas function
function clearCanvas() {
    if (confirm("Are you sure you want to clear the canvas?")) {
        backgroundLayer.destroyChildren();
        furnitureLayer.destroyChildren();
        
        // Re-add transformer
        tr = new Konva.Transformer({
            rotationSnaps: [0, 90, 180, 270],
            borderDash: [5, 5]
        });
        furnitureLayer.add(tr);
        
        // Redraw
        backgroundLayer.draw();
        furnitureLayer.draw();
        
        // Reset info text
        document.getElementById('canvas-info').textContent = "Canvas cleared";
        
        // Save empty state
        saveState();
    }
}

// Export design as image
function exportDesign() {
    if (!stage) return;
    
    // Hide transformer temporarily
    const nodes = tr.nodes();
    tr.nodes([]);
    furnitureLayer.draw();
    
    // Create high-quality image
    const dataURL = stage.toDataURL({
        pixelRatio: 2,
        mimeType: 'image/png'
    });
    
    // Restore transformer
    tr.nodes(nodes);
    furnitureLayer.draw();
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'room-design.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Get CSRF token from cookies
function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('csrftoken=')) {
            return cookie.substring('csrftoken='.length);
        }
    }
    return '';
}

// Update this function in canvas.js
function loadDesignFromDatabase(designId) {
    // Show loading indicator
    document.getElementById('canvas-info').textContent = "Loading design...";
    
    // Extract numeric ID if it starts with "canvas_design_"
    let apiEndpoint;
    if (designId.startsWith('canvas_design_')) {
        const numericId = designId.replace('canvas_design_', '');
        apiEndpoint = `/api/get-design/${numericId}/`;
    } else {
        apiEndpoint = `/api/get-design/${designId}/`;
    }
    
    console.log("Requesting design from:", apiEndpoint);
    
    // Fetch design data from your database API
    fetch(apiEndpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success || !data.design || !data.design.stageData) {
                throw new Error('Invalid design data from server');
            }
            
            console.log("Design loaded successfully from database");
            
            // Rebuild canvas from the loaded stage data
            rebuildCanvas(data.design.stageData, data.design.name);
            
            // Now set up the rest of the UI
            setupFurnitureGallery();
            setupBackgroundUpload();
            setupButtons();
            
            // Update canvas info
            document.getElementById('canvas-info').textContent = 
                `Loaded design: ${data.design.name} (${data.design.itemCount || 0} items)`;
        })
        .catch(error => {
            console.error("Error loading design from database:", error);
            document.getElementById('canvas-info').textContent = 
                "Error loading design. Please try again.";
            
            // Initialize the canvas normally so the user can still work
            setupFurnitureGallery();
            setupBackgroundUpload();
            setupButtons();
            saveState();
            
            // Show error to user
            alert("Could not load the design. Please try again.");
        });
}

// Add this function to rebuild the canvas from saved data
function rebuildCanvas(stageData, designName) {
    try {
        // If stageData is a string (JSON), parse it
        if (typeof stageData === 'string') {
            stageData = JSON.parse(stageData);
        }
        
        // Destroy current stage if it exists
        if (stage) {
            stage.destroy();
        }
        
        // Create new stage from the data
        stage = Konva.Node.create(stageData, 'container');
        
        // Get layer references
        backgroundLayer = stage.findOne('.backgroundLayer') || stage.findOne('.Layer:first-child');
        furnitureLayer = stage.findOne('.furnitureLayer') || stage.findOne('.Layer:nth-child(2)');
        
        // If layers don't exist, create them
        if (!backgroundLayer) {
            backgroundLayer = new Konva.Layer({ name: 'backgroundLayer' });
            stage.add(backgroundLayer);
        }
        
        if (!furnitureLayer) {
            furnitureLayer = new Konva.Layer({ name: 'furnitureLayer' });
            stage.add(furnitureLayer);
        }
        
        // Create transformer for resizing/rotating furniture
        tr = new Konva.Transformer({
            rotationSnaps: [0, 90, 180, 270],
            borderDash: [5, 5]
        });
        
        furnitureLayer.add(tr);
        
        // Make sure furniture layer is on top
        furnitureLayer.moveToTop();
        
        // Set up events for furniture items
        const furnitureItems = furnitureLayer.find('Image');
        console.log(`Found ${furnitureItems.length} furniture items to restore`);
        
        furnitureItems.forEach((item, index) => {
            console.log(`Setting up item ${index+1}: ${item.name()}`);
            
            // Make sure it's visible and draggable
            item.draggable(true);
            item.visible(true);
            
            // Click to select
            item.on('click tap', function() {
                tr.nodes([item]);
                furnitureLayer.draw();
            });
            
            // Double-click to delete
            item.on('dblclick dbltap', function() {
                item.destroy();
                tr.nodes([]);
                furnitureLayer.draw();
                saveState();
            });
            
            // Save after modifications
            item.on('dragend', saveState);
            item.on('transformend', saveState);
        });
        
        // Set stage click handler (deselect when clicking on empty area)
        stage.on('click', function(e) {
            if (e.target === stage) {
                tr.nodes([]);
                furnitureLayer.draw();
            }
        });
        
        // Make sure everything is drawn
        stage.draw();
        
        // Update history with this as the first state
        history = [stage.toJSON()];
        currentStep = 0;
        updateUndoRedoButtons();
        
        // Fix image visibility issues (important!)
        fixFurnitureVisibility();
        fixBackgroundVisibility(); // Add this line to fix background images too

        isCanvasInitialized = true;
        console.log("Canvas rebuilt from database data with name:", designName);
        
    } catch (error) {
        console.error("Error rebuilding canvas:", error);
        alert("There was an error loading the design. Some elements may not display correctly.");
    }
}

// Add this function after rebuildCanvas
function fixFurnitureVisibility() {
    if (!furnitureLayer) {
        console.error("Furniture layer not available");
        return;
    }
    
    const furnitureItems = furnitureLayer.find('Image');
    console.log(`Fixing visibility for ${furnitureItems.length} furniture items`);
    
    let loadedCount = 0;
    
    furnitureItems.forEach((item, index) => {
        // Get the image source
        const imageSrc = item.getAttr('imageSrc');
        
        if (!imageSrc) {
            console.warn(`Item ${index+1} has no imageSrc attribute`);
            return;
        }
        
        // Create a new image object
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        // Set up load event
        img.onload = function() {
            loadedCount++;
            console.log(`Reloaded image ${loadedCount}/${furnitureItems.length}: ${imageSrc.substring(0, 50)}...`);
            
            // Update the Konva image with the fresh image
            item.image(img);
            item.visible(true);
            furnitureLayer.draw();
        };
        
        img.onerror = function() {
            console.error(`Failed to reload image for item ${index+1}: ${item.name()}`);
            
            // Try with alternative paths
            if (!imageSrc.startsWith('/')) {
                img.src = '/' + imageSrc;
            } else if (!imageSrc.startsWith('/media/')) {
                img.src = '/media/' + imageSrc.replace(/^\//, '');
            }
        };
        
        // Start loading
        img.src = imageSrc;
    });
}

// Add this function to fix background image loading
function fixBackgroundVisibility() {
    if (!backgroundLayer) {
        console.error("Background layer not available");
        return;
    }
    
    const bgImages = backgroundLayer.find('Image');
    console.log(`Fixing visibility for ${bgImages.length} background images`);
    
    if (bgImages.length === 0) {
        console.log("No background images found");
        return;
    }
    
    bgImages.forEach((bgImage, index) => {
        // Get the image source
        const imageSrc = bgImage.getAttr('imageSrc');
        
        if (!imageSrc) {
            console.warn(`Background image ${index+1} has no imageSrc attribute`);
            return;
        }
        
        console.log(`Attempting to reload background image from: ${imageSrc.substring(0, 50)}...`);
        
        // Create a new image object
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        // Set up load event
        img.onload = function() {
            console.log("Background image loaded successfully");
            
            // Update the Konva image with the fresh image
            bgImage.image(img);
            bgImage.visible(true);
            backgroundLayer.draw();
        };
        
        img.onerror = function() {
            console.error(`Failed to reload background image ${index+1}`);
            
            // Try with alternative paths
            if (!imageSrc.startsWith('/')) {
                img.src = '/' + imageSrc;
            } else if (!imageSrc.startsWith('/media/')) {
                img.src = '/media/' + imageSrc.replace(/^\//, '');
            } else if (imageSrc.startsWith('data:')) {
                // If it's a data URL, just log it - nothing more we can try
                console.log("Image is a data URL - can't try alternative paths");
            }
        };
        
        // Start loading
        img.src = imageSrc;
    });
}

// Add this function to your canvas.js file
function enhanceMobileSupport() {
    // Check if we're on a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        console.log("Touch device detected - applying mobile optimizations");
        
        // Prevent page scrolling when interacting with the canvas
        const container = document.getElementById('container');
        if (container) {
            container.addEventListener('touchmove', function(e) {
                if (e.target.tagName === 'CANVAS') {
                    e.preventDefault();
                }
            }, { passive: false });
        }
        
        // Set Konva specific touch options
        Konva.hitOnDragEnabled = true;  // Improve drag detection
        
        // Fix transformer handles for touch
        if (tr) {
            // Make handles larger for touch
            tr.anchorSize(10);
            tr.rotateAnchorOffset(20);
            tr.padding(5);
            furnitureLayer.draw();
        }
    }
}