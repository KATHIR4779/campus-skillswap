#!/usr/bin/env python3
import http.server
import socketserver
import urllib.parse
import os
from pathlib import Path

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        
        # Handle specific routes without .html extension
        if path == '/frontend/reset-password':
            # Redirect to the .html version with query parameters
            query = parsed_path.query
            if query:
                self.send_response(302)
                self.send_header('Location', f'/frontend/reset-password.html?{query}')
            else:
                self.send_response(302)
                self.send_header('Location', '/frontend/reset-password.html')
            self.end_headers()
            return
        
        # Handle other routes without .html extension
        html_routes = [
            '/frontend/login',
            '/frontend/register', 
            '/frontend/dashboard',
            '/frontend/marketplace',
            '/frontend/profile',
            '/frontend/messages',
            '/frontend/forgot-password',
            '/frontend/about',
            '/frontend/contact',
            '/frontend/help',
            '/frontend/admin',
            '/frontend/features',
            '/frontend/resources'
        ]
        
        for route in html_routes:
            if path == route:
                query = parsed_path.query
                if query:
                    self.send_response(302)
                    self.send_header('Location', f'{route}.html?{query}')
                else:
                    self.send_response(302)
                    self.send_header('Location', f'{route}.html')
                self.end_headers()
                return
        
        # Default behavior for all other requests
        super().do_GET()

if __name__ == "__main__":
    import signal
    import sys
    
    PORT = 3000
    Handler = CustomHTTPRequestHandler
    
    def signal_handler(sig, frame):
        print('\n🛑 Shutting down server gracefully...')
        httpd.shutdown()
        sys.exit(0)
    
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
    signal.signal(signal.SIGTERM, signal_handler)  # Termination signal
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Server running at http://localhost:{PORT}/")
        print("📁 Routes without .html extension are automatically redirected")
        print("💡 Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n🛑 Server stopped by user')
        except Exception as e:
            print(f'❌ Server error: {e}')
        finally:
            print('👋 Server shutdown complete')

