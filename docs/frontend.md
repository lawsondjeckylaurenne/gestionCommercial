# Documentation Frontend - GestCom

## Architecture Frontend

### Stack technique
- **Framework**: Next.js 16 (App Router)
- **Langage**: TypeScript
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **Components**: Shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Context + useState/useEffect
- **HTTP Client**: Fetch API natif
- **Authentification**: JWT + localStorage

### Structure du projet

```
frontend/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Pages d'authentification
│   │   ├── login/
│   │   ├── register/
│   │   └── setup-2fa/
│   ├── app/               # Pages application (authentifiées)
│   │   ├── dashboard/
│   │   ├── my-sales/
│   │   └── layout.tsx
│   ├── admin/             # Pages administration
│   │   ├── products/
│   │   ├── users/
│   │   └── tenants/
│   ├── profile/           # Pages profil utilisateur
│   │   ├── change-password/
│   │   └── reset-2fa/
│   ├── globals.css
│   └── layout.tsx         # Layout racine
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base (shadcn/ui)
│   ├── theme/            # Composants de thème
│   └── charts/           # Composants de graphiques
├── contexts/             # Contextes React
│   ├── auth-context.tsx
│   └── theme-context.tsx
├── lib/                  # Utilitaires
│   ├── api.ts           # Client API
│   ├── currency.ts      # Formatage des devises
│   └── utils.ts         # Utilitaires généraux
├── types/               # Types TypeScript
│   └── index.ts
└── public/              # Assets statiques
    ├── gestcom-favicon.svg
    └── images/
```

## Pages et Routing

### 🔐 Pages d'authentification (`/`)

#### `/login`
Page de connexion avec 2FA.

**Composants:**
- Formulaire email/password
- Champ code 2FA
- Gestion des erreurs
- Redirection après connexion

**Features:**
- Validation côté client
- Messages d'erreur contextuels
- Remember me (optionnel)
- Lien vers inscription

#### `/register`
Inscription de nouveau tenant.

**Formulaire:**
```typescript
interface RegisterForm {
  tenantName: string;
  tenantSlug: string;
  adminName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
}
```

#### `/setup-2fa`
Configuration initiale du 2FA.

**Features:**
- Affichage QR code
- Instructions de configuration
- Vérification du code
- Redirection vers login

### 🏠 Dashboard (`/app/dashboard`)

Page d'accueil après connexion avec statistiques.

**Widgets:**
- Cartes de statistiques (revenus, ventes, produits, utilisateurs)
- Graphique des revenus par période
- Liste des produits en rupture de stock
- Ventes récentes
- Top produits (pour directeurs)

**Données affichées selon le rôle:**
- **Superadmin**: Statistiques globales + revenus par tenant
- **Directeur**: Statistiques du tenant
- **Autres rôles**: Statistiques limitées

### 📊 Mes Ventes (`/app/my-sales`)

Page des ventes personnelles de l'utilisateur.

**Features:**
- Liste des ventes avec détails
- Graphique des ventes par période
- Statistiques personnelles
- Filtrage par date
- Export des données

### 🛠️ Administration (`/admin`)

#### `/admin/products`
Gestion des produits (MAGASINIER+).

**Features:**
- Liste des produits avec pagination
- Création/modification de produits
- Upload d'images par drag & drop
- Gestion du stock
- Recherche et filtres

**Dialog de création/modification:**
```typescript
interface ProductForm {
  name: string;
  description?: string;
  price: number;
  stock: number;
  sku: string;
  imagePath?: string;
}
```

#### `/admin/users`
Gestion des utilisateurs (DIRECTEUR+).

**Features:**
- Liste des utilisateurs du tenant
- Création d'utilisateurs
- Attribution des rôles
- Gestion des permissions

#### `/admin/tenants`
Gestion des tenants (SUPERADMIN uniquement).

**Features:**
- Liste de tous les tenants
- Création de nouveaux tenants
- Statistiques par tenant

### 👤 Profil (`/profile`)

#### `/profile`
Page de profil utilisateur.

**Informations affichées:**
- Nom, email, rôle
- Tenant d'appartenance
- Statut 2FA
- Boutons d'action (changement mot de passe, reset 2FA)

#### `/profile/change-password`
Changement de mot de passe.

**Formulaire:**
```typescript
interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

#### `/profile/reset-2fa`
Réinitialisation du 2FA.

**Process:**
1. Vérification mot de passe actuel
2. Génération nouveau secret 2FA
3. Affichage QR code
4. Vérification nouveau code

## Composants UI

### 🎨 Composants de base (Shadcn/ui)

#### Button
```typescript
interface ButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
```

#### Input
```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
}
```

#### Dialog
Modales pour création/modification d'entités.

**Structure:**
- DialogTrigger (bouton d'ouverture)
- DialogContent (contenu modal)
- DialogHeader (titre + description)
- DialogFooter (boutons d'action)

### 📁 Composants personnalisés

#### ImageUpload (`/components/ui/image-upload.tsx`)
Composant d'upload d'images par drag & drop.

**Features:**
- Drag & drop natif HTML5
- Clic pour sélectionner
- Prévisualisation en temps réel
- Validation (taille, type)
- Indicateur de chargement
- Gestion d'erreurs

**Props:**
```typescript
interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
}
```

**Utilisation:**
```tsx
<ImageUpload
  value={product.imagePath}
  onChange={(url) => setProduct({...product, imagePath: url})}
  onError={(error) => setError(error)}
  maxSize={5}
  acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
