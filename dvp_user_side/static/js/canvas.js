document.addEventListener('DOMContentLoaded', function() {
    // Initialize Konva stage and layers
    const container = document.getElementById('container');
    const stage = initializeCanvas();
    
    const backgroundLayer = new Konva.Layer();
    const furnitureLayer = new Konva.Layer();
    
    stage.add(backgroundLayer);
    stage.add(furnitureLayer);
    
    // Create transformer for resizing/rotating
    const tr = new Konva.Transformer({
        nodes: [],
        rotationSnaps: [0, 90, 180, 270],
        borderDash: [5, 5],
        boundBoxFunc: function(oldBoundBox, newBoundBox) {
            if (newBoundBox.width < 20 || newBoundBox.height < 20) {
                return oldBoundBox;
            }
            return newBoundBox;
        }
    });
    
    furnitureLayer.add(tr);
    
    // Set up undo/redo history
    let history = [];
    let currentStep = -1;
    
    // Local storage key
    const STORAGE_KEY = 'roomDesignData';

    // Check if there's saved data in local storage
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.stageData) {
                // Load the saved stage
                stage.destroy();
                stage = Konva.Node.create(parsedData.stageData, 'container');
                
                // Get layer references
                backgroundLayer = stage.findOne('.Layer:first-child');
                furnitureLayer = stage.findOne('.Layer:nth-child(2)');
                
                // Recreate transformer
                tr = new Konva.Transformer({
                    rotationSnaps: [0, 90, 180, 270],
                    boundBoxFunc: function(oldBoundBox, newBoundBox) {
                        if (newBoundBox.width < 20 || newBoundBox.height < 20) {
                            return oldBoundBox;
                        }
                        return newBoundBox;
                    }
                });
                
                furnitureLayer.add(tr);
                
                // Setup events for loaded furniture
                setupFurnitureEvents();
                
                // Load history if available
                if (parsedData.history && parsedData.currentStep !== undefined) {
                    history = parsedData.history;
                    currentStep = parsedData.currentStep;
                }
                
                // Update info display
                updateFurnitureCount();
                if (backgroundLayer.findOne('Image')) {
                    document.getElementById('canvas-info').textContent = 'Background: Restored from saved design';
                }
                
                console.log('Restored design from local storage');
            }
        }
    } catch (e) {
        console.error('Error loading from local storage:', e);
        // Continue with empty canvas if loading fails
    }

    // Setup furniture events (for reuse with loaded items)
    function setupFurnitureEvents() {
        furnitureLayer.find('Image').forEach(node => {
            node.draggable(true);
            
            node.on('click tap', function() {
                tr.nodes([node]);
                furnitureLayer.draw();
            });
            
            node.on('dblclick dbltap', function() {
                node.destroy();
                tr.nodes([]);
                furnitureLayer.draw();
                updateFurnitureCount();
                saveState();
            });
            
            node.on('dragend', saveState);
            node.on('transformend', saveState);
        });
        
        // Handle stage click for empty area
        stage.on('click', function(e) {
            if (e.target === stage) {
                tr.nodes([]);
                furnitureLayer.draw();
            }
        });
    }
    
    // Make furniture items draggable
    document.querySelectorAll('.furniture-item').forEach(item => {
        item.setAttribute('draggable', 'true');
        
        // Add drag start event
        item.addEventListener('dragstart', function(e) {
            // Store the furniture data in the drag event
            const src = this.getAttribute('data-src');
            const name = this.getAttribute('data-name');
            const productId = this.getAttribute('data-product-id');
            
            e.dataTransfer.setData('text/plain', JSON.stringify({
                src: src,
                name: name,
                productId: productId
            }));
            
            // Add visual feedback
            this.classList.add('opacity-50');
            
            // Set a custom drag image (optional)
            const img = this.querySelector('img');
            if (img) {
                const dragImage = img.cloneNode(true);
                dragImage.style.width = '100px';
                dragImage.style.height = 'auto';
                dragImage.style.opacity = '0.7';
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 50, 50);
                
                // Remove the clone after dragstart completes
                setTimeout(() => {
                    document.body.removeChild(dragImage);
                }, 0);
            }
        });
        
        // Reset appearance after drag ends
        item.addEventListener('dragend', function() {
            this.classList.remove('opacity-50');
        });
        
        // Keep the click handler for users who prefer clicking
        item.addEventListener('click', function() {
            const src = this.getAttribute('data-src');
            const name = this.getAttribute('data-name');
            
            // Add visual feedback when clicked
            this.classList.add('ring-2', 'ring-blue-500', 'scale-95');
            setTimeout(() => {
                this.classList.remove('ring-2', 'ring-blue-500', 'scale-95');
            }, 300);
            
            // Add to canvas
            addFurnitureToCanvas(src, name);
        });
    });

    // Make canvas container a drop target
    const canvasContainer = document.getElementById('container');

    canvasContainer.addEventListener('dragover', function(e) {
        // Allow drop
        e.preventDefault();
        
        // Add visual feedback
        this.classList.add('border-blue-500', 'ring-2', 'ring-blue-200');
    });

    canvasContainer.addEventListener('dragleave', function(e) {
        // Remove visual feedback
        this.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200');
    });

    canvasContainer.addEventListener('drop', function(e) {
        // Prevent default behavior
        e.preventDefault();
        
        // Remove visual feedback
        this.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200');
        
        // Get dropped data
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            
            if (data && data.src && data.name) {
                // Calculate drop position relative to the stage
                const stageRect = stage.container().getBoundingClientRect();
                const x = e.clientX - stageRect.left;
                const y = e.clientY - stageRect.top;
                
                // Add furniture at the drop position
                addFurnitureToCanvasWithPosition(data.src, data.name, x, y);
            }
        } catch (error) {
            console.error('Error processing drop:', error);
        }
    });

    // New function to add furniture at a specific position
    function addFurnitureToCanvasWithPosition(src, name, x, y) {
        console.log("Adding furniture at position:", x, y);
        
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
            
            // Create furniture image at the drop position
            const furniture = new Konva.Image({
                x: x - width / 2,  // Center at drop position
                y: y - height / 2, // Center at drop position
                image: img,
                width: width,
                height: height,
                draggable: true,
                name: name
            });
            
            // Add click handler
            furniture.on('click tap', function() {
                tr.nodes([furniture]);
                furnitureLayer.draw();
            });
            
            // Add double-click to delete
            furniture.on('dblclick dbltap', function() {
                furniture.destroy();
                tr.nodes([]);
                furnitureLayer.draw();
                updateFurnitureCount();
                saveState();
            });
            
            // Save state after interactions
            furniture.on('dragend', saveState);
            furniture.on('transformend', saveState);
            
            // Add to layer
            furnitureLayer.add(furniture);
            
            // Select the new furniture
            tr.nodes([furniture]);
            furnitureLayer.draw();
            
            // Update count
            updateFurnitureCount();
            
            // Save state
            saveState();
        };
        
        img.onerror = function() {
            console.error('Error loading image:', src);
            // Try with different URL formats
            if (!src.startsWith('http') && !src.startsWith('/media/')) {
                img.src = '/media/' + src;
            } else if (!src.startsWith('http') && !src.startsWith('/static/')) {
                img.src = '/static/' + src;
            } else {
                alert('Failed to load furniture image: ' + name);
            }
        };
        
        img.src = src;
    }

    // Add click handlers for furniture items
    document.querySelectorAll('.furniture-item').forEach(item => {
        item.addEventListener('click', function() {
            const src = this.getAttribute('data-src');
            const name = this.getAttribute('data-name');
            
            // Add visual feedback when clicked
            this.classList.add('ring-2', 'ring-blue-500', 'scale-95');
            setTimeout(() => {
                this.classList.remove('ring-2', 'ring-blue-500', 'scale-95');
            }, 300);
            
            // Add to canvas
            addFurnitureToCanvas(src, name);
        });
    });
    
    // Handle background upload
    document.getElementById('background-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('file-name').textContent = file.name;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    // Clear background layer
                    backgroundLayer.destroyChildren();
                    
                    // Scale to fit
                    const stageWidth = stage.width();
                    const stageHeight = stage.height();
                    const scale = Math.min(stageWidth/img.width, stageHeight/img.height);
                    
                    // Add background image
                    const bgImage = new Konva.Image({
                        x: (stageWidth - img.width * scale) / 2,
                        y: (stageHeight - img.height * scale) / 2,
                        image: img,
                        width: img.width * scale,
                        height: img.height * scale
                    });
                    
                    backgroundLayer.add(bgImage);
                    backgroundLayer.draw();
                    
                    // Update info
                    document.getElementById('canvas-info').textContent = 
                        `Background: ${file.name} (${Math.round(bgImage.width())}×${Math.round(bgImage.height())})`;
                    
                    saveState();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Undo function
    function undo() {
        if (currentStep > 0) {
            console.log(`Undoing from step ${currentStep} to ${currentStep - 1}`);
            currentStep--;
            loadState(currentStep);
        } else {
            console.log('Cannot undo: already at oldest state');
        }
    }
    
    // Redo function
    function redo() {
        if (currentStep < history.length - 1) {
            console.log(`Redoing from step ${currentStep} to ${currentStep + 1}`);
            currentStep++;
            loadState(currentStep);
        } else {
            console.log('Cannot redo: already at newest state');
        }
    }
    
    // Action buttons
    document.getElementById('undo-btn').addEventListener('click', undo);
    document.getElementById('redo-btn').addEventListener('click', redo);
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('export-btn').addEventListener('click', exportDesign);
    document.getElementById('save-state-btn').addEventListener('click', function() {
        try {
            // Save to local storage with the current stage data
            const dataToSave = {
                stageData: stage.toJSON(),
                history: history,
                currentStep: currentStep,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            
            // Visual feedback
            const button = document.getElementById('save-state-btn');
            const originalText = button.innerHTML;
            
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Saved!
            `;
            
            // Briefly change button appearance
            button.classList.add('bg-green-700');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('bg-green-700');
            }, 1500);
            
            console.log('Design saved to local storage');
        } catch (e) {
            console.error('Error saving to local storage:', e);
            
            // Show error
            alert('Error saving design. Your browser might have storage restrictions.');
        }
    });
    
    // Deselect when clicking empty canvas
    stage.on('click', function(e) {
        if (e.target === stage) {
            tr.nodes([]);
            furnitureLayer.draw();
        }
    });
    
    // Add furniture to canvas
    function addFurnitureToCanvas(src, name) {
        console.log("Adding furniture:", src, name);
        
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
            
            // Create furniture image
            const furniture = new Konva.Image({
                x: stage.width() / 2 - width / 2,
                y: stage.height() / 2 - height / 2,
                image: img,
                width: width,
                height: height,
                draggable: true,
                name: name
            });
            
            // Add click handler
            furniture.on('click tap', function() {
                tr.nodes([furniture]);
                furnitureLayer.draw();
            });
            
            // Add double-click to delete
            furniture.on('dblclick dbltap', function() {
                furniture.destroy();
                tr.nodes([]);
                furnitureLayer.draw();
                updateFurnitureCount(); 
                saveState();
            });
            
            // Save state after interactions
            furniture.on('dragend', saveState);
            furniture.on('transformend', saveState);
            
            // Add to layer
            furnitureLayer.add(furniture);
            
            // Select the new furniture
            tr.nodes([furniture]);
            furnitureLayer.draw();
            
            // Update count
            updateFurnitureCount();
            
            // Save state
            saveState();
        };
        
        img.onerror = function() {
            console.error('Error loading image:', src);
            // Try with different URL formats
            if (!src.startsWith('http') && !src.startsWith('/media/')) {
                img.src = '/media/' + src;
            } else if (!src.startsWith('http') && !src.startsWith('/static/')) {
                img.src = '/static/' + src;
            } else {
                alert('Failed to load furniture image: ' + name);
            }
        };
        
        img.src = src;
    }
    
    function updateFurnitureCount() {
        const count = furnitureLayer.find('Image').length;
        document.getElementById('furniture-count').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    }
    
    function saveState() {
        // Trim history correctly - this is where the problem likely is
        if (currentStep < history.length - 1) {
            history = history.slice(0, currentStep + 1);
        }
        
        // Save state to history
        history.push(stage.toJSON());
        currentStep++;
        
        // Update buttons
        updateUndoRedoButtons();
        
        console.log(`History state saved. Current step: ${currentStep}, Total states: ${history.length}`);
    }
    
    function updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = currentStep <= 0;
            undoBtn.classList.toggle('opacity-50', currentStep <= 0);
        }
        
        if (redoBtn) {
            redoBtn.disabled = currentStep >= history.length - 1;
            redoBtn.classList.toggle('opacity-50', currentStep >= history.length - 1);
        }
        
        console.log(`Button states updated: Undo ${undoBtn ? (undoBtn.disabled ? 'disabled' : 'enabled') : 'missing'}, Redo ${redoBtn ? (redoBtn.disabled ? 'disabled' : 'enabled') : 'missing'}`);
    }
    
    function loadState(index) {
        if (!history[index] || index < 0 || index >= history.length) {
            console.warn(`Invalid history state index: ${index}`);
            return;
        }
        
        console.log(`Loading state ${index} of ${history.length - 1}`);
        
        try {
            // Store container reference and dimensions
            const container = stage.container();
            const width = stage.width();
            const height = stage.height();
            
            // Destroy current stage
            stage.destroy();
            
            // Create new stage from JSON
            stage = Konva.Node.create(history[index], 'container');
            
            // Ensure stage has correct dimensions
            stage.width(width);
            stage.height(height);
            
            // Get layer references
            backgroundLayer = stage.findOne('.Layer:first-child');
            furnitureLayer = stage.findOne('.Layer:nth-child(2)');
            
            // Recreate transformer
            tr = new Konva.Transformer({
                rotationSnaps: [0, 90, 180, 270],
                boundBoxFunc: function(oldBoundBox, newBoundBox) {
                    if (newBoundBox.width < 20 || newBoundBox.height < 20) {
                        return oldBoundBox;
                    }
                    return newBoundBox;
                }
            });
            
            furnitureLayer.add(tr);
            
            // Set up events for furniture items
            setupFurnitureEvents();
            
            // Update count
            updateFurnitureCount();
            
            // Update undo/redo buttons
            updateUndoRedoButtons();
            
            // Restore event handlers for stage
            stage.on('click', function(e) {
                if (e.target === stage) {
                    tr.nodes([]);
                    furnitureLayer.draw();
                }
            });
            
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }
    
    function clearCanvas() {
        console.log("Clearing canvas...");
        
        // Clear all furniture from the layer
        furnitureLayer.destroyChildren();
        
        // Add transformer back
        tr = new Konva.Transformer({
            rotationSnaps: [0, 90, 180, 270],
            borderDash: [5, 5],
            boundBoxFunc: function(oldBoundBox, newBoundBox) {
                if (newBoundBox.width < 20 || newBoundBox.height < 20) {
                    return oldBoundBox;
                }
                return newBoundBox;
            }
        });
        furnitureLayer.add(tr);
        
        // Draw the layer to show changes
        furnitureLayer.draw();
        
        // Update count
        updateFurnitureCount();
        
        // IMPORTANT: Create a completely fresh state entry rather than modifying existing history
        // This ensures the clear operation works correctly after undo/redo
        history.push(stage.toJSON());
        currentStep = history.length - 1;
        
        // Update button states
        updateUndoRedoButtons();
        
        console.log("Canvas cleared. History length: " + history.length + ", Current step: " + currentStep);
    }

    function exportDesign() {
        // Hide transformer
        const nodes = tr.nodes();
        tr.nodes([]);
        furnitureLayer.draw();
        
        // Export as PNG
        const dataURL = stage.toDataURL({ 
            pixelRatio: 2,
            mimeType: 'image/png'
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = 'room-design.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Restore transformer
        tr.nodes(nodes);
        furnitureLayer.draw();
    }
    
    // Add local storage control buttons - FIXED VERSION
    setTimeout(function() {
        // Find button container more reliably
        const buttonContainer = document.querySelector('.flex.space-x-2');
        
        if (buttonContainer) {
            // Create Clear Saved button
            const clearSavedBtn = document.createElement('button');
            clearSavedBtn.id = 'clear-saved-btn';
            clearSavedBtn.className = 'btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 tooltip';
            clearSavedBtn.setAttribute('data-tooltip', 'Delete saved design');
            clearSavedBtn.textContent = 'Clear Saved';
            
            // Add click handler
            clearSavedBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete your saved design? This cannot be undone.')) {
                    localStorage.removeItem('roomDesignData');
                    alert('Saved design has been deleted. The current canvas will remain until you refresh the page.');
                }
            });
            
            // Append to container
            buttonContainer.appendChild(clearSavedBtn);
            console.log('Clear Saved button added successfully');
        } else {
            console.error('Button container not found for Clear Saved button');
            
            // Alternative: Insert the button directly after the Clear button
            const clearBtn = document.getElementById('clear-btn');
            if (clearBtn && clearBtn.parentNode) {
                const clearSavedBtn = document.createElement('button');
                clearSavedBtn.id = 'clear-saved-btn';
                clearSavedBtn.className = 'btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 tooltip';
                clearSavedBtn.setAttribute('data-tooltip', 'Delete saved design');
                clearSavedBtn.textContent = 'Clear Saved';
                
                clearSavedBtn.addEventListener('click', function() {
                    if (confirm('Are you sure you want to delete your saved design? This cannot be undone.')) {
                        localStorage.removeItem('roomDesignData');
                        alert('Saved design has been deleted. The current canvas will remain until you refresh the page.');
                    }
                });
                
                clearBtn.parentNode.insertBefore(clearSavedBtn, clearBtn.nextSibling);
                console.log('Clear Saved button added via alternative method');
            }
        }
    }, 500); // Small delay to ensure DOM is fully loaded
    
    // Additional check to ensure buttons exist and listeners are attached
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
        console.log('Undo button event listener attached');
    } else {
        console.error('Undo button not found in DOM');
    }
    
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
        console.log('Redo button event listener attached');
    } else {
        console.error('Redo button not found in DOM');
    }

    // Ensure the initial button states are set
    if (history.length === 0) {
        saveState(); // Initial state
    } else {
        updateUndoRedoButtons();
    }

    // Initialize
    if (history.length === 0) {
        saveState(); // Initial state
    } else {
        updateUndoRedoButtons();
    }

    // Add window resize handler
    window.addEventListener('resize', resizeCanvas);
    
    // Initial resize call to ensure proper dimensions
    resizeCanvas();
});

// Initialize the Konva stage with proper sizing
function initializeCanvas() {
    const container = document.getElementById('container');
    if (!container) return;
    
    // Set stage to container width and appropriate height
    const stage = new Konva.Stage({
        container: 'container',
        width: container.clientWidth,
        height: container.clientHeight || 550
    });
    
    return stage;
}

// Resize function to maintain proper canvas size
function resizeCanvas() {
    const container = document.getElementById('container');
    if (!container || !stage) return;
    
    // Maintain aspect ratio or just adjust to container size
    stage.width(container.clientWidth);
    stage.height(container.clientHeight);
    
    // Update layers
    backgroundLayer.draw();
    furnitureLayer.draw();
    
    console.log('Canvas resized to:', stage.width(), 'x', stage.height());
}