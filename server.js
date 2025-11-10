const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const PORT = 3001;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Handle specific routes without .html extension
    const htmlRoutes = [
        '/login',
        '/register',
        '/dashboard',
        '/marketplace',
        '/profile',
        '/messages',
        '/forgot-password',
        '/about',
        '/contact',
        '/help',
        '/admin',
        '/features',
        '/resources',
        '/reset-password',
        '/add-skill',
        '/skill-details'
    ];

    // Special handling for reset-password
    if (pathname === '/reset-password') {
        const query = parsedUrl.query;
        const queryString = Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : '';
        res.writeHead(302, { 'Location': `/reset-password.html${queryString}` });
        res.end();
        return;
    }

    // Handle other routes without .html extension
    for (const route of htmlRoutes) {
        if (pathname === route) {
            const query = parsedUrl.query;
            const queryString = Object.keys(query).length > 0 ? '?' + new URLSearchParams(query).toString() : '';
            res.writeHead(302, { 'Location': `${route}.html${queryString}` });
            res.end();
            return;
        }
    }

    // Default file serving
    // If pathname is '/', serve index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Handle assets directory - they are in root, not in frontend
    const isAssetRequest = pathname.startsWith('/assets/') || 
                           pathname.startsWith('/src/');
    
    // Build file path
    let filePath;
    if (isAssetRequest) {
        // Assets are in the root directory
        filePath = path.join(__dirname, pathname);
    } else {
        // HTML and other files are in the frontend directory
        // If the path doesn't start with /frontend/, add it
        if (!pathname.startsWith('/frontend/') && pathname !== '/') {
            pathname = '/frontend' + pathname;
        }
        filePath = path.join(__dirname, pathname);
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found, try adding .html extension
            if (!path.extname(filePath)) {
                filePath += '.html';
                fs.access(filePath, fs.constants.F_OK, (err2) => {
                    if (err2) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end(`404 Not Found - File: ${filePath}`);
                        return;
                    }
                    serveFile(filePath, res);
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(`404 Not Found - File: ${filePath}`);
            }
            return;
        }
        serveFile(filePath, res);
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.close(() => {
        console.log('👋 Server shutdown complete');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.close(() => {
        console.log('👋 Server shutdown complete');
        process.exit(0);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/`);
    console.log('📁 Routes without .html extension are automatically redirected');
    console.log('💡 Press Ctrl+C to stop the server');
});