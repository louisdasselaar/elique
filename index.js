// Dropdown menu
const toggleBtn = document.querySelector('.toggleBtn')
const toggleBtnIcon = document.querySelector('.toggleBtn i')
const dropDownMenu = document.querySelector('.dropDownMenu')

toggleBtn.onclick = function(){
    dropDownMenu.classList.toggle('open')
    const isOpen = dropDownMenu.classList.contains('open')

    toggleBtnIcon.classList = isOpen
        ? 'fa-solid fa-xmark'
        : 'fa-solid fa-bars'
}

//Navbar scroll
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll('.navbar a').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href').substring(1);
        
        const targetElement = document.getElementById(targetId);
        
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
});

//Testimonial Carousel
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('#slider input[type="radio"]');
    let currentSlide = 0;

    setInterval(function() {
        slides[currentSlide].checked = false;
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].checked = true;
    }, 8000); 
});

// Contact Us
function openEmailPopup() {
    if (navigator.share) {
      navigator.share({
        url: 'mailto:info@elique-events.com'
      })
      .then(() => console.log('E-mail gedeeld'))
      .catch((error) => console.error('Fout bij delen van e-mail', error));
    } else {
      window.location.href = "mailto:l.dasselaar02@gmail.com";
    }
  }