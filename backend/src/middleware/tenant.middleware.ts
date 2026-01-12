import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'SUPERADMIN') {
        // Superadmin bypasses tenant check for global operations
        return next();
    }

    if (!req.user.tenantId) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    next();
};

export const ensureTenantIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // For SUPERADMIN, allow access but log the action for audit
    if (req.user.role === 'SUPERADMIN') {
        return next();
    }

    // For all other roles, ensure they have a tenantId
    if (!req.user.tenantId) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    // Add tenant context to request for controllers to use
    req.tenantId = req.user.tenantId;
    next();
};

export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

// Middleware to prevent cross-tenant data access
export const validateTenantAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // SUPERADMIN can access any tenant's data
    if (req.user.role === 'SUPERADMIN') {
        return next();
    }

    // For tenant-specific operations, ensure user belongs to the tenant
    const requestedTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
    
    if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
        return res.status(403).json({ message: 'Unauthorized: Cannot access other tenant data' });
    }

    next();
};
