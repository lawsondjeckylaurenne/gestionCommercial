# Guide de Démarrage Rapide - GestCom

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Docker Desktop** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git** (pour cloner le projet)

### Vérification des prérequis

```bash
# Vérifier Docker
docker --version
# Sortie attendue : Docker version 20.10.x ou plus récent

# Vérifier Docker Compose
docker-compose --version
# Sortie attendue : Docker Compose version 2.x.x ou plus récent

# Vérifier Git
git --version
# Sortie attendue : git version 2.x.x
```

## Installation et démarrage

### 1. Cloner le projet

```bash
# Cloner le repository
git clone <repository-url>
cd "SaaS gestion commerciale"
```

### 2. Naviguer vers le dossier backend

```bash
cd backend
```

### 3. Démarrer les services avec Docker

```bash
# Démarrer tous les services en arrière-plan
docker-compose up -d

# Alternative : Voir les logs en temps réel
docker-compose up
```

**Temps de démarrage estimé :** 2-5 minutes (selon votre connexion internet)

### 4. Initialiser la base de données

```bash
# Réinitialiser complètement la base de données (supprime toutes les données)
docker exec saas_backend npx prisma migrate reset --force

# Synchroniser le schéma avec la base de données
docker exec saas_backend npx prisma db push

# Insérer les données de test (seed)
docker exec saas_backend npm run seed
```

**⚠️ Important :** Ces commandes créent la structure de la base de données et ajoutent les comptes de test.

**Alternative pour mise à jour sans perte de données :**
```bash
# Si vous voulez juste appliquer les migrations sans tout supprimer
docker exec saas_backend npx prisma migrate deploy
docker exec saas_backend npx prisma generate
docker exec saas_backend npm run seed
```

### 5. Vérifier que les services sont démarrés

```bash
# Vérifier l'état des containers
docker-compose ps

# Sortie attendue :
# NAME              COMMAND                  SERVICE     STATUS      PORTS
# saas_backend      "npm run dev"           backend     running     0.0.0.0:3002->3001/tcp
# saas_frontend     "pnpm start"            frontend    running     0.0.0.0:3000->3000/tcp
# saas_postgres     "docker-entrypoint.s…"  postgres    running     0.0.0.0:5432->5432/tcp
# saas_redis        "docker-entrypoint.s…"  redis       running     0.0.0.0:6379->6379/tcp
```

### 6. Accéder à l'application

Une fois tous les services démarrés :

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3002
- **Base de données** : localhost:5432 (PostgreSQL)
- **Redis** : localhost:6379

## Comptes de test

### Superadmin
- **Email** : `superadmin@gestcom.com`
- **Mot de passe** : `SuperAdmin123!`
- **Accès** : Gestion globale de tous les tenants

### Directeur (Tenant de test)
- **Email** : `director@tenant1.com`
- **Mot de passe** : `Director123!`
- **Accès** : Gestion complète du tenant "tenant1"

## Configuration 2FA

⚠️ **Important** : La 2FA est obligatoire pour tous les comptes.

### Première connexion

1. Connectez-vous avec les identifiants ci-dessus
2. Vous serez redirigé vers la page de configuration 2FA
3. Scannez le QR code avec votre application d'authentification :
   - **Google Authenticator** (iOS/Android)
   - **Authy** (iOS/Android/Desktop)
   - **Microsoft Authenticator** (iOS/Android)
4. Entrez le code à 6 chiffres généré
5. Cliquez sur "Activer 2FA"

### Applications 2FA recommandées

- **Google Authenticator** : Simple et fiable
- **Authy** : Synchronisation multi-appareils
- **Microsoft Authenticator** : Intégration Microsoft

## Commandes utiles

### Gestion des services

```bash
# Démarrer tous les services
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart backend
docker-compose restart frontend

# Voir les logs d'un service
docker-compose logs backend
docker-compose logs frontend

# Voir les logs en temps réel
docker-compose logs -f backend
```

### Gestion de la base de données

```bash
# Réinitialiser complètement la base de données
docker exec saas_backend npx prisma migrate reset --force

# Appliquer les migrations manuellement
docker exec saas_backend npx prisma migrate deploy

# Regénérer le client Prisma après modifications du schéma
docker exec saas_backend npx prisma generate

# Réexécuter le seed (données de test)
docker exec saas_backend npm run seed

# Accéder à la console PostgreSQL
docker exec -it saas_postgres psql -U postgres -d gestcom

# Voir les tables
\dt

# Voir les données d'une table
SELECT * FROM "User" LIMIT 5;

# Quitter la console
\q

# Sauvegarder la base de données
docker exec saas_postgres pg_dump -U postgres gestcom > backup.sql

# Restaurer la base de données
docker exec -i saas_postgres psql -U postgres gestcom < backup.sql
```

