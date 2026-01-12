# Documentation API Backend - GestCom

## Architecture Backend

### Stack technique
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Langage**: TypeScript
- **ORM**: Prisma
- **Base de données**: PostgreSQL
- **Cache**: Redis
- **Authentification**: JWT + 2FA (TOTP)
- **Upload**: Multer + Sharp
- **Validation**: Zod

### Structure des modules

```
src/
├── modules/
│   ├── auth/              # Authentification & 2FA
│   ├── tenants/           # Gestion des tenants
│   ├── users/             # Gestion des utilisateurs
│   ├── products/          # Gestion des produits
│   ├── sales/             # Gestion des ventes
│   ├── stats/             # Statistiques
│   └── upload/            # Upload de fichiers
├── middleware/
│   ├── auth.middleware.ts      # Vérification JWT
│   ├── rbac.middleware.ts      # Contrôle d'accès basé sur les rôles
│   ├── tenant.middleware.ts    # Isolation des tenants
│   ├── rateLimit.middleware.ts # Limitation du taux de requêtes
│   └── errorHandler.ts         # Gestion globale des erreurs
└── utils/
    ├── response.ts        # Formatage des réponses
    ├── validation.ts      # Schémas de validation
    └── redis.ts          # Configuration Redis
```

## Endpoints API

### 🔐 Authentification (`/api/auth`)

#### POST `/api/auth/register`
Inscription d'un nouveau tenant avec administrateur.

**Body:**
```json
{
  "tenantName": "string",
  "tenantSlug": "string", 
  "adminName": "string",
  "adminEmail": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Tenant créé avec succès",
  "content": {
    "tenant": { "id": "uuid", "name": "string", "slug": "string" },
    "user": { "id": "uuid", "name": "string", "email": "string", "role": "DIRECTEUR" },
    "accessToken": "jwt_token"
  }
}
```

#### POST `/api/auth/login`
Connexion utilisateur avec vérification 2FA.

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "totpCode": "string" // Code 2FA à 6 chiffres
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Connexion réussie",
  "content": {
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "DIRECTEUR|GERANT|VENDEUR|MAGASINIER",
      "tenantId": "uuid",
      "imagePath": "string?"
    },
    "accessToken": "jwt_token"
  }
}
```

#### POST `/api/auth/refresh`
Renouvellement du token d'accès.

**Headers:** `Cookie: refreshToken=...`

**Response:**
```json
{
  "status": "success",
  "content": {
    "accessToken": "new_jwt_token"
  }
}
```

#### POST `/api/auth/logout`
Déconnexion et invalidation des tokens.

**Headers:** `Authorization: Bearer <token>`

### 🔑 2FA (`/api/auth/2fa`)

#### GET `/api/auth/2fa/setup`
Génération du QR code pour configurer 2FA.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "content": {
    "qrCode": "data:image/png;base64,...",
    "secret": "base32_secret"
  }
}
```

#### POST `/api/auth/2fa/verify`
Vérification et activation du 2FA.

**Body:**
```json
{
  "totpCode": "123456"
}
```

#### POST `/api/auth/2fa/reset`
Réinitialisation du 2FA (nécessite mot de passe).

**Body:**
```json
{
  "password": "string"
}
```

### 🏢 Tenants (`/api/tenants`)

#### GET `/api/tenants/list`
Liste des tenants (Superadmin uniquement).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "content": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "createdAt": "datetime",
      "director": {
        "name": "string",
        "email": "string",
        "imagePath": "string?"
      }
    }
  ]
}
```

#### POST `/api/tenants/create`
Création d'un nouveau tenant (Superadmin uniquement).

### 👥 Utilisateurs (`/api/users`)

#### GET `/api/users/list`
Liste des utilisateurs du tenant.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": "success",
  "content": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "DIRECTEUR|GERANT|VENDEUR|MAGASINIER",
      "imagePath": "string?",
      "createdAt": "datetime"
    }
  ]
}
```

