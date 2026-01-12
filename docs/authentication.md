# Documentation Authentification & Autorisation - GestCom

## Vue d'ensemble

GestCom implémente un système d'authentification et d'autorisation robuste basé sur JWT avec 2FA obligatoire et contrôle d'accès basé sur les rôles (RBAC).

## Architecture de sécurité

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ AuthContext │ │◄──►│ │ JWT + 2FA   │ │◄──►│ │ Users Table │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ localStorage│ │    │ │ Middleware  │ │    │ │ AuditLog    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │ (Rate Limiting) │
                       └─────────────────┘
```

## Système d'authentification JWT

### Configuration JWT

```typescript
// Configuration des tokens
const JWT_CONFIG = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256'
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256'
  }
};
```

### Structure des tokens

**Access Token Payload:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "DIRECTEUR",
  "tenantId": "tenant_uuid",
  "iat": 1640995200,
  "exp": 1640996100
}
```

**Refresh Token Payload:**
```json
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1640995200,
  "exp": 1641600000
}
```

### Génération des tokens

```typescript
// backend/src/modules/auth/auth.controller.ts
const generateTokens = (user: User) => {
  const accessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId
  };

  const refreshTokenPayload = {
    sub: user.id,
    type: 'refresh'
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    JWT_CONFIG.accessToken.secret,
    { expiresIn: JWT_CONFIG.accessToken.expiresIn }
  );

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    JWT_CONFIG.refreshToken.secret,
    { expiresIn: JWT_CONFIG.refreshToken.expiresIn }
  );

  return { accessToken, refreshToken };
};
```

### Stockage des tokens

**Backend (Refresh Token):**
- Stocké dans un cookie HttpOnly sécurisé
- Flags: `httpOnly`, `secure`, `sameSite: 'strict'`
- Durée: 7 jours

**Frontend (Access Token):**
- Stocké dans localStorage
- Durée: 15 minutes
- Inclus dans header Authorization

```typescript
// Côté backend - Définition du cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
});

// Côté frontend - Stockage access token
localStorage.setItem('accessToken', accessToken);
```

## Authentification à deux facteurs (2FA)

### Configuration TOTP

```typescript
// Configuration 2FA
const TOTP_CONFIG = {
  algorithm: 'sha1',
  digits: 6,
  period: 30,
  window: 1, // Accepte ±30 secondes
  issuer: 'GestCom'
};
```

### Processus de configuration 2FA

1. **Génération du secret**
```typescript
const generateTOTPSecret = (user: User) => {
  const secret = speakeasy.generateSecret({
    name: `${user.email} (${user.name})`,
    issuer: 'GestCom',
    length: 32
  });

  return {
    secret: secret.base32,
    qrCode: qrcode.toDataURL(secret.otpauth_url)
  };
};
```

2. **Vérification du code**
```typescript
const verifyTOTP = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: TOTP_CONFIG.window
  });
};
```

3. **Activation du 2FA**
```typescript
// Après vérification réussie du code
await prisma.user.update({
  where: { id: userId },
  data: {
    totpSecret: encryptedSecret,
    isTwoFactorEnabled: true
  }
});
```

### Processus de connexion avec 2FA

```typescript
// 1. Vérification email/password
const user = await prisma.user.findUnique({
  where: { email }
});

const isValidPassword = await bcrypt.compare(password, user.password);

if (!isValidPassword) {
  throw new Error('Identifiants invalides');
}

// 2. Vérification 2FA obligatoire
if (!user.isTwoFactorEnabled) {
  throw new Error('2FA non configuré');
}

const isValidTOTP = verifyTOTP(totpCode, user.totpSecret);

if (!isValidTOTP) {
  throw new Error('Code 2FA invalide');
}

// 3. Génération des tokens
const tokens = generateTokens(user);
```

### Réinitialisation 2FA

