# Documentation Déploiement - GestCom

## Vue d'ensemble

Ce guide couvre le déploiement complet de GestCom en environnement de production, incluant la configuration Docker, les variables d'environnement, et les bonnes pratiques de sécurité.

## Architecture de déploiement

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Reverse Proxy │    │   SSL/TLS       │
│   (Nginx)       │◄──►│   (Nginx)       │◄──►│   (Let's Encrypt│
│   Port: 80/443  │    │   Port: 80/443  │    │   Certbot)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   Port: 6379    │
                       └─────────────────┘
```

## Configuration Docker

### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: gestcom_postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - gestcom_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: gestcom_redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - gestcom_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: gestcom_backend
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
    volumes:
      - uploads_data:/app/uploads
      - ./logs:/app/logs
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - gestcom_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: gestcom_frontend
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - gestcom_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: gestcom_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - gestcom_network

volumes:
  postgres_data:
  redis_data:
  uploads_data:

networks:
  gestcom_network:
    driver: bridge
```

### Dockerfile Production - Backend

```dockerfile
# backend/Dockerfile.prod
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-bullseye-slim AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Create uploads directory
RUN mkdir -p uploads/images

# Create non-root user
RUN groupadd -r gestcom && useradd -r -g gestcom gestcom
RUN chown -R gestcom:gestcom /app
USER gestcom

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]
```

### Dockerfile Production - Frontend

```dockerfile
# frontend/Dockerfile.prod
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["pnpm", "start"]
```

## Configuration Nginx

### Configuration principale

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';" always;

    # Upstream servers
    upstream backend {
        server gestcom_backend:3001;
        keepalive 32;
    }

    upstream frontend {
        server gestcom_frontend:3000;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name gestcom.example.com;
        return 301 https://$server_name$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name gestcom.example.com;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Frontend (Next.js)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }

        # API Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 86400;
        }

        # Login endpoint with stricter rate limiting
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://frontend;
        }

        # Health checks
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## Variables d'environnement

### Fichier .env.production

```bash
# Database
POSTGRES_DB=gestcom_prod
POSTGRES_USER=gestcom_user
POSTGRES_PASSWORD=your_secure_db_password
DATABASE_URL=postgresql://gestcom_user:your_secure_db_password@postgres:5432/gestcom_prod

# Redis
REDIS_PASSWORD=your_secure_redis_password
REDIS_URL=redis://:your_secure_redis_password@redis:6379

# JWT Secrets (générer avec: openssl rand -base64 64)
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Encryption (générer avec: openssl rand -hex 32)
ENCRYPTION_KEY=your_32_byte_encryption_key_here

# Frontend
NEXT_PUBLIC_API_URL=https://gestcom.example.com/api

# Email (optionnel)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@gestcom.example.com
SMTP_PASSWORD=your_smtp_password

# Monitoring (optionnel)
SENTRY_DSN=your_sentry_dsn_here
```

### Génération des secrets

```bash
#!/bin/bash
# generate-secrets.sh

echo "Génération des secrets pour GestCom..."

echo "JWT_SECRET=$(openssl rand -base64 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)"
echo "REDIS_PASSWORD=$(openssl rand -base64 32)"
```

## SSL/TLS avec Let's Encrypt

### Installation Certbot

```bash
# Installation sur Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Génération du certificat
sudo certbot --nginx -d gestcom.example.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Configuration SSL manuelle

```bash
# Génération d'un certificat auto-signé (développement uniquement)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=FR/ST=France/L=Paris/O=GestCom/CN=localhost"
```

## Scripts de déploiement

### Script de déploiement principal

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Déploiement de GestCom en production..."

# Variables
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
COMPOSE_FILE="docker-compose.prod.yml"

# Vérifications préalables
echo "📋 Vérifications préalables..."
if [ ! -f ".env.production" ]; then
    echo "❌ Fichier .env.production manquant"
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Fichier $COMPOSE_FILE manquant"
    exit 1
fi

# Sauvegarde de la base de données
echo "💾 Sauvegarde de la base de données..."
mkdir -p "$BACKUP_DIR"
docker exec gestcom_postgres pg_dump -U gestcom_user gestcom_prod > "$BACKUP_DIR/database.sql"

# Arrêt des services
echo "⏹️ Arrêt des services..."
docker-compose -f "$COMPOSE_FILE" down

# Construction des images
echo "🔨 Construction des nouvelles images..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

# Démarrage des services
echo "▶️ Démarrage des services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Attente de la disponibilité
echo "⏳ Attente de la disponibilité des services..."
sleep 30

# Vérification de la santé des services
echo "🏥 Vérification de la santé des services..."
for service in postgres redis backend frontend; do
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "${service}.*healthy"; then
        echo "✅ $service est en bonne santé"
    else
        echo "❌ $service n'est pas en bonne santé"
        docker-compose -f "$COMPOSE_FILE" logs "$service"
        exit 1
    fi
done

# Migration de la base de données
echo "🗄️ Migration de la base de données..."
docker exec gestcom_backend npx prisma migrate deploy

echo "🎉 Déploiement terminé avec succès!"
echo "📊 URL: https://gestcom.example.com"
```

### Script de rollback

