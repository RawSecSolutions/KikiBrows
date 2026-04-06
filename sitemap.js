const fs = require('fs');

const BASE_URL = 'https://kikibrows.cl';

// Archivos que NO queremos que aparezcan en Google
const ignoreFiles = [
    'adminPanel.html', 
    'adminCalendar.html', 
    'adminProfilePassword.html', 
    'adminTransa.html',
    'usersGest.html',
    'gestorModulos.html',
    'revYFeedback.html',
    'test-certificate.html'
];

const files = fs.readdirSync('./')
    .filter(file => file.endsWith('.html') && !ignoreFiles.includes(file))
    .map(file => {
        // Si es index.html, la URL queda como la raíz
        const route = file === 'index.html' ? '' : file;
        return `  <url>\n    <loc>${BASE_URL}/${route}</loc>\n    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n  </url>`;
    });

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.join('\n')}
</urlset>`;

fs.writeFileSync('sitemap.xml', sitemap);
console.log('¡Sitemap.xml generado con éxito!');