### Reconstruction des images

```bash
# Reconstruire toutes les images
docker-compose build --no-cache

# Reconstruire une image spécifique
docker-compose build --no-cache frontend
docker-compose build --no-cache backend

# Reconstruire et redémarrer
docker-compose up -d --build
```

### Nettoyage

```bash
# Arrêter et supprimer tous les containers
docker-compose down

# Supprimer les volumes (⚠️ PERTE DE DONNÉES)
docker-compose down -v

# Nettoyer les images Docker inutilisées
docker system prune -f

# Nettoyage complet (⚠️ SUPPRIME TOUT)
docker system prune -a -f --volumes
```

## Résolution des problèmes courants

### Problème : Port déjà utilisé

```bash
# Erreur : "Port 3000 is already in use"

# Solution 1 : Trouver et arrêter le processus
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Solution 2 : Modifier le port dans docker-compose.yml
ports:
  - "3001:3000"  # Utiliser le port 3001 au lieu de 3000
```

### Problème : Services ne démarrent pas

```bash
# Vérifier les logs pour identifier l'erreur
docker-compose logs

# Vérifier l'espace disque disponible
df -h

# Redémarrer Docker Desktop
# Windows/macOS : Redémarrer Docker Desktop
# Linux : sudo systemctl restart docker
```

### Problème : Base de données inaccessible

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Redémarrer PostgreSQL
docker-compose restart postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres
```

### Problème : Images ne s'affichent pas

```bash
# Vérifier que le dossier uploads existe
docker exec saas_backend ls -la uploads/

# Créer le dossier si nécessaire
docker exec saas_backend mkdir -p uploads/images

# Vérifier les permissions
docker exec saas_backend chmod 755 uploads/images
```

## Structure des ports

| Service   | Port interne | Port externe | URL d'accès              |
|-----------|--------------|--------------|--------------------------|
| Frontend  | 3000         | 3000         | http://localhost:3000    |
| Backend   | 3001         | 3002         | http://localhost:3002    |
| PostgreSQL| 5432         | 5432         | localhost:5432           |
| Redis     | 6379         | 6379         | localhost:6379           |

## Variables d'environnement

Les variables d'environnement sont préconfigurées dans `docker-compose.yml` pour le développement :

```yaml
# Base de données
POSTGRES_DB=gestcom
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# Backend
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/gestcom
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

## Développement

### Modification du code

Les modifications du code sont automatiquement synchronisées grâce aux volumes Docker :

- **Frontend** : Hot reload activé (Next.js)
- **Backend** : Nodemon pour le rechargement automatique

### Ajout de dépendances

```bash
# Frontend (dans le container)
docker exec saas_frontend pnpm add <package-name>

# Backend (dans le container)
docker exec saas_backend npm install <package-name>

# Puis reconstruire l'image
docker-compose build frontend
# ou
docker-compose build backend
```

### Accès aux logs de développement

```bash
# Logs du frontend (Next.js)
docker-compose logs -f frontend

# Logs du backend (Express + Nodemon)
docker-compose logs -f backend

# Logs de tous les services
docker-compose logs -f
```

## Tests

### Tester l'API

```bash
# Test de santé du backend
curl http://localhost:3002/health

# Test de connexion (remplacer par vos identifiants)
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gestcom.com","password":"SuperAdmin123!","totpCode":"123456"}'
```

### Tester le frontend

1. Ouvrir http://localhost:3000
2. Vérifier que la page de connexion s'affiche
3. Tester la connexion avec les comptes de test

## Mise en production

Pour déployer en production, consultez le guide détaillé : [deployment.md](./deployment.md)

## Support

### Logs utiles pour le débogage

```bash
# Tous les logs
docker-compose logs

# Logs avec timestamps
docker-compose logs -t

# Logs des dernières 100 lignes
docker-compose logs --tail=100

# Logs d'un service spécifique
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis
```

### Informations système

```bash
# Informations Docker
docker info

# Espace disque utilisé par Docker
docker system df

# Containers en cours d'exécution
docker ps

# Toutes les images
docker images
```

## Checklist de démarrage

- [ ] Docker Desktop installé et démarré
- [ ] Projet cloné localement
- [ ] Dans le dossier `backend/`
- [ ] `docker-compose up -d` exécuté
- [ ] **Base de données initialisée** (`npx prisma migrate deploy`)
- [ ] **Données de test ajoutées** (`npm run seed`)
- [ ] Tous les services sont "running" (`docker-compose ps`)
- [ ] Frontend accessible sur http://localhost:3000
- [ ] Backend accessible sur http://localhost:3002
- [ ] Connexion testée avec un compte de test
- [ ] 2FA configuré et fonctionnel

Pour aller plus loin, consultez la documentation complète dans le dossier `docs/`.