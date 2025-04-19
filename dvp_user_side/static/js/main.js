// Import Konva
import Konva from 'konva';

// Initialize Konva Stage
const width = document.getElementById('canvas-container').clientWidth;
const height = document.getElementById('canvas-container').clientHeight;

let stage = new Konva.Stage({
    container: 'canvas-container',
    width: width,
    height: height,
});

// Create layers
const backgroundLayer = new Konva.Layer();
const gridLayer = new Konva.Layer();
const furnitureLayer = new Konva.Layer();

stage.add(backgroundLayer);
stage.add(gridLayer);
stage.add(furnitureLayer);

// Add grid to the canvas (will be visible when no background is present)
function createGrid() {
    const gridSize = 20;
    const gridColor = '#e2e8f0';
    
    for (let i = 0; i < width; i += gridSize) {
        const line = new Konva.Line({
            points: [i, 0, i, height],
            stroke: gridColor,
            strokeWidth: 1,
        });
        gridLayer.add(line);
    }
    
    for (let i = 0; i < height; i += gridSize) {
        const line = new Konva.Line({
            points: [0, i, width, i],
            stroke: gridColor,
            strokeWidth: 1,
        });
        gridLayer.add(line);
    }
    
    gridLayer.draw();
}

createGrid();

// History for undo/redo
const history = {
    states: [],
    currentIndex: -1,
    maxStates: 50,
    
    saveState() {
        // Remove any states after the current one (if we've gone back in history)
        if (this.currentIndex < this.states.length - 1) {
            this.states = this.states.slice(0, this.currentIndex + 1);
        }
        
        // Save current state
        const state = stage.toJSON();
        this.states.push(state);
        this.currentIndex++;
        
        // Limit the number of saved states
        if (this.states.length > this.maxStates) {
            this.states.shift();
            this.currentIndex--;
        }
        
        // Update button states
        updateUndoRedoButtons();
        updateFurnitureCount();
    },
    
    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            const previousState = this.states[this.currentIndex];
            loadState(previousState);
            updateUndoRedoButtons();
            updateFurnitureCount();
        }
    },
    
    redo() {
        if (this.currentIndex < this.states.length - 1) {
            this.currentIndex++;
            const nextState = this.states[this.currentIndex];
            loadState(nextState);
            updateUndoRedoButtons();
            updateFurnitureCount();
        }
    },
    
    clear() {
        // Keep background but remove all furniture
        const furnitureNodes = stage.find('.furniture');
        furnitureNodes.forEach(node => node.destroy());
        stage.find('Transformer').destroy();
        furnitureLayer.draw();
        this.saveState();
        updateFurnitureCount();
    }
};

function loadState(stateJson) {
    // Store reference to the container
    const container = stage.container();
    
    // Destroy the stage
    stage.destroy();
    
    // Create new stage from saved state
    stage = Konva.Node.create(stateJson, 'canvas-container');
    
    // Find layers
    backgroundLayer = stage.findOne('.backgroundLayer');
    gridLayer = stage.findOne('.gridLayer');
    furnitureLayer = stage.findOne('.furnitureLayer');
    
    if (!backgroundLayer) {
        backgroundLayer = new Konva.Layer({ name: 'backgroundLayer' });
        stage.add(backgroundLayer);
    }
    
    if (!gridLayer) {
        gridLayer = new Konva.Layer({ name: 'gridLayer' });
        stage.add(gridLayer);
    }
    
    if (!furnitureLayer) {
        furnitureLayer = new Konva.Layer({ name: 'furnitureLayer' });
        stage.add(furnitureLayer);
    }
    
    // Reattach event handlers
    reattachEventHandlers();
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    undoBtn.disabled = history.currentIndex <= 0;
    redoBtn.disabled = history.currentIndex >= history.states.length - 1;
    
    undoBtn.classList.toggle('opacity-50', undoBtn.disabled);
    redoBtn.classList.toggle('opacity-50', redoBtn.disabled);
    
    // Update tooltips
    undoBtn.setAttribute('data-tooltip', history.currentIndex <= 0 ? 'Nothing to undo' : 'Undo last action');
    redoBtn.setAttribute('data-tooltip', history.currentIndex >= history.states.length - 1 ? 'Nothing to redo' : 'Redo last action');
}

function updateFurnitureCount() {
    const count = stage.find('.furniture').length;
    document.getElementById('furniture-count').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
}

function reattachEventHandlers() {
    // Find all furniture items and reattach event handlers
    const furnitureNodes = stage.find('.furniture');
    furnitureNodes.forEach(node => {
        attachTransformerToNode(node);
    });
    
    // Reattach stage click handler
    stage.on('click', function(e) {
        if (e.target === stage) {
            stage.find('Transformer').destroy();
            furnitureLayer.draw();
        }
    });
}

