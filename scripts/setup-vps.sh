#!/bin/bash
set -e

echo "=== Tygde VPS Setup Script ==="

# 1. Install required packages
echo "[1/6] Installing packages..."
apt-get update -qq
apt-get install -y -qq docker-compose-plugin nginx ufw curl > /dev/null 2>&1
echo "  OK: docker-compose-plugin, nginx, ufw installed"

# 2. Configure firewall
echo "[2/6] Configuring firewall..."
ufw --force reset > /dev/null 2>&1
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS (for future SSL)
ufw --force enable
echo "  OK: Firewall configured (SSH, HTTP, HTTPS)"

# 3. Create app directory
echo "[3/6] Creating app directory..."
mkdir -p /opt/tygde
echo "  OK: /opt/tygde created"

# 4. Create production docker-compose
echo "[4/6] Writing docker-compose.yml..."
cat > /opt/tygde/docker-compose.yml << 'COMPOSE_EOF'
services:
  backend:
    image: ghcr.io/boogiedk/tygde-backend:latest
    container_name: tygde-backend
    restart: unless-stopped
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ASPNETCORE_URLS=http://+:80
    volumes:
      - tygde-data:/app/Data
    networks:
      - tygde-network
    mem_limit: 256m

  frontend:
    image: ghcr.io/boogiedk/tygde-frontend:latest
    container_name: tygde-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:80"
    depends_on:
      - backend
    networks:
      - tygde-network
    mem_limit: 64m

volumes:
  tygde-data:
    driver: local

networks:
  tygde-network:
    driver: bridge
COMPOSE_EOF
echo "  OK: docker-compose.yml written"

# 5. Configure nginx as reverse proxy
echo "[5/6] Configuring nginx..."
cat > /etc/nginx/sites-available/tygde << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # Proxy all traffic to frontend container
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (for dev, optional)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Increase max body size for API requests
    client_max_body_size 10M;
}
NGINX_EOF

# Enable site, disable default
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/tygde /etc/nginx/sites-enabled/tygde
nginx -t
systemctl restart nginx
systemctl enable nginx
echo "  OK: Nginx configured as reverse proxy"

# 6. Increase swap (helps with 1GB RAM)
echo "[6/6] Checking swap..."
if [ "$(swapon --show | wc -l)" -lt 2 ]; then
    echo "  Adding 1GB swap..."
    fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "  OK: 1GB swap added"
else
    echo "  OK: Swap already configured"
fi

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "  1. Add GitHub Secrets (VPS_HOST, VPS_USER, VPS_SSH_KEY, GHCR_TOKEN, YANDEX_MAPS_KEY)"
echo "  2. Run 'Build & Deploy' workflow in GitHub Actions"
echo "  3. Site will be available at http://$(curl -s ifconfig.me)"
