const thumbnailButtons = document.querySelectorAll('.thumbnail-btn');
const mainImage = document.getElementById('main-product-image');

// Add click event listeners to each thumbnail
thumbnailButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Update main image source
    const imageSrc = button.getAttribute('data-image');
    if (mainImage && imageSrc) {
      mainImage.src = imageSrc;
    }
    
    // Update active thumbnail styling
    thumbnailButtons.forEach(btn => {
      btn.classList.remove('border-primary');
      btn.classList.add('border-base-300');
    });
    button.classList.remove('border-base-300');
    button.classList.add('border-primary');
  });
});
function toggleDropdown() {
    var dropdown = document.getElementById("dropdown-menu");
    dropdown.classList.toggle("show");
  }