// Background image handling
document.getElementById('background-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Update file name display
        document.getElementById('file-name').textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            // Remove existing background
            backgroundLayer.destroyChildren();
            
            const img = new Image();
            img.onload = function() {
                // Calculate scaling to fit the canvas while maintaining aspect ratio
                const scale = Math.min(
                    stage.width() / img.width,
                    stage.height() / img.height
                );
                
                const bgImage = new Konva.Image({
                    x: (stage.width() - img.width * scale) / 2, // Center horizontally
                    y: (stage.height() - img.height * scale) / 2, // Center vertically
                    image: img,
                    width: img.width * scale,
                    height: img.height * scale,
                    name: 'background',
                });
                
                backgroundLayer.add(bgImage);
                backgroundLayer.draw();
                
                // Update canvas info
                document.getElementById('canvas-info').textContent = 
                    `Background: ${file.name} (${Math.round(img.width * scale)}×${Math.round(img.height * scale)})`;
                
                // Add a subtle shadow to the background
                bgImage.shadowColor = 'rgba(0,0,0,0.2)';
                bgImage.shadowBlur = 10;
                bgImage.shadowOffset = { x: 0, y: 5 };
                bgImage.shadowOpacity = 0.3;
                
                // Save state after background change
                history.saveState();
                
                // Show success notification
                showNotification('Background image loaded successfully!', 'success');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Furniture search functionality
document.getElementById('search-btn')?.addEventListener('click', searchFurniture);
document.getElementById('furniture-search').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        searchFurniture();
    } else {
        // Real-time search as user types
        searchFurniture();
    }
});

