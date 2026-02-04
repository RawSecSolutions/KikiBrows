// Detectar dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 767;
}

// Función para el efecto de empuje (solo desktop)
function updateScrollEffects() {
    // Desactivar animaciones pesadas en móviles para evitar lag
    if (isMobileDevice()) {
        return;
    }

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

                // Usar transform con aceleración de hardware
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
// Optimizado para móviles con threshold más bajo
const observerOptions = {
    threshold: isMobileDevice() ? 0.1 : 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));

// Solo agregar evento de scroll en desktop
if (!isMobileDevice()) {
    // Usar requestAnimationFrame para mejor rendimiento
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScrollEffects();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// Función para scroll suave a secciones con hash (#)
document.addEventListener('DOMContentLoaded', () => {
    // Manejar clics en enlaces con hash
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a[href^="#"]');
        if (!target) return;

        const hash = target.getAttribute('href');
        if (!hash || hash === '#') return;

        const targetElement = document.querySelector(hash);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Actualizar URL sin recargar la página
            history.pushState(null, '', hash);
        }
    });

    // Manejar navegación con botones del navegador (back/forward)
    window.addEventListener('popstate', () => {
        if (window.location.hash) {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    // Scroll inicial si hay hash en la URL
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
});