#### POST `/api/users/create`
Création d'un nouvel utilisateur.

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "GERANT|VENDEUR|MAGASINIER"
}
```

#### GET `/api/users/profile`
Profil de l'utilisateur connecté.

#### PUT `/api/users/change-password`
Changement de mot de passe.

**Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

### 📦 Produits (`/api/products`)

#### GET `/api/products/list`
Liste des produits du tenant.

**Response:**
```json
{
  "status": "success",
  "content": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string?",
      "price": "number",
      "stock": "number",
      "sku": "string",
      "imagePath": "string?",
      "createdAt": "datetime"
    }
  ]
}
```

#### POST `/api/products/create`
Création d'un produit (MAGASINIER+).

**Body:**
```json
{
  "name": "string",
  "description": "string?",
  "price": "number",
  "stock": "number",
  "sku": "string",
  "imagePath": "string?"
}
```

#### PUT `/api/products/:id`
Mise à jour d'un produit (MAGASINIER+).

### 💰 Ventes (`/api/sales`)

#### GET `/api/sales/list`
Liste des ventes du tenant.

**Response:**
```json
{
  "status": "success",
  "content": [
    {
      "id": "uuid",
      "totalAmount": "number",
      "createdAt": "datetime",
      "user": {
        "name": "string",
        "imagePath": "string?"
      },
      "items": [
        {
          "product": { "name": "string" },
          "quantity": "number",
          "unitPrice": "number"
        }
      ]
    }
  ]
}
```

#### POST `/api/sales/create`
Création d'une vente.

**Body:**
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": "number",
      "unitPrice": "number"
    }
  ]
}
```

#### GET `/api/sales/my-sales`
Ventes de l'utilisateur connecté.

### 📊 Statistiques (`/api/stats`)

#### GET `/api/stats`
Statistiques du tenant ou globales.

**Response (Directeur):**
```json
{
  "status": "success",
  "content": {
    "totalRevenue": "number",
    "totalSales": "number",
    "totalProducts": "number",
    "totalUsers": "number",
    "lowStock": [
      { "id": "uuid", "name": "string", "stock": "number" }
    ],
    "recentSales": [...],
    "revenueByPeriod": [
      { "date": "YYYY-MM-DD", "amount": "number" }
    ],
    "topProducts": [
      { "name": "string", "sales": "number", "revenue": "number" }
    ]
  }
}
```

### 📁 Upload (`/api/upload`)

#### POST `/api/upload/image`
Upload d'une image.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body:** FormData avec champ `image`

**Response:**
```json
{
  "status": "success",
  "message": "Image uploadée avec succès",
  "content": {
    "url": "http://localhost:3002/api/upload/images/filename.jpg",
    "filename": "timestamp_random.jpg",
    "originalName": "original.jpg",
    "size": 123456
  }
}
```

#### GET `/api/upload/images/:filename`
Récupération d'une image uploadée.

**Response:** Fichier image avec headers CORS appropriés.

## Middleware

### 🔐 Authentication (`auth.middleware.ts`)
Vérifie la validité du JWT et charge les informations utilisateur.

```typescript
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    tenantId?: string;
  }
}
```

### 🏢 Tenant Isolation (`tenant.middleware.ts`)
Assure l'isolation des données par tenant.

### 🛡️ RBAC (`rbac.middleware.ts`)
Contrôle d'accès basé sur les rôles.

**Hiérarchie des rôles:**
```
SUPERADMIN (accès global)
├── DIRECTEUR (gestion tenant)
    ├── GERANT (gestion magasin)
        ├── VENDEUR (ventes)
            └── MAGASINIER (stock + ventes)
```

### ⚡ Rate Limiting (`rateLimit.middleware.ts`)
Limitation du nombre de requêtes par IP avec Redis.

**Configuration:**
- 100 requêtes par 15 minutes par défaut
- Stratégie "fail open" si Redis indisponible

## Validation des données

Utilisation de Zod pour la validation des schémas:

```typescript
// Exemple: Validation création produit
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  sku: z.string().min(1).max(100),
  imagePath: z.string().optional()
});
```

## Gestion des erreurs

Format standardisé des réponses d'erreur:

```json
{
  "status": "error",
  "message": "Description de l'erreur",
  "content": "Détails supplémentaires ou null"
}
```

## Sécurité

### JWT Configuration
- **Access Token**: 15 minutes
- **Refresh Token**: 7 jours (HttpOnly cookie)
- **Algorithm**: HS256

### 2FA (TOTP)
- **Algorithme**: SHA1
- **Période**: 30 secondes
- **Digits**: 6
- **Obligatoire** pour tous les comptes

### Upload de fichiers
- **Types autorisés**: JPG, PNG, WEBP
- **Taille max**: 5MB
- **Traitement**: Redimensionnement (800x600) + compression
- **Stockage**: `/uploads/images/` avec noms uniques

## Base de données

### Connexion
```typescript
// Prisma Client avec gestion des erreurs
const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: ['error', 'warn']
});
```

### Transactions
Utilisation des transactions Prisma pour les opérations critiques (ex: ventes avec déduction de stock).

## Redis

### Configuration
```typescript
const redis = new Redis({
  host: 'redis',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});
```

### Utilisation
- Rate limiting
- Cache des sessions
- Stockage temporaire des tokens 2FA