function searchFurniture() {
    const searchTerm = document.getElementById('furniture-search').value.toLowerCase();
    const furnitureItems = document.querySelectorAll('.furniture-item');
    let matchCount = 0;
    
    furnitureItems.forEach(item => {
        const itemName = item.querySelector('p').textContent.toLowerCase();
        if (searchTerm === '' || itemName.includes(searchTerm)) {
            item.style.display = 'block';
            matchCount++;
            
            // Highlight the matching text
            if (searchTerm !== '') {
                const nameElement = item.querySelector('p');
                const itemText = nameElement.textContent;
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                nameElement.innerHTML = itemText.replace(regex, '<span class="bg-yellow-200">$1</span>');
            } else {
                const nameElement = item.querySelector('p');
                nameElement.innerHTML = nameElement.textContent; // Reset highlighting
            }
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show message if no matches
    const gallery = document.getElementById('furniture-gallery');
    let noResultsMsg = gallery.querySelector('.no-results-message');
    
    if (matchCount === 0 && searchTerm !== '') {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message col-span-2 text-center py-4 text-gray-500';
            noResultsMsg.innerHTML = `No furniture matching "<span class="font-medium">${searchTerm}</span>" found`;
            gallery.appendChild(noResultsMsg);
        } else {
            noResultsMsg.innerHTML = `No furniture matching "<span class="font-medium">${searchTerm}</span>" found`;
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Add furniture to canvas
document.querySelectorAll('.furniture-item').forEach(item => {
    item.addEventListener('click', function() {
        const imageSrc = this.getAttribute('data-src');
        const itemName = this.querySelector('p').textContent;
        
        // Add visual feedback when clicked
        this.classList.add('ring-2', 'ring-blue-500', 'scale-95');
        setTimeout(() => {
            this.classList.remove('ring-2', 'ring-blue-500', 'scale-95');
        }, 300);
        
        addFurnitureToCanvas(imageSrc, itemName);
    });
});

function addFurnitureToCanvas(src, name) {
    // Create placeholder with loading animation
    const placeholderGroup = new Konva.Group({
        x: stage.width() / 2 - 50,
        y: stage.height() / 2 - 50,
        name: 'loading-placeholder',
    });
    
    const placeholder = new Konva.Rect({
        width: 100,
        height: 100,
        fill: '#e5e7eb',
        stroke: '#9ca3af',
        strokeWidth: 2,
        cornerRadius: 5,
    });
    
    const loadingText = new Konva.Text({
        text: 'Loading...',
        fontSize: 14,
        fontFamily: 'Poppins, sans-serif',
        fill: '#6b7280',
        width: 100,
        align: 'center',
        y: 40,
    });
    
    placeholderGroup.add(placeholder);
    placeholderGroup.add(loadingText);
    
    furnitureLayer.add(placeholderGroup);
    furnitureLayer.draw();
    
    // Create loading animation
    const loadingAnim = new Konva.Animation(function(frame) {
        const opacity = 0.5 + 0.5 * Math.sin(frame.time / 200);
        placeholder.opacity(opacity);
    }, furnitureLayer);
    
    loadingAnim.start();
    
    // Load the actual image
    const img = new Image();
    img.onload = function() {
        // Stop and remove loading animation
        loadingAnim.stop();
        placeholderGroup.destroy();
        
        // Calculate initial size (not too big)
        const maxDimension = 200;
        const scale = Math.min(
            maxDimension / img.width,
            maxDimension / img.height
        );
        
        const furnitureItem = new Konva.Image({
            x: stage.width() / 2 - (img.width * scale) / 2,
            y: stage.height() / 2 - (img.height * scale) / 2,
            image: img,
            width: img.width * scale,
            height: img.height * scale,
            draggable: true,
            name: 'furniture',
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowBlur: 10,
            shadowOffset: { x: 5, y: 5 },
            shadowOpacity: 0.3,
            cornerRadius: 2,
        });
        
        // Add metadata
        furnitureItem.setAttr('itemName', name);
        
        // Add entrance animation
        furnitureItem.scale({ x: 0, y: 0 });
        furnitureLayer.add(furnitureItem);
        
        // Animate the entrance
        const tween = new Konva.Tween({
            node: furnitureItem,
            duration: 0.3,
            easing: Konva.Easings.ElasticEaseOut,
            scaleX: 1,
            scaleY: 1,
            onFinish: function() {
                // Attach transformer after animation completes
                attachTransformerToNode(furnitureItem);
                
                // Save state after adding furniture
                history.saveState();
                
                // Show success notification
                showNotification(`Added ${name} to canvas`, 'success');
            }
        });
        
        tween.play();
    };
    
    // Handle image loading errors
    img.onerror = function() {
        // Stop and remove loading animation
        loadingAnim.stop();
        placeholderGroup.destroy();
        
        console.error('Failed to load furniture image:', src);
        
        // Show error message on canvas
        const errorGroup = new Konva.Group({
            x: stage.width() / 2 - 100,
            y: stage.height() / 2 - 50,
        });
        
        const errorBg = new Konva.Rect({
            width: 200,
            height: 100,
            fill: '#fee2e2',
            stroke: '#ef4444',
            strokeWidth: 1,
            cornerRadius: 8,
        });
        
        const errorText = new Konva.Text({
            text: 'Failed to load image',
            fontSize: 16,
            fontFamily: 'Poppins, sans-serif',
            fill: '#b91c1c',
            width: 200,
            align: 'center',
            y: 40,
        });
        
        errorGroup.add(errorBg);
        errorGroup.add(errorText);
        furnitureLayer.add(errorGroup);
        furnitureLayer.draw();
        
        // Show error notification
        showNotification('Failed to load furniture image', 'error');
        
        // Remove error message after 3 seconds
        setTimeout(() => {
            errorGroup.destroy();
            furnitureLayer.draw();
        }, 3000);
    };
    
    // Use placeholder images for demo
    // In a real app, you'd use the actual src
    if (src === 'furniture/sofa.png') {
        img.src = 'https://via.placeholder.com/300x150?text=Sofa';
    } else if (src === 'furniture/chair.png') {
        img.src = 'https://via.placeholder.com/150x150?text=Chair';
    } else if (src === 'furniture/table.png') {
        img.src = 'https://via.placeholder.com/200x200?text=Table';
    } else if (src === 'furniture/bed.png') {
        img.src = 'https://via.placeholder.com/300x200?text=Bed';
    } else if (src === 'furniture/lamp.png') {
        img.src = 'https://via.placeholder.com/100x200?text=Lamp';
    } else if (src === 'furniture/bookshelf.png') {
        img.src = 'https://via.placeholder.com/150x250?text=Bookshelf';
    } else if (src === 'furniture/plant.png') {
        img.src = 'https://via.placeholder.com/120x200?text=Plant';
    } else if (src === 'furniture/rug.png') {
        img.src = 'https://via.placeholder.com/250x150?text=Rug';
    } else {
        img.src = src;
    }
}

// Attach transformer to furniture items
function attachTransformerToNode(node) {
    // Remove existing transformers
    stage.find('Transformer').destroy();
    
    const transformer = new Konva.Transformer({
        nodes: [node],
        keepRatio: true,
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
        rotationSnapTolerance: 15,
        borderStroke: '#3b82f6',
        borderStrokeWidth: 2,
        anchorStroke: '#3b82f6',
        anchorFill: '#ffffff',
        anchorSize: 10,
        anchorCornerRadius: 4,
        borderDash: [3, 3],
    });
    
    furnitureLayer.add(transformer);
    furnitureLayer.draw();
    
    // Add click handler to select this item
    node.on('click', function(evt) {
        // Prevent bubbling to stage
        evt.cancelBubble = true;
        
        // Remove existing transformers
        stage.find('Transformer').destroy();
        
        // Add new transformer to this node
        const newTransformer = new Konva.Transformer({
            nodes: [this],
            keepRatio: true,
            enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
            rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
            rotationSnapTolerance: 15,
            borderStroke: '#3b82f6',
            borderStrokeWidth: 2,
            anchorStroke: '#3b82f6',
            anchorFill: '#ffffff',
            anchorSize: 10,
            anchorCornerRadius: 4,
            borderDash: [3, 3],
        });
        
        furnitureLayer.add(newTransformer);
        furnitureLayer.draw();
        
        // Show item name in canvas info
        const itemName = this.getAttr('itemName') || 'Unknown item';
        document.getElementById('canvas-info').textContent = `Selected: ${itemName}`;
    });
    
    // Add hover effect
    node.on('mouseenter', function() {
        document.body.style.cursor = 'pointer';
        this.shadowBlur(15);
        furnitureLayer.draw();
    });
    
    node.on('mouseleave', function() {
        document.body.style.cursor = 'default';
        this.shadowBlur(10);
        furnitureLayer.draw();
    });
    
    // Save state after transformations
    node.on('transformend dragend', function() {
        history.saveState();
    });
    
    // Add double-click to delete
    node.on('dblclick', function(evt) {
        evt.cancelBubble = true;
        
        // Create confirmation dialog
        const confirmDelete = confirm(`Delete ${this.getAttr('itemName') || 'this item'}?`);
        
        if (confirmDelete) {
            // Remove transformer first
            stage.find('Transformer').destroy();
            
            // Create a fade-out animation
            const tween = new Konva.Tween({
                node: this,
                duration: 0.3,
                opacity: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                onFinish: () => {
                    this.destroy();
                    furnitureLayer.draw();
                    history.saveState();
                    showNotification('Item deleted', 'info');
                }
            });
            
            tween.play();
        }
    });
}

// Click on empty canvas to deselect
stage.on('click', function(e) {
    if (e.target === stage) {
        stage.find('Transformer').destroy();
        furnitureLayer.draw();
        
        // Reset canvas info
        const bgImage = stage.findOne('.background');
        if (bgImage) {
            const fileName = document.getElementById('background-upload').files[0]?.name || 'background';
            document.getElementById('canvas-info').textContent = 
                `Background: ${fileName} (${Math.round(bgImage.width())}×${Math.round(bgImage.height())})`;
        } else {
            document.getElementById('canvas-info').textContent = 'No background image loaded';
        }
    }
});

// Undo/Redo buttons
document.getElementById('undo-btn').addEventListener('click', function() {
    history.undo();
    showNotification('Undo successful', 'info');
});

document.getElementById('redo-btn').addEventListener('click', function() {
    history.redo();
    showNotification('Redo successful', 'info');
});

// Clear button
document.getElementById('clear-btn').addEventListener('click', function() {
    if (stage.find('.furniture').length === 0) {
        showNotification('Canvas is already empty', 'info');
        return;
    }
    
    const confirmClear = confirm('Are you sure you want to remove all furniture items?');
    if (confirmClear) {
        history.clear();
        showNotification('Canvas cleared', 'info');
    }
});

// Export functionality
document.getElementById('export-btn').addEventListener('click', function() {
    // Add visual feedback
    this.classList.add('scale-95');
    setTimeout(() => {
        this.classList.remove('scale-95');
    }, 200);
    
    // Create a temporary canvas to render the stage
    const dataURL = stage.toDataURL({ 
        pixelRatio: 2,
        mimeType: 'image/png'
    });
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'furniture-design.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Design exported successfully!', 'success');
});

// Handle window resize
window.addEventListener('resize', function() {
    const container = document.getElementById('canvas-container');
    const newWidth = container.clientWidth;
    
    // Only adjust width, keep height fixed
    stage.width(newWidth);
    stage.draw();
});

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-500 translate-y-20 opacity-0';
    
    // Set color based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
    } else if (type === 'info') {
        notification.classList.add('bg-blue-500', 'text-white');
    } else {
        notification.classList.add('bg-gray-800', 'text-white');
    }
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>';
    } else if (type === 'error') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';
    } else if (type === 'info') {
        icon = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            ${icon}
            <span>${message}</span>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.remove('translate-y-20', 'opacity-0');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Update file name display
document.getElementById('background-upload').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name || 'No file chosen';
    document.getElementById('file-name').textContent = fileName;
});

// Initialize history with empty state
history.saveState();
updateUndoRedoButtons();
updateFurnitureCount();

// Show welcome notification
setTimeout(() => {
    showNotification('Welcome to Furniture Placement Designer! Click on furniture items to add them to your canvas.', 'info');
}, 1000);