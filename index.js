// Dropdown menu toggle
const toggleBtn = document.querySelector('.toggleBtn');
const dropDownMenu = document.querySelector('.dropDownMenu');
const dropDownLinks = document.querySelectorAll('.dropDownMenu a');

toggleBtn.onclick = function(event){
    dropDownMenu.classList.toggle('open');
    updateToggleIcon();
    event.stopPropagation(); // Stop propagation zodat document click niet meteen het menu sluit
};

function updateToggleIcon() {
    const isOpen = dropDownMenu.classList.contains('open');
    toggleBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
}

// Sluit het dropdown menu wanneer een link wordt geklikt
dropDownLinks.forEach(link => {
    link.addEventListener('click', () => {
        dropDownMenu.classList.remove('open');
        updateToggleIcon();
    });
});

// Sluit het dropdown menu als er ergens buiten het menu wordt geklikt
document.addEventListener('click', function(event) {
    if (!dropDownMenu.contains(event.target) && !toggleBtn.contains(event.target) && dropDownMenu.classList.contains('open')) {
        dropDownMenu.classList.remove('open');
        updateToggleIcon();
    }
});

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
    const controls = document.querySelectorAll('#controls label');
    let slideInterval;
    let touchStartX = 0;
    let touchEndX = 0;

    function showSlide(index) {
        slides.forEach((slide, idx) => {
            slide.checked = (idx === index);
        });
        updateControls(index);
    }

    function updateControls(index) {
        controls.forEach((control, idx) => {
            control.classList.toggle('active', idx === index);
        });
    }

    function startSlideShow() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 6000);
    }

    function nextSlide() {
        let currentSlideIndex = Array.from(slides).findIndex(slide => slide.checked);
        let nextSlideIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(nextSlideIndex);
    }

    function previousSlide() {
        let currentSlideIndex = Array.from(slides).findIndex(slide => slide.checked);
        let prevSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        showSlide(prevSlideIndex);
    }

    // Touch events voor swiping
    const slider = document.getElementById('slider');

    slider.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    slider.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleTouchSwipe();
    }, false);

    function handleTouchSwipe() {
        if (touchStartX - touchEndX > 50) {
            nextSlide();
        } else if (touchEndX - touchStartX > 50) {
            previousSlide();
        }
    }

    // Start de diavoorstelling
    startSlideShow();

    // Pauzeer de diavoorstelling wanneer de gebruiker eroverheen hovert
    document.getElementById('slider').addEventListener('mouseenter', function() {
        clearInterval(slideInterval);
    });

    // Hervat de diavoorstelling wanneer de gebruiker de muis verlaat
    document.getElementById('slider').addEventListener('mouseleave', function() {
        startSlideShow();
    });

    // Event listeners toevoegen aan de controle labels
    controls.forEach((control, idx) => {
        control.addEventListener('click', function() {
            showSlide(idx);
            startSlideShow();
        });
    });
});


// Contact Us
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('contact').addEventListener('click', openEmailPopup);
});

function openEmailPopup() {
    if (navigator.share) {
        navigator.share({
            url: 'mailto:info@elique-events.com'
        })
        .then(() => console.log('E-mail gedeeld'))
        .catch((error) => console.error('Fout bij delen van e-mail', error));
    } else {
        window.location.href = "mailto:info@elique-events.com";
    }
}


//Email form 
document.addEventListener("DOMContentLoaded", function() {
  // Dit matcht schermformaten tot 480 pixels breed
  var smallScreenMediaQuery = window.matchMedia("(max-width: 480px)");

  smallScreenMediaQuery.addListener(handleMediaQueryChange); // Luister naar wijzigingen in de viewport
  handleMediaQueryChange(smallScreenMediaQuery); // Voer initieel uit

  function handleMediaQueryChange(mediaQuery) {
      if (mediaQuery.matches) {
          // Voeg focus event listeners toe
          document.querySelectorAll('input, textarea').forEach(element => {
              element.addEventListener('focus', scrollIntoView);
          });
      } else {
          // Verwijder focus event listeners
          document.querySelectorAll('input, textarea').forEach(element => {
              element.removeEventListener('focus', scrollIntoView);
          });
      }
  }

  function scrollIntoView(event) {
      setTimeout(() => {
          event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // Vertraging om tijd te geven aan het toetsenbord om te verschijnen
  }
});
