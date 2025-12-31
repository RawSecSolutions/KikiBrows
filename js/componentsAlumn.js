// Simulación de Base de Datos Interactiva
const COURSES_DATA = [
    {
        id: "microblading-expert",
        title: "Microblading Expert",
        progress: 70,
        currentModule: "Módulo 3: Pigmentología",
        lessons: [
            { id: "L1", title: "1. Bienvenida", status: "completed", video: "dQw4w9WgXcQ" },
            { id: "L2", title: "2. Materiales", status: "completed", video: "E66v054O0pI" },
            { id: "L3", title: "3. Morfología Facial", status: "active", video: "Mv3v2N7W28Y" },
            { id: "L4", title: "4. Quiz Final", status: "locked", video: "" }
        ]
    },
    {
        id: "diseno-mirada",
        title: "Diseño de Mirada Pro",
        progress: 25,
        currentModule: "Unidad 1: Visajismo",
        lessons: [
            { id: "D1", title: "Introducción", status: "active", video: "dQw4w9WgXcQ" },
            { id: "D2", title: "Tipos de Rostro", status: "locked", video: "" }
        ]
    }
];

const UI = {
    initNavbar: () => {
        const header = document.getElementById('header-component');
        if (!header) return;
        header.className = "fixed-top w-100 bg-white shadow-sm";
        header.innerHTML = `
            <div class="top-navbar container-fluid d-flex justify-content-between align-items-center py-2">
                <div class="kikibrows-logo position-absolute start-50 translate-middle-x" style="cursor:pointer" onclick="window.location.href='cursosAlumn.html'">KIKIBROWS</div>
                <div class="top-icons ms-auto">
                    <div class="dropdown">
                        <a class="nav-link" href="#" role="button" data-bs-toggle="dropdown"><i class="fa-solid fa-user"></i></a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><h6 class="dropdown-header">Hola, Alumna</h6></li>
                            <li><a class="dropdown-item" href="cursosAlumn.html">Mis Cursos</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#">Cerrar Sesión</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <nav class="navbar navbar-expand-lg main-navbar py-1">
                <div class="container justify-content-center">
                    <ul class="navbar-nav gap-3">
                        <li class="nav-item"><a class="nav-link" href="cursosAlumn.html">BIBLIOTECA</a></li>
                        <li class="nav-item"><a class="nav-link active" href="#">AULA VIRTUAL</a></li>
                    </ul>
                </div>
            </nav>`;
    },

    // Renderiza la lista de cursos en cursosAlumn.html
    renderLibrary: () => {
        const container = document.querySelector('#content-area .row');
        if (!container) return;
        
        container.innerHTML = COURSES_DATA.map(course => `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="card course-card border-0 shadow-sm h-100">
                    <img src="https://via.placeholder.com/400x200" class="card-img-top" alt="Curso">
                    <div class="card-body p-4">
                        <h5 class="fw-bold">${course.title}</h5>
                        <p class="text-muted small">${course.currentModule}</p>
                        <div class="progress-custom mb-3"><div class="progress-fill" style="width: ${course.progress}%;"></div></div>
                        <button onclick="UI.selectCourse('${course.id}')" class="btn btn-dark w-100 rounded-pill" style="background:var(--primary-color); border:none;">Entrar al Curso</button>
                    </div>
                </div>
            </div>`).join('');
    },

    selectCourse: (courseId) => {
        localStorage.setItem('activeCourse', courseId);
        window.location.href = 'claseAlumn.html';
    },

    initSidebar: () => {
        const activeCourseId = localStorage.getItem('activeCourse') || 'microblading-expert';
        const course = COURSES_DATA.find(c => c.id === activeCourseId);
        
        const sidebar = document.getElementById('sidebar-component');
        if (!sidebar) return;

        sidebar.innerHTML = `
        <aside id="sidebar" class="ms-3 p-2 shadow-sm" style="width: var(--sidebar-width); height: calc(100vh - 160px); overflow-y: auto;">
            <div class="p-4">
                <h5 class="fw-bold mb-3">${course.title}</h5>
                <div class="progress-custom mb-2"><div class="progress-fill" style="width: ${course.progress}%;"></div></div>
                <small class="text-muted">${course.progress}% completado</small>
            </div>
            <div class="list-group list-group-flush bg-transparent">
                ${course.lessons.map(lesson => `
                    <div class="lesson-list-item ${lesson.status === 'active' ? 'active' : ''} ${lesson.status === 'locked' ? 'text-muted' : ''}" 
                         onclick="UI.changeLesson('${course.id}', '${lesson.id}')">
                        <i class="fas ${lesson.status === 'completed' ? 'fa-check-circle text-success' : (lesson.status === 'locked' ? 'fa-lock' : 'fa-play-circle')} me-3"></i>
                        ${lesson.title}
                    </div>`).join('')}
            </div>
        </aside>`;
    },

    changeLesson: (courseId, lessonId) => {
        const course = COURSES_DATA.find(c => c.id === courseId);
        const lesson = course.lessons.find(l => l.id === lessonId);
        
        if (lesson.status === 'locked') return;

        // Actualizar Video e Interfaz
        const iframe = document.querySelector('.video-container iframe');
        const title = document.querySelector('#content-area h3');
        
        if (iframe) iframe.src = `https://www.youtube.com/embed/${lesson.video}?autoplay=1`;
        if (title) title.innerText = lesson.title;

        // Actualizar clase activa en UI
        document.querySelectorAll('.lesson-list-item').forEach(el => el.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }
};
