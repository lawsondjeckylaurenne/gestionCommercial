# GestCom - Plateforme de Gestion Commerciale

## Vue d'ensemble

GestCom est une solution SaaS multi-tenant complète pour la gestion commerciale, développée avec une architecture moderne et sécurisée.

### Technologies principales

**Backend:**
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Redis (cache & rate limiting)
- JWT + 2FA (authentification)
- Docker

**Frontend:**
- Next.js 16 + TypeScript
- React 18
- TailwindCSS
- Shadcn/ui
- Lucide Icons

## Architecture

```
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

## Fonctionnalités principales

### 🏢 Multi-tenant
- Isolation complète des données par tenant
- Gestion des rôles hiérarchiques
- Tableau de bord personnalisé par tenant

### 🔐 Sécurité
- Authentification JWT avec refresh tokens
- 2FA obligatoire (TOTP)
- Rate limiting avec Redis
- Validation des données avec Zod
- Audit trail complet

### 📊 Gestion commerciale
- Gestion des produits avec images
- Suivi des ventes et statistiques
- Gestion des stocks
- Rapports et analytics

### 🎨 Interface utilisateur
- Design moderne et responsive
- Thème sombre/clair
- Upload d'images par drag & drop
- Notifications en temps réel

## Structure du projet

```
├── backend/
│   ├── src/
│   │   ├── modules/          # Modules métier
│   │   ├── middleware/       # Middlewares Express
│   │   ├── utils/           # Utilitaires
│   │   └── index.ts         # Point d'entrée
│   ├── prisma/              # Schéma base de données
│   └── uploads/             # Fichiers uploadés
├── frontend/
│   ├── app/                 # Pages Next.js
│   ├── components/          # Composants React
│   ├── lib/                 # Utilitaires frontend
│   └── contexts/            # Contextes React
└── docs/                    # Documentation
```

## Démarrage rapide

1. **Cloner le projet**
```bash
git clone <repository>
cd "SaaS gestion commerciale"
```

2. **Démarrer avec Docker**
```bash
cd backend
docker-compose up -d
```

3. **Accéder à l'application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3002

## Documentation détaillée

- [📚 API Backend](./backend-api.md)
- [🎨 Frontend](./frontend.md)
- [🔐 Authentification](./authentication.md)
- [🗄️ Base de données](./database.md)
- [🚀 Déploiement](./deployment.md)

## Comptes de test

**Superadmin:**
- Email: superadmin@gestcom.com
- Password: SuperAdmin123!

**Directeur:**
- Email: director@tenant1.com
- Password: Director123!

## Support

Pour toute question ou problème, consultez la documentation détaillée dans le dossier `docs/`.
