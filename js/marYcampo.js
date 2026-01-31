/**
 * Mar y Campo - Landing Page JavaScript
 * Carrusel, animaciones, lightbox, navegación móvil
 */

document.addEventListener('DOMContentLoaded', function() {

    // =============================================
    // NAVBAR - Scroll behavior & Mobile menu
    // =============================================
    const navbar = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.myc-nav-menu a');

    // Navbar scroll effect
    function handleNavbarScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll);
    handleNavbarScroll(); // Initial check

    // Mobile menu toggle
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        this.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Active link on scroll
    function setActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', setActiveNavLink);

    // =============================================
    // HERO CAROUSEL
    // =============================================
    const carousel = document.getElementById('heroCarousel');
    if (carousel) {
        const items = carousel.querySelectorAll('.myc-carousel-item');
        const indicators = carousel.querySelectorAll('.myc-carousel-indicators button');
        const prevBtn = carousel.querySelector('.myc-carousel-prev');
        const nextBtn = carousel.querySelector('.myc-carousel-next');
        let currentSlide = 0;
        let autoPlayInterval;
        const autoPlayDelay = 6000; // 6 seconds

        function goToSlide(index) {
            // Handle wraparound
            if (index < 0) index = items.length - 1;
            if (index >= items.length) index = 0;

            // Update slides
            items.forEach((item, i) => {
                item.classList.toggle('active', i === index);
            });

            // Update indicators
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });

            currentSlide = index;
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function prevSlide() {
            goToSlide(currentSlide - 1);
        }

        function startAutoPlay() {
            autoPlayInterval = setInterval(nextSlide, autoPlayDelay);
        }

        function stopAutoPlay() {
            clearInterval(autoPlayInterval);
        }

        // Event listeners
        nextBtn.addEventListener('click', function() {
            stopAutoPlay();
            nextSlide();
            startAutoPlay();
        });

        prevBtn.addEventListener('click', function() {
            stopAutoPlay();
            prevSlide();
            startAutoPlay();
        });

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function() {
                stopAutoPlay();
                goToSlide(index);
                startAutoPlay();
            });
        });

        // Pause on hover
        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);

        // Touch support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoPlay();
        }, { passive: true });

        carousel.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoPlay();
        }, { passive: true });

        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            // Only if hero section is in view
            const heroRect = carousel.getBoundingClientRect();
            const inView = heroRect.top < window.innerHeight && heroRect.bottom > 0;

            if (inView) {
                if (e.key === 'ArrowLeft') {
                    stopAutoPlay();
                    prevSlide();
                    startAutoPlay();
                } else if (e.key === 'ArrowRight') {
                    stopAutoPlay();
                    nextSlide();
                    startAutoPlay();
                }
            }
        });

        // Start autoplay
        startAutoPlay();
    }

    // =============================================
    // SCROLL ANIMATIONS
    // =============================================
    const animatedElements = document.querySelectorAll('.animate-fade-up');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const animationObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: unobserve after animation
                // animationObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => {
        animationObserver.observe(el);
    });

    // =============================================
    // GALLERY LIGHTBOX
    // =============================================
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxClose = document.querySelector('.myc-lightbox-close');
    const lightboxPrev = document.querySelector('.myc-lightbox-prev');
    const lightboxNext = document.querySelector('.myc-lightbox-next');
    const galleryItems = document.querySelectorAll('.myc-gallery-item');

    let currentImageIndex = 0;
    const galleryImages = [];

    // Collect gallery images
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('img');
        galleryImages.push(img.src);

        item.addEventListener('click', function() {
            openLightbox(index);
        });
    });

    function openLightbox(index) {
        currentImageIndex = index;
        lightboxImage.src = galleryImages[index];
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showPrevImage() {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        lightboxImage.src = galleryImages[currentImageIndex];
    }

    function showNextImage() {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        lightboxImage.src = galleryImages[currentImageIndex];
    }

    if (lightbox) {
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxPrev.addEventListener('click', showPrevImage);
        lightboxNext.addEventListener('click', showNextImage);

        // Close on overlay click
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!lightbox.classList.contains('active')) return;

            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            }
        });

        // Touch swipe in lightbox
        let lightboxTouchStartX = 0;

        lightbox.addEventListener('touchstart', function(e) {
            lightboxTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', function(e) {
            const touchEndX = e.changedTouches[0].screenX;
            const diff = lightboxTouchStartX - touchEndX;
            const swipeThreshold = 50;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    showNextImage();
                } else {
                    showPrevImage();
                }
            }
        }, { passive: true });
    }

    // =============================================
    // CONTACT FORM (Visual only - no backend)
    // =============================================
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Log to console (for demo purposes)
            console.log('Formulario enviado:', data);

            // Show success message
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Mensaje Enviado';
            submitBtn.disabled = true;
            submitBtn.style.background = '#5C7A6A';

            // Reset form
            setTimeout(function() {
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 3000);

            // Note: In production, you would send this data to a backend
            // or use a service like Formspree, EmailJS, etc.
        });
    }

    // =============================================
    // SMOOTH SCROLL for anchor links
    // =============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // =============================================
    // MASTERPLAN 360 INTEGRATION HELPER
    // =============================================
    // This function can be called when you're ready to embed the Masterplan360 viewer
    window.loadMasterplan360 = function(iframeUrl) {
        const masterplanWrapper = document.getElementById('masterplanViewer');
        if (masterplanWrapper && iframeUrl) {
            // Remove placeholder
            const placeholder = masterplanWrapper.querySelector('.myc-masterplan-placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            // Create and insert iframe
            const iframe = document.createElement('iframe');
            iframe.src = iframeUrl;
            iframe.width = '100%';
            iframe.height = '600';
            iframe.frameBorder = '0';
            iframe.allowFullscreen = true;
            iframe.style.display = 'block';

            masterplanWrapper.appendChild(iframe);
        }
    };

    // Example usage (uncomment when you have your Masterplan360 URL):
    // window.loadMasterplan360('https://your-masterplan360-url.com/viewer/your-project');

});
