# START: nginx.conf
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Serve static files, fallback to index.html
  location / {
    try_files $I$uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
  }
}
# END: nginx.conf
