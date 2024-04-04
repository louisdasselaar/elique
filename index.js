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

//Quote Carousel
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('#slider input[type="radio"]');
    let currentSlide = 0;

    setInterval(function() {
        // Verwijder de 'checked' status van de huidige slide
        slides[currentSlide].checked = false;
        
        // Ga naar de volgende slide, of ga terug naar de eerste slide als we aan het einde zijn
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Stel de 'checked' status in op de nieuwe huidige slide
        slides[currentSlide].checked = true;
    }, 10000); // Verander elke 3000 milliseconden (3 seconden) van slide
});