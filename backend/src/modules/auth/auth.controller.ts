import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { setAuthCookies } from '../../utils/jwt.utils';
import { z } from 'zod';
import qrcode from 'qrcode';
import speakeasy from 'speakeasy';
import { sendSuccess, sendError } from '../../utils/response.utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const authService = new AuthService();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    role: z.enum(['SUPERADMIN', 'DIRECTEUR', 'GERANT', 'VENDEUR', 'MAGASINIER']).optional(),
    tenantId: z.string().optional(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);
        const { accessToken, refreshToken, user } = await authService.register(data);
        setAuthCookies(res, accessToken, refreshToken);

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'REGISTER',
                resource: 'User',
                details: { email: user.email, role: user.role },
                ip: req.ip
            }
        });

        sendSuccess(res, 'User created successfully', { user, accessToken }, 201);
    } catch (error: any) {
        sendError(res, error.message, 400);
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const result = await authService.login(req.body);

        if (result.require2FA) {
            return sendSuccess(res, '2FA required', { require2FA: true, userId: result.userId });
        }

        if (result.require2FASetup) {
            return sendSuccess(res, '2FA setup required', { require2FASetup: true, userId: result.userId });
        }

        // @ts-ignore
        setAuthCookies(res, result.accessToken, result.refreshToken);

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                // @ts-ignore
                userId: result.user.id,
                action: 'LOGIN',
                resource: 'Auth',
                ip: req.ip
            }
        });

        // @ts-ignore
        sendSuccess(res, 'Login successful', { user: result.user, accessToken: result.accessToken });
    } catch (error: any) {
        sendError(res, error.message, 401);
    }
};

export const setup2FA = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const result = await authService.setup2FA(req.user.userId);

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                // @ts-ignore
                userId: req.user.userId,
                action: 'SETUP_2FA',
                resource: 'Auth',
                ip: req.ip
            }
        });

        qrcode.toDataURL(result.otpauth_url!, (err, data_url) => {
            if (err) throw err;
            sendSuccess(res, '2FA setup initiated', { secret: result.secret, qrCode: data_url });
        });
    } catch (error: any) {
        sendError(res, error.message, 500);
    }
};

export const verify2FA = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        await authService.verify2FA(req.user.userId, req.body.token);

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                // @ts-ignore
                userId: req.user.userId,
                action: 'ENABLE_2FA',
                resource: 'Auth',
                ip: req.ip
            }
        });

        sendSuccess(res, '2FA enabled successfully');
    } catch (error: any) {
        sendError(res, error.message, 400);
    }
};

export const get2FAStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { is2FAEnabled: true, role: true }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        const isRequired = user.role === 'SUPERADMIN' || user.role === 'DIRECTEUR';

        sendSuccess(res, '2FA status retrieved', { 
            enabled: user.is2FAEnabled,
            required: isRequired
        });
    } catch (error: any) {
        sendError(res, 'Error getting 2FA status', 500, error);
    }
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { token } = req.body;

        if (!token) {
            return sendError(res, 'Token is required', 400);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, role: true, is2FAEnabled: true }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Prevent disabling 2FA for SUPERADMIN and DIRECTEUR (mandatory)
        if (user.role === 'SUPERADMIN' || user.role === 'DIRECTEUR') {
            return sendError(res, '2FA cannot be disabled for your role', 403);
        }

        if (!user.is2FAEnabled || !user.twoFactorSecret) {
            return sendError(res, '2FA is not enabled', 400);
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2
        });

        if (!verified) {
            return sendError(res, 'Invalid token', 400);
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                is2FAEnabled: false,
                twoFactorSecret: null
            }
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'DISABLE_2FA',
                resource: 'Auth',
                ip: req.ip
            }
        });

        sendSuccess(res, '2FA disabled successfully');
    } catch (error: any) {
        sendError(res, 'Error disabling 2FA', 500, error);
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    sendSuccess(res, 'Logged out successfully');
};