```bash
#!/bin/bash
# rollback.sh

set -e

BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: ./rollback.sh <backup_date>"
    echo "Sauvegardes disponibles:"
    ls -la /backups/
    exit 1
fi

BACKUP_DIR="/backups/$BACKUP_DATE"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🔄 Rollback vers la sauvegarde $BACKUP_DATE..."

# Vérification de l'existence de la sauvegarde
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Sauvegarde $BACKUP_DATE non trouvée"
    exit 1
fi

# Arrêt des services
echo "⏹️ Arrêt des services..."
docker-compose -f "$COMPOSE_FILE" down

# Restauration de la base de données
echo "🗄️ Restauration de la base de données..."
docker-compose -f "$COMPOSE_FILE" up -d postgres
sleep 10
docker exec gestcom_postgres psql -U gestcom_user -d gestcom_prod < "$BACKUP_DIR/database.sql"

# Redémarrage des services
echo "▶️ Redémarrage des services..."
docker-compose -f "$COMPOSE_FILE" up -d

echo "✅ Rollback terminé"
```

## Monitoring et logging

### Configuration des logs

```yaml
# docker-compose.prod.yml - Section logging
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        
  frontend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Script de monitoring

```bash
#!/bin/bash
# monitor.sh

echo "📊 État des services GestCom"
echo "================================"

# Vérification des containers
echo "🐳 Containers Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "💾 Utilisation disque:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "🧠 Utilisation mémoire:"
free -h

echo ""
echo "📈 Charge système:"
uptime

echo ""
echo "🌐 Test de connectivité:"
curl -s -o /dev/null -w "Frontend: %{http_code} (%{time_total}s)\n" http://localhost:3000/health
curl -s -o /dev/null -w "Backend: %{http_code} (%{time_total}s)\n" http://localhost:3001/health

echo ""
echo "📋 Logs récents (erreurs):"
docker-compose logs --tail=10 | grep -i error || echo "Aucune erreur récente"
```

### Alertes avec script

```bash
#!/bin/bash
# alerts.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

check_service() {
    local service=$1
    local url=$2
    
    if ! curl -s -f "$url" > /dev/null; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Service $service est indisponible!\"}" \
            "$WEBHOOK_URL"
    fi
}

# Vérification des services
check_service "Frontend" "http://localhost:3000/health"
check_service "Backend" "http://localhost:3001/health"

# Vérification de l'espace disque
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ Espace disque critique: ${DISK_USAGE}%\"}" \
        "$WEBHOOK_URL"
fi
```

## Sauvegardes automatisées

### Script de sauvegarde

```bash
#!/bin/bash
# backup-cron.sh

BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=30

echo "💾 Démarrage de la sauvegarde..."

# Création du répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarde de la base de données
echo "🗄️ Sauvegarde de la base de données..."
docker exec gestcom_postgres pg_dump -U gestcom_user gestcom_prod | gzip > "$BACKUP_DIR/database.sql.gz"

# Sauvegarde des uploads
echo "📁 Sauvegarde des fichiers uploadés..."
docker run --rm -v gestcom_uploads_data:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/uploads.tar.gz -C /data .

# Sauvegarde de la configuration
echo "⚙️ Sauvegarde de la configuration..."
cp .env.production "$BACKUP_DIR/"
cp docker-compose.prod.yml "$BACKUP_DIR/"
cp -r nginx/ "$BACKUP_DIR/"

# Nettoyage des anciennes sauvegardes
echo "🧹 Nettoyage des anciennes sauvegardes..."
find /backups -type d -mtime +$RETENTION_DAYS -exec rm -rf {} +

echo "✅ Sauvegarde terminée: $BACKUP_DIR"
```

### Configuration cron

```bash
# Édition du crontab
sudo crontab -e

# Sauvegarde quotidienne à 2h du matin
0 2 * * * /path/to/backup-cron.sh >> /var/log/gestcom-backup.log 2>&1

# Monitoring toutes les 5 minutes
*/5 * * * * /path/to/alerts.sh

# Nettoyage des logs Docker hebdomadaire
0 3 * * 0 docker system prune -f --volumes
```

## Sécurité en production

### Firewall (UFW)

```bash
# Configuration du firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH
sudo ufw allow ssh

# Autoriser HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable
```

### Fail2Ban

```bash
# Installation
sudo apt install fail2ban

# Configuration
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl restart fail2ban
```

### Mise à jour automatique

```bash
# Configuration des mises à jour automatiques
sudo apt install unattended-upgrades

sudo tee /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
```

## Checklist de déploiement

### Pré-déploiement

- [ ] Variables d'environnement configurées
- [ ] Certificats SSL en place
- [ ] Sauvegarde de la base de données actuelle
- [ ] Tests de l'application en local
- [ ] Configuration Nginx validée
- [ ] Scripts de déploiement testés

### Déploiement

- [ ] Arrêt des services existants
- [ ] Construction des nouvelles images
- [ ] Démarrage des services
- [ ] Migration de la base de données
- [ ] Vérification de la santé des services
- [ ] Tests de fumée

### Post-déploiement

- [ ] Vérification des logs
- [ ] Tests fonctionnels
- [ ] Monitoring actif
- [ ] Documentation mise à jour
- [ ] Équipe notifiée

## Dépannage

### Problèmes courants

#### Service ne démarre pas

```bash
# Vérifier les logs
docker-compose logs service_name

# Vérifier la configuration
docker-compose config

# Redémarrer un service spécifique
docker-compose restart service_name
```

#### Base de données inaccessible

```bash
# Vérifier l'état de PostgreSQL
docker exec gestcom_postgres pg_isready -U gestcom_user

# Vérifier les connexions
docker exec gestcom_postgres psql -U gestcom_user -d gestcom_prod -c "SELECT version();"
```

#### Problèmes de performance

```bash
# Vérifier l'utilisation des ressources
docker stats

# Analyser les requêtes lentes
docker exec gestcom_postgres psql -U gestcom_user -d gestcom_prod -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"
```

### Contacts d'urgence

- **Administrateur système**: admin@gestcom.com
- **Équipe développement**: dev@gestcom.com
- **Support infrastructure**: ops@gestcom.com
