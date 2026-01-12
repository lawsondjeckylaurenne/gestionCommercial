import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

const ROLE_HIERARCHY = {
    SUPERADMIN: 4,
    DIRECTEUR: 3,
    GERANT: 2,
    VENDEUR: 1,
    MAGASINIER: 1, // Magasinier and Vendeur are parallel but distinct, handled by specific checks if needed
};

export const requireRole = (requiredRole: keyof typeof ROLE_HIERARCHY) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userRole = req.user.role as keyof typeof ROLE_HIERARCHY;

        if (ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]) {
            return next();
        }

        // Special case: Magasinier vs Vendeur if they have same level but different domains
        // For now, hierarchy is simple. If we need specific role check (exact match), we can add another middleware.

        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    };
};

export const requireExactRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Invalid role' });
        }
        next();
    };
};