```typescript
// Nécessite le mot de passe actuel
const reset2FA = async (userId: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    throw new Error('Mot de passe incorrect');
  }

  // Génération nouveau secret
  const { secret, qrCode } = generateTOTPSecret(user);

  // Mise à jour en base (temporaire jusqu'à vérification)
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: null, // Reset temporaire
      isTwoFactorEnabled: false
    }
  });

  return { qrCode, secret };
};
```

## Contrôle d'accès basé sur les rôles (RBAC)

### Hiérarchie des rôles

```
SUPERADMIN (Accès global à tous les tenants)
├── DIRECTEUR (Gestion complète du tenant)
    ├── GERANT (Gestion opérationnelle)
        ├── VENDEUR (Ventes uniquement)
            └── MAGASINIER (Stock + Ventes)
```

### Définition des permissions

```typescript
// Types de rôles
enum Role {
  SUPERADMIN = 'SUPERADMIN',
  DIRECTEUR = 'DIRECTEUR',
  GERANT = 'GERANT',
  VENDEUR = 'VENDEUR',
  MAGASINIER = 'MAGASINIER'
}

// Hiérarchie des rôles (du plus élevé au plus bas)
const ROLE_HIERARCHY = [
  Role.SUPERADMIN,
  Role.DIRECTEUR,
  Role.GERANT,
  Role.VENDEUR,
  Role.MAGASINIER
];

// Vérification des permissions
const hasPermission = (userRole: Role, requiredRole: Role): boolean => {
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  
  return userLevel <= requiredLevel; // Plus le niveau est bas, plus le rôle est élevé
};
```

### Middleware d'autorisation

```typescript
// backend/src/middleware/rbac.middleware.ts
export const requireRole = (requiredRole: Role) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Non authentifié', 401);
    }

    if (!hasPermission(req.user.role, requiredRole)) {
      return sendError(res, 'Permissions insuffisantes', 403);
    }

    next();
  };
};

// Utilisation dans les routes
router.post('/create', requireRole(Role.MAGASINIER), createProduct);
router.get('/list', requireRole(Role.VENDEUR), getProducts);
```

### Permissions par module

#### Gestion des utilisateurs
- **SUPERADMIN**: Tous les utilisateurs de tous les tenants
- **DIRECTEUR**: Utilisateurs de son tenant uniquement
- **GERANT+**: Lecture seule des utilisateurs du tenant

#### Gestion des produits
- **MAGASINIER+**: CRUD complet sur les produits
- **VENDEUR+**: Lecture seule des produits

#### Gestion des ventes
- **VENDEUR+**: Création et lecture de ses propres ventes
- **GERANT+**: Lecture de toutes les ventes du tenant
- **DIRECTEUR+**: CRUD complet sur les ventes du tenant

#### Statistiques
- **SUPERADMIN**: Statistiques globales + par tenant
- **DIRECTEUR**: Statistiques complètes du tenant
- **GERANT+**: Statistiques limitées du tenant

## Middleware d'authentification

### Vérification JWT

```typescript
// backend/src/middleware/auth.middleware.ts
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Token manquant', 401);
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_CONFIG.accessToken.secret) as JwtPayload;
    
    // Vérification de l'utilisateur en base
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { tenant: true }
    });

    if (!user) {
      return sendError(res, 'Utilisateur non trouvé', 401);
    }

    // Ajout des informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      tenantId: user.tenantId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendError(res, 'Token expiré', 401);
    }
    
    return sendError(res, 'Token invalide', 401);
  }
};
```

### Isolation des tenants

```typescript
// backend/src/middleware/tenant.middleware.ts
export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(res, 'Non authentifié', 401);
  }

  // SUPERADMIN peut accéder à tous les tenants
  if (req.user.role === Role.SUPERADMIN) {
    return next();
  }

  // Autres rôles doivent avoir un tenantId
  if (!req.user.tenantId) {
    return sendError(res, 'Accès non autorisé', 403);
  }

  next();
};
```

