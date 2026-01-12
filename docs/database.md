# Documentation Base de Données - GestCom

## Vue d'ensemble

GestCom utilise PostgreSQL comme base de données principale avec Prisma comme ORM. La base de données est conçue pour supporter une architecture multi-tenant avec isolation complète des données.

## Architecture de la base de données

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Tenants     │    │     Users       │    │   Products      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Multi-tenant│ │◄──►│ │ RBAC System │ │◄──►│ │ Inventory   │ │
│ │ Isolation   │ │    │ │ + 2FA       │ │    │ │ Management  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │     Sales       │    │   AuditLog      │
                    │                 │    │                 │
                    │ ┌─────────────┐ │    │ ┌─────────────┐ │
                    │ │ Transactions│ │    │ │ Security &  │ │
                    │ │ + Stock     │ │    │ │ Compliance  │ │
                    │ └─────────────┘ │    │ └─────────────┘ │
                    └─────────────────┘    └─────────────────┘
```

## Schéma Prisma

### Configuration

```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Modèles de données

#### Tenant (Multi-tenancy)

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  users    User[]
  products Product[]
  sales    Sale[]

  @@map("tenants")
}
```

**Description:**
- **id**: Identifiant unique du tenant (CUID)
- **name**: Nom commercial du tenant
- **slug**: Identifiant URL-friendly unique
- **createdAt/updatedAt**: Timestamps automatiques

#### User (Utilisateurs et authentification)

```prisma
enum Role {
  SUPERADMIN
  DIRECTEUR
  GERANT
  VENDEUR
  MAGASINIER
}

model User {
  id                   String   @id @default(cuid())
  email                String   @unique
  password             String
  name                 String
  role                 Role
  imagePath            String?
  
  // 2FA Configuration
  totpSecret           String?
  isTwoFactorEnabled   Boolean  @default(false)
  
  // Tenant association
  tenantId             String?
  tenant               Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relations
  sales                Sale[]
  auditLogs            AuditLog[]

  @@map("users")
}
```

**Description:**
- **Authentification**: Email/password + 2FA obligatoire
- **Rôles**: Hiérarchie SUPERADMIN → DIRECTEUR → GERANT → VENDEUR → MAGASINIER
- **Multi-tenant**: Association optionnelle à un tenant (SUPERADMIN n'a pas de tenant)
- **2FA**: Secret TOTP chiffré + flag d'activation
- **Image**: Chemin vers photo de profil

#### Product (Gestion des produits)

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  stock       Int
  sku         String
  imagePath   String?
  
  // Tenant isolation
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  saleItems   SaleItem[]

  @@unique([sku, tenantId]) // SKU unique par tenant
  @@map("products")
}
```

**Description:**
- **Isolation**: Chaque produit appartient à un tenant
- **SKU**: Code produit unique par tenant
- **Stock**: Quantité disponible (décrément atomique lors des ventes)
- **Image**: Chemin vers image uploadée
- **Prix**: Stocké en centimes pour éviter les erreurs de précision

#### Sale (Gestion des ventes)

```prisma
model Sale {
  id          String   @id @default(cuid())
  totalAmount Float
  
  // Associations
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  items       SaleItem[]

  @@map("sales")
}

model SaleItem {
  id        String  @id @default(cuid())
  quantity  Int
  unitPrice Float
  
  // Associations
  saleId    String
  sale      Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  
  // Timestamps
  createdAt DateTime @default(now())

  @@map("sale_items")
}
```

**Description:**
- **Transaction**: Sale + SaleItems créés de manière atomique
- **Stock**: Décrément automatique lors de la création
- **Isolation**: Ventes liées au tenant de l'utilisateur
- **Historique**: Conservation des prix au moment de la vente

#### AuditLog (Traçabilité)

```prisma
model AuditLog {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  action   String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  resource String   // USER, PRODUCT, SALE, AUTH
  details  Json?    // Détails supplémentaires
  ip       String?  // Adresse IP
  createdAt DateTime @default(now())

  @@map("audit_logs")
}
```

**Description:**
- **Traçabilité**: Toutes les actions importantes sont loggées
- **Conformité**: Respect des exigences d'audit
- **Détails**: Stockage JSON flexible pour les métadonnées
- **Sécurité**: Enregistrement de l'IP source

## Relations et contraintes

### Diagramme des relations

```
Tenant (1) ──────── (*) User
  │                    │
  │                    │
  │ (1)              (1) │
  │                    │
  └── (*) Product      │
  │                    │
  │ (1)              (*) │
  │                    │
  └── (*) Sale ────────┘
        │
        │ (1)
        │
        └── (*) SaleItem ──── (*) Product
```

### Contraintes d'intégrité

#### Isolation des tenants
```sql
-- Tous les produits d'un tenant sont isolés
ALTER TABLE products ADD CONSTRAINT tenant_isolation 
CHECK (tenant_id IS NOT NULL);

-- Les ventes ne peuvent référencer que des produits du même tenant
CREATE OR REPLACE FUNCTION check_sale_tenant_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    WHERE s.id = NEW.id AND p.tenant_id != s.tenant_id
  ) THEN
    RAISE EXCEPTION 'Sale items must belong to the same tenant as the sale';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Gestion du stock
```sql
-- Trigger pour décrémenter le stock lors d'une vente
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  -- Vérifier que le stock ne devient pas négatif
  IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
    RAISE EXCEPTION 'Stock insuffisant pour le produit %', NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();
