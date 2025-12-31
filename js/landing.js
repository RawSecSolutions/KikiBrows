// Función para el efecto de empuje
function updateScrollEffects() {
    const viewportHeight = window.innerHeight;
    const stickySections = document.querySelectorAll('.sticky-section');
    
    stickySections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top;
        const nextSection = stickySections[index + 1];
        
        // Efecto cuando la siguiente sección empuja a la actual
        if (nextSection) {
            const nextTop = nextSection.getBoundingClientRect().top;
            if (nextTop <= viewportHeight) {
                const progress = 1 - (nextTop / viewportHeight);
                const moveDown = progress * 400;
                const scale = 1 - (progress * 0.1);
                const opacity = 1 - (progress * 0.5);
                
                section.style.transform = `translate3d(0, ${moveDown}px, 0) scale(${scale})`;
                section.style.opacity = opacity;
            } else {
                section.style.transform = 'none';
                section.style.opacity = 1;
            }
        }
    });
}

// Intersection Observer para disparar las animaciones de entrada (Fade In)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));

window.addEventListener('scroll', updateScrollEffects);
