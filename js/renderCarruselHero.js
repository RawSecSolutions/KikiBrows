// js/renderCarruselHero.js - Renderiza el carrusel hero con cursos de Supabase
// Carga los cursos que tienen en_carrusel = true, ordenados por posicion_carrusel

import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarruselHero();
});

async function renderizarCarruselHero() {
    const carouselInner = document.querySelector('#homeCarousel .carousel-inner');
    const carouselIndicators = document.querySelector('#homeCarousel .carousel-indicators');
    
    if (!carouselInner) {
        console.warn('Carrusel #homeCarousel no encontrado');
        return;
    }

    try {
        // Obtener cursos marcados para el carrusel
        const { data: cursosCarrusel, error } = await supabase
            .from('cursos')
            .select('id, nombre, descripcion, portada_url, precio, estado, en_carrusel, posicion_carrusel')
            .eq('estado', 'PUBLICADO')
            .eq('en_carrusel', true)
            .order('posicion_carrusel', { ascending: true });

        if (error) throw error;

        if (!cursosCarrusel || cursosCarrusel.length === 0) {
            console.log('No hay cursos configurados para el carrusel');
            mostrarSlideDefault(carouselInner, carouselIndicators);
            return;
        }

        console.log(`${cursosCarrusel.length} cursos renderizados en carrusel hero`);

        // Limpiar contenido actual
        carouselInner.innerHTML = '';
        if (carouselIndicators) {
            carouselIndicators.innerHTML = '';
        }

        // Crear slides para cada curso
        cursosCarrusel.forEach((curso, index) => {
            const slide = crearSlideHero(curso, index === 0);
            carouselInner.appendChild(slide);

            // Crear indicador
            if (carouselIndicators && cursosCarrusel.length > 1) {
                const indicator = document.createElement('button');
                indicator.type = 'button';
                indicator.setAttribute('data-bs-target', '#homeCarousel');
                indicator.setAttribute('data-bs-slide-to', index.toString());
                if (index === 0) indicator.classList.add('active');
                carouselIndicators.appendChild(indicator);
            }
        });

        // Ocultar controles si solo hay un slide
        const prevBtn = document.querySelector('#homeCarousel .carousel-control-prev');
        const nextBtn = document.querySelector('#homeCarousel .carousel-control-next');
        
        if (cursosCarrusel.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
            if (carouselIndicators) carouselIndicators.style.display = 'none';
        } else {
            if (prevBtn) prevBtn.style.display = '';
            if (nextBtn) nextBtn.style.display = '';
            if (carouselIndicators) carouselIndicators.style.display = '';
        }

        // Activar animación del primer slide después de un pequeño delay
        setTimeout(() => {
            const activeCaption = document.querySelector('#homeCarousel .carousel-item.active .animate-up');
            if (activeCaption) {
                activeCaption.classList.add('visible');
            }
        }, 100);

        // Escuchar cambios de slide para animar
        const carousel = document.getElementById('homeCarousel');
        if (carousel) {
            // Remover listener previo si existe (para evitar duplicados en refresh)
            carousel.removeEventListener('slid.bs.carousel', handleSlideChange);
            carousel.addEventListener('slid.bs.carousel', handleSlideChange);
        }

    } catch (error) {
        console.error('Error al cargar carrusel hero:', error);
        mostrarSlideDefault(carouselInner, carouselIndicators);
    }
}

// Handler separado para el evento de cambio de slide
function handleSlideChange(e) {
    // Quitar visible de todos
    document.querySelectorAll('#homeCarousel .animate-up').forEach(el => {
        el.classList.remove('visible');
    });
    // Agregar visible al activo
    const activeCaption = e.relatedTarget.querySelector('.animate-up');
    if (activeCaption) {
        setTimeout(() => activeCaption.classList.add('visible'), 50);
    }
}

function crearSlideHero(curso, isActive) {
    const slide = document.createElement('div');
    slide.className = `carousel-item${isActive ? ' active' : ''}`;
    
    // Aplicar estilos de fondo usando propiedades individuales
    // Esto permite que el CSS (height: 100vh) se aplique correctamente
    if (curso.portada_url) {
        slide.style.backgroundImage = `url('${curso.portada_url}')`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
    } else {
        slide.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    // Formatear precio
    const precioFormateado = curso.precio 
        ? `$ ${curso.precio.toLocaleString('es-CL')}`
        : 'Consultar precio';

    // Descripcion corta
    const descripcionCorta = curso.descripcion && curso.descripcion.length > 80
        ? curso.descripcion.substring(0, 80) + '...'
        : (curso.descripcion || 'Clases 100% online y demostraciones prácticas.');

    slide.innerHTML = `
        <div class="bg-overlay-dark">
            <div class="carousel-caption-custom text-center shadow animate-up">
                <h1 class="display-4 fw-bold">${curso.nombre.toUpperCase()}</h1>
                <p class="lead">${descripcionCorta}</p>
                <span class="fs-3 fw-bold d-block my-3" style="color: var(--accent-color);">Valor: ${precioFormateado}</span>
                <a href="course-preview.html?id=${curso.id}" class="register-button">VER CURSO</a>
            </div>
        </div>
    `;

    return slide;
}

function mostrarSlideDefault(carouselInner, carouselIndicators) {
    carouselInner.innerHTML = `
        <div class="carousel-item active" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="bg-overlay-dark">
                <div class="carousel-caption-custom text-center shadow animate-up visible">
                    <h1 class="display-4 fw-bold">KIKI BROWS</h1>
                    <p class="lead">Cursos profesionales de belleza y estética</p>
                    <span class="fs-3 fw-bold d-block my-3" style="color: var(--accent-color);">Próximamente nuevos cursos</span>
                    <a href="#cursos" class="register-button">VER CURSOS</a>
                </div>
            </div>
        </div>
    `;

    if (carouselIndicators) {
        carouselIndicators.innerHTML = '';
    }

    const prevBtn = document.querySelector('#homeCarousel .carousel-control-prev');
    const nextBtn = document.querySelector('#homeCarousel .carousel-control-next');
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
}

function refrescarCarruselHero() {
    renderizarCarruselHero();
}

window.renderizarCarruselHero = renderizarCarruselHero;
window.refrescarCarruselHero = refrescarCarruselHero;