```

## Migrations Prisma

### Structure des migrations

```
prisma/migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240102000000_add_2fa/
│   └── migration.sql
├── 20240103000000_add_image_paths/
│   └── migration.sql
└── migration_lock.toml
```

### Migration initiale

```sql
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'DIRECTEUR', 'GERANT', 'VENDEUR', 'MAGASINIER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "imagePath" TEXT,
    "totpSecret" TEXT,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

### Commandes de migration

```bash
# Générer une nouvelle migration
npx prisma migrate dev --name add_feature

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la base de données (développement)
npx prisma migrate reset

# Générer le client Prisma
npx prisma generate
```

## Requêtes et optimisations

### Requêtes courantes avec Prisma

#### Récupération des produits avec isolation tenant

```typescript
const getProducts = async (tenantId: string) => {
  return await prisma.product.findMany({
    where: {
      tenantId: tenantId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: {
          saleItems: true
        }
      }
    }
  });
};
```

#### Création de vente avec transaction atomique

```typescript
const createSale = async (userId: string, tenantId: string, items: SaleItemInput[]) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Vérifier le stock disponible
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId }
      });
      
      if (!product || product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product?.name}`);
      }
    }

    // 2. Créer la vente
    const sale = await tx.sale.create({
      data: {
        userId,
        tenantId,
        totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // 3. Décrémenter le stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });
    }

    return sale;
  });
};
```

#### Statistiques avec requêtes SQL brutes

```typescript
const getRevenueByPeriod = async (tenantId: string, days: number = 30) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

  return await prisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date,
      SUM("totalAmount") as amount
    FROM "Sale"
    WHERE "tenantId" = ${tenantId} 
    AND "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt")
  `;
};
```

### Index et performances

#### Index recommandés

```sql
-- Index pour les requêtes fréquentes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Index composites pour les requêtes complexes
CREATE INDEX idx_products_tenant_stock ON products(tenant_id, stock);
CREATE INDEX idx_sales_tenant_date ON sales(tenant_id, created_at);
```

#### Optimisation des requêtes

```typescript
// Utilisation de select pour limiter les données
const getProductsList = async (tenantId: string) => {
  return await prisma.product.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      imagePath: true
    }
  });
};

// Pagination pour les grandes listes
const getProductsPaginated = async (tenantId: string, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({
      where: { tenantId }
    })
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

## Sauvegarde et restauration

### Configuration des sauvegardes

```bash
#!/bin/bash
# backup.sh - Script de sauvegarde automatique

DB_NAME="gestcom"
DB_USER="postgres"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Sauvegarde complète
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/gestcom_$DATE.sql

# Compression
gzip $BACKUP_DIR/gestcom_$DATE.sql

# Nettoyage des anciennes sauvegardes (garde 30 jours)
find $BACKUP_DIR -name "gestcom_*.sql.gz" -mtime +30 -delete
```

### Restauration

```bash
#!/bin/bash
# restore.sh - Script de restauration

BACKUP_FILE=$1
DB_NAME="gestcom"
DB_USER="postgres"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup_file>"
  exit 1
fi

# Décompression si nécessaire
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c $BACKUP_FILE | psql -h localhost -U $DB_USER -d $DB_NAME
else
  psql -h localhost -U $DB_USER -d $DB_NAME < $BACKUP_FILE
fi
```

## Monitoring et maintenance

### Requêtes de monitoring

```sql
-- Taille des tables
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Statistiques des requêtes lentes
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Connexions actives
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity 
WHERE state = 'active';
```

### Maintenance automatique

```sql
-- Analyse des statistiques (à exécuter régulièrement)
ANALYZE;

-- Nettoyage des données obsolètes
VACUUM ANALYZE;

-- Réindexation si nécessaire
REINDEX DATABASE gestcom;
```

## Sécurité de la base de données

### Configuration PostgreSQL

```postgresql
# postgresql.conf
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# Logging
log_statement = 'mod'
log_min_duration_statement = 1000

# Connexions
max_connections = 100
shared_buffers = 256MB
```

### Utilisateurs et permissions

```sql
-- Création d'un utilisateur applicatif
CREATE USER gestcom_app WITH PASSWORD 'secure_password';

-- Permissions minimales
GRANT CONNECT ON DATABASE gestcom TO gestcom_app;
GRANT USAGE ON SCHEMA public TO gestcom_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gestcom_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO gestcom_app;

-- Révocation des permissions superflues
REVOKE CREATE ON SCHEMA public FROM gestcom_app;
```

### Chiffrement des données sensibles

```typescript
// Chiffrement du secret 2FA
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  cipher.setAAD(Buffer.from('gestcom-2fa'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

export const decrypt = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
  decipher.setAAD(Buffer.from('gestcom-2fa'));
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```