/>
```

#### ThemeCustomizer (`/components/theme/theme-customizer.tsx`)
Sélecteur de thème (clair/sombre).

### 📈 Composants de graphiques

#### RevenueChart
Graphique des revenus par période utilisant une librairie de charts.

**Props:**
```typescript
interface RevenueChartProps {
  data: Array<{
    date: string;
    amount: number;
  }>;
  title?: string;
  height?: number;
}
```

## Contextes React

### 🔐 AuthContext (`/contexts/auth-context.tsx`)

Gestion de l'état d'authentification global.

**État:**
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPERADMIN' | 'DIRECTEUR' | 'GERANT' | 'VENDEUR' | 'MAGASINIER';
  tenantId?: string;
  imagePath?: string;
}
```

**Actions:**
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

**Utilisation:**
```tsx
const { user, isAuthenticated, login, logout } = useAuth();

if (!isAuthenticated) {
  return <LoginPage />;
}
```

### 🎨 ThemeContext (`/contexts/theme-context.tsx`)

Gestion du thème clair/sombre.

**État:**
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}
```

## Utilitaires

### 🌐 Client API (`/lib/api.ts`)

Client HTTP centralisé pour les appels API.

**Configuration:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Gestion spéciale pour FormData (uploads)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Gestion des erreurs et parsing JSON
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur API');
  }

  return response.json();
}
```

**Utilisation:**
```typescript
// GET request
const products = await apiRequest('/products/list');

// POST request
const newProduct = await apiRequest('/products/create', {
  method: 'POST',
  body: JSON.stringify(productData)
});

// Upload de fichier
const formData = new FormData();
formData.append('image', file);
const uploadResult = await apiRequest('/upload/image', {
  method: 'POST',
  body: formData
});
```

### 💰 Formatage des devises (`/lib/currency.ts`)

Utilitaires pour le formatage des montants en XOF et USD.

**Functions:**
```typescript
// Formatage principal en XOF
export const formatXOF = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Formatage secondaire en USD
export const formatUSD = (amount: number): string => {
  const usdAmount = amount / 656; // Taux de change approximatif
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(usdAmount);
};

// Formatage compact pour les grands nombres
export const formatCompactXOF = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
};
```

**Utilisation:**
```tsx
<div className="text-2xl font-bold">
  {formatXOF(product.price)}
  <span className="text-sm text-muted-foreground ml-2">
    ({formatUSD(product.price)})
  </span>
</div>
```

## Styling et Design

### 🎨 TailwindCSS

Configuration personnalisée avec variables CSS pour le thème.

**Couleurs principales:**
```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 98%;
  --accent: 210 40% 96%;
  --destructive: 0 84.2% 60.2%;
}
```

### 🌙 Thème sombre/clair

Basculement automatique avec `next-themes`.

**Classes conditionnelles:**
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Contenu adaptatif au thème
</div>
```

## Gestion des états

### 📊 État local des formulaires

Utilisation de `useState` pour les formulaires simples.

**Pattern typique:**
```tsx
const [formData, setFormData] = useState<ProductForm>({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  sku: '',
  imagePath: ''
});

const [errors, setErrors] = useState<Record<string, string>>({});
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    await apiRequest('/products/create', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    // Success handling
  } catch (error) {
    setErrors({ general: error.message });
  } finally {
    setIsLoading(false);
  }
};
```

### 🔄 Synchronisation des données

Utilisation de `useEffect` pour charger et synchroniser les données.

**Pattern de chargement:**
```tsx
const [data, setData] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/products/list');
      setData(response.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

## Sécurité Frontend

### 🔐 Protection des routes

Vérification de l'authentification dans les layouts.

```tsx
// app/app/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    redirect('/login');
  }

  return <div>{children}</div>;
}
```

### 🛡️ Validation côté client

Validation des formulaires avant envoi.

```typescript
const validateForm = (data: ProductForm): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Le nom est requis';
  }

  if (data.price <= 0) {
    errors.price = 'Le prix doit être positif';
  }

  if (data.stock < 0) {
    errors.stock = 'Le stock ne peut pas être négatif';
  }

  return errors;
};
```

### 🔒 Gestion des tokens

Stockage sécurisé des tokens d'accès.

```typescript
// Stockage du token
localStorage.setItem('accessToken', token);

// Nettoyage à la déconnexion
const logout = () => {
  localStorage.removeItem('accessToken');
  // Redirection vers login
};

// Refresh automatique
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    });
    const { accessToken } = await response.json();
    localStorage.setItem('accessToken', accessToken);
  } catch (error) {
    logout();
  }
};
```

## Performance

### ⚡ Optimisations Next.js

- **App Router** pour un routing optimisé
- **Server Components** par défaut
- **Image optimization** avec `next/image`
- **Font optimization** avec `next/font`

### 🚀 Lazy Loading

Chargement paresseux des composants lourds.

```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

### 📦 Bundle optimization

- Tree shaking automatique
- Code splitting par route
- Compression des assets

## Accessibilité

### ♿ Standards WCAG

- Contraste des couleurs respecté
- Navigation au clavier
- Labels appropriés pour les formulaires
- ARIA attributes pour les composants complexes

### 🎯 Bonnes pratiques

```tsx
// Labels explicites
<label htmlFor="product-name">Nom du produit</label>
<input id="product-name" type="text" />

// ARIA pour les états
<button aria-pressed={isActive} aria-label="Activer le produit">
  {isActive ? 'Actif' : 'Inactif'}
</button>

// Focus management
<dialog ref={dialogRef} onClose={handleClose}>
  <button autoFocus>Premier élément focusable</button>
</dialog>
```