## Gestion des sessions

### Refresh des tokens

```typescript
// Endpoint de refresh
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return sendError(res, 'Refresh token manquant', 401);
    }

    const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshToken.secret) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user) {
      return sendError(res, 'Utilisateur non trouvé', 401);
    }

    // Génération nouveau access token
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      JWT_CONFIG.accessToken.secret,
      { expiresIn: JWT_CONFIG.accessToken.expiresIn }
    );

    sendSuccess(res, 'Token renouvelé', { accessToken: newAccessToken });
  } catch (error) {
    return sendError(res, 'Refresh token invalide', 401);
  }
};
```

### Déconnexion

```typescript
export const logout = async (req: Request, res: Response) => {
  // Suppression du refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  // Audit log
  if (req.user) {
    await createAuditLog({
      userId: req.user.id,
      action: 'LOGOUT',
      resource: 'AUTH',
      ip: req.ip
    });
  }

  sendSuccess(res, 'Déconnexion réussie');
};
```

## Sécurité côté frontend

### AuthContext

```typescript
// frontend/contexts/auth-context.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérification du token au chargement
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Vérification de la validité du token
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, totpCode: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, totpCode })
    });

    const { user, accessToken } = response.content;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    // Appel API de déconnexion
    apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
  };

  // Refresh automatique du token
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const { accessToken } = await response.json();
        localStorage.setItem('accessToken', accessToken);
        return true;
      }
    } catch (error) {
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protection des routes

```typescript
// Protection au niveau layout
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <>{children}</>;
}

// Protection basée sur les rôles
export const withRoleProtection = (Component: React.ComponentType, requiredRole: Role) => {
  return function ProtectedComponent(props: any) {
    const { user } = useAuth();
    
    if (!user || !hasPermission(user.role, requiredRole)) {
      return <AccessDenied />;
    }
    
    return <Component {...props} />;
  };
};
```

## Rate Limiting

### Configuration Redis

```typescript
// backend/src/middleware/rateLimit.middleware.ts
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
};

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = `rate_limit:${req.ip}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, rateLimitConfig.windowMs / 1000);
    }
    
    if (current > rateLimitConfig.max) {
      return sendError(res, rateLimitConfig.message, 429);
    }
    
    // Headers informatifs
    res.setHeader('X-RateLimit-Limit', rateLimitConfig.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitConfig.max - current));
    
    next();
  } catch (error) {
    // Fail open: si Redis est indisponible, on laisse passer
    console.warn('Rate limiting unavailable:', error);
    next();
  }
};
```

## Audit et logging

### Audit Trail

```typescript
// Création d'un log d'audit
const createAuditLog = async (data: {
  userId: string;
  action: string;
  resource: string;
  details?: any;
  ip?: string;
}) => {
  await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      details: data.details || {},
      ip: data.ip,
      createdAt: new Date()
    }
  });
};

// Utilisation dans les contrôleurs
export const createProduct = async (req: AuthRequest, res: Response) => {
  // ... logique de création ...
  
  // Audit log
  await createAuditLog({
    userId: req.user!.id,
    action: 'CREATE',
    resource: 'PRODUCT',
    details: { productId: newProduct.id, name: newProduct.name },
    ip: req.ip
  });
};
```

## Bonnes pratiques de sécurité

### Validation des données

```typescript
// Validation avec Zod
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
  totpCode: z.string().regex(/^\d{6}$/, 'Code 2FA invalide')
});

// Utilisation
const validatedData = loginSchema.parse(req.body);
```

### Hachage des mots de passe

```typescript
// Hachage à l'inscription
const hashedPassword = await bcrypt.hash(password, 12);

// Vérification à la connexion
const isValid = await bcrypt.compare(password, user.password);
```

### Protection CSRF

```typescript
// Configuration CORS stricte
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Headers de sécurité

```typescript
// Helmet pour les headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```
