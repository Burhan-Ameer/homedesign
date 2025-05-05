document.addEventListener('DOMContentLoaded', function() {
    console.log("Saved designs script loaded");
    
    // Reference DOM elements
    const savedDesignsContainer = document.getElementById('saved-designs-container');
    const noDesignsMessage = document.getElementById('no-designs-message');
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    
    // Function to format date
    function formatDate(timestamp) {
        if (!timestamp) return 'Unknown date';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    }
    
    // Function to load saved designs
    function loadSavedDesigns() {
        console.log("Loading saved designs from localStorage");
        
        // Get all keys from localStorage
        const keys = Object.keys(localStorage);
        const savedDesigns = [];
        
        // Look for room design data
        keys.forEach(key => {
            // Check for both formats: STORAGE_KEY and canvas_design_*
            if (key === 'roomDesignData' || key.startsWith('canvas_design_')) {
                try {
                    const designData = JSON.parse(localStorage.getItem(key));
                    console.log("Found design data:", key);
                    
                    // Create consistent design object regardless of storage format
                    const design =  {
                        id: key.startsWith('canvas_design_') ? key.replace('canvas_design_', '') : 'default',
                        key: key,
                        data: designData,
                        timestamp: designData.timestamp || new Date().toISOString(),
                        thumbnailUrl: designData.thumbnailUrl || null,
                        itemCount: designData.itemCount || 0
                    };
                    
                    savedDesigns.push(design);
                } catch (e) {
                    console.error('Error parsing saved design:', e);
                }
            }
        });
        
        // Hide loading indicator
        if (loadingPlaceholder) {
            loadingPlaceholder.style.display = 'none';
        }
        
        // Display designs or show message
        if (savedDesigns.length === 0) {
            console.log("No saved designs found");
            if (noDesignsMessage) noDesignsMessage.classList.remove('hidden');
            if (savedDesignsContainer) savedDesignsContainer.classList.add('hidden');
        } else {
            console.log(`Found ${savedDesigns.length} saved designs`);
            if (noDesignsMessage) noDesignsMessage.classList.add('hidden');
            if (savedDesignsContainer) {
                savedDesignsContainer.classList.remove('hidden');
                
                // Clear container
                savedDesignsContainer.innerHTML = '';
                
                // Create cards for each design
                savedDesigns.forEach((design, index) => {
                    // Generate thumbnail HTML
                    let thumbnailSrc = '';
                    if (design.thumbnailUrl) {
                        thumbnailSrc = design.thumbnailUrl;
                    } else if (design.data && design.data.stageData) {
                        // Try to create a thumbnail from stage data (more complex)
                        // This is simplified - real implementation would need more work
                        thumbnailSrc = '';
                    }
                    
                    const designId = design.id || index;
                    
                    // Log the design key before creating the card
                    console.log("Creating card for design with key:", design.key);
                    
                    // Generate edit link URL
                    let editUrl = `/canvas/?designId=${encodeURIComponent(design.key)}`;
                    console.log("Edit link URL:", editUrl);
                    
                    // Create the design card
                    const card = document.createElement('div');
                    card.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow';
                    
                    // Generate thumbnail from thumbnailUrl or use placeholder
                    let thumbnailHtml = '';
                    if (thumbnailSrc) {
                        thumbnailHtml = `
                            <div class="h-48 bg-gray-100 overflow-hidden">
                                <img src="${thumbnailSrc}" alt="Design Preview" class="w-full h-full object-contain">
                            </div>
                        `;
                    } else {
                        thumbnailHtml = `
                            <div class="bg-gray-100 h-48 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        `;
                    }
                    
                    // Calculate item count
                    let itemCount = design.itemCount || 0;
                    
                    // Create the card
                    card.innerHTML = `
                        ${thumbnailHtml}
                        <div class="p-4">
                            <h3 class="font-medium text-lg text-gray-900 mb-2">Design ${designId}</h3>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-500">${formatDate(design.timestamp)}</span>
                                <span class="text-sm bg-gray-100 px-2 py-0.5 rounded">${itemCount} items</span>
                            </div>
                            <div class="mt-4 flex justify-between items-center">
                                <button data-key="${design.key}" class="delete-design px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                                <a href="${editUrl}" class="px-3 py-1 bg-gray-900 text-white rounded-md text-sm flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Edit
                                </a>
                            </div>
                        </div>
                    `;
                    
                    // Add event listener to delete button
                    const deleteBtn = card.querySelector('.delete-design');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            const key = this.getAttribute('data-key');
                            if (confirm('Are you sure you want to delete this design?')) {
                                localStorage.removeItem(key);
                                loadSavedDesigns(); // Reload the list
                            }
                        });
                    }
                    
                    savedDesignsContainer.appendChild(card);
                });
            }
        }
    }
    
    // Load saved designs when page loads
    loadSavedDesigns();
});