import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TwoFAService } from './twofa.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response.utils';
import { z } from 'zod';

const prisma = new PrismaClient();

const twoFAService = new TwoFAService();

const verifyTokenSchema = z.object({
    token: z.string().length(6, 'Token must be 6 digits')
});

const initialSetupSchema = z.object({
    userId: z.string().uuid('Invalid user ID')
});

const initialVerifySchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    token: z.string().length(6, 'Token must be 6 digits')
});

const verifyPasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required')
});

export const setup2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, is2FAEnabled: true }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        if (user.is2FAEnabled) {
            return sendError(res, '2FA is already enabled', 400);
        }

        const { secret, otpauthUrl } = twoFAService.generateSecret(user.email);
        
        if (!otpauthUrl) {
            return sendError(res, 'Failed to generate 2FA URL', 500);
        }
        
        const qrCode = await twoFAService.generateQRCode(otpauthUrl);

        // Store secret temporarily (not enabled yet)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        sendSuccess(res, '2FA setup initiated', {
            secret,
            qrCode,
            manualEntryKey: secret
        });
    } catch (error: any) {
        sendError(res, 'Error setting up 2FA', 500, error);
    }
};

export const verify2FASetup = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { token } = verifyTokenSchema.parse(req.body);

        const secret = await twoFAService.getUserSecret(userId);
        if (!secret) {
            return sendError(res, '2FA setup not initiated', 400);
        }

        const isValid = twoFAService.verifyToken(secret, token);
        if (!isValid) {
            return sendError(res, 'Invalid token', 400);
        }

        // Enable 2FA
        await twoFAService.enable2FA(userId, secret);

        sendSuccess(res, '2FA enabled successfully');
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, 'Error verifying 2FA setup', 500, error);
    }
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { token } = verifyTokenSchema.parse(req.body);

        const secret = await twoFAService.getUserSecret(userId);
        if (!secret) {
            return sendError(res, '2FA is not enabled', 400);
        }

        const isValid = twoFAService.verifyToken(secret, token);
        if (!isValid) {
            return sendError(res, 'Invalid token', 400);
        }

        await twoFAService.disable2FA(userId);

        sendSuccess(res, '2FA disabled successfully');
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, 'Error disabling 2FA', 500, error);
    }
};

export const verify2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { token } = verifyTokenSchema.parse(req.body);

        const secret = await twoFAService.getUserSecret(userId);
        if (!secret) {
            return sendError(res, '2FA is not enabled', 400);
        }

        const isValid = twoFAService.verifyToken(secret, token);
        if (!isValid) {
            return sendError(res, 'Invalid token', 400);
        }

        sendSuccess(res, 'Token verified successfully');
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, 'Error verifying 2FA token', 500, error);
    }
};

export const initialSetup2FA = async (req: Request, res: Response) => {
    try {
        const { userId } = initialSetupSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, is2FAEnabled: true, role: true }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Only allow for SUPERADMIN and DIRECTEUR who don't have 2FA enabled yet
        if (user.role !== 'SUPERADMIN' && user.role !== 'DIRECTEUR') {
            return sendError(res, 'Unauthorized', 403);
        }

        if (user.is2FAEnabled) {
            return sendError(res, '2FA is already enabled', 400);
        }

        const { secret, otpauthUrl } = twoFAService.generateSecret(user.email);
        
        if (!otpauthUrl) {
            return sendError(res, 'Failed to generate 2FA URL', 500);
        }
        
        const qrCode = await twoFAService.generateQRCode(otpauthUrl);

        // Store secret temporarily (not enabled yet)
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        sendSuccess(res, '2FA initial setup initiated', {
            secret,
            qrCodeUrl: qrCode
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, error.message, 500, error);
    }
};

export const initialVerify2FASetup = async (req: Request, res: Response) => {
    try {
        const { userId, token } = initialVerifySchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, twoFactorSecret: true, is2FAEnabled: true, role: true }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Only allow for SUPERADMIN and DIRECTEUR
        if (user.role !== 'SUPERADMIN' && user.role !== 'DIRECTEUR') {
            return sendError(res, 'Unauthorized', 403);
        }

        if (user.is2FAEnabled) {
            return sendError(res, '2FA is already enabled', 400);
        }

        if (!user.twoFactorSecret) {
            return sendError(res, '2FA setup not initiated', 400);
        }

        const isValid = twoFAService.verifyToken(user.twoFactorSecret, token);
        if (!isValid) {
            return sendError(res, 'Invalid verification code', 400);
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: { is2FAEnabled: true }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'ENABLE_2FA',
                resource: 'User',
                details: { method: 'initial_setup' },
                ip: (req as any).ip || 'unknown'
            }
        });

        sendSuccess(res, '2FA enabled successfully');
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, error.message, 500, error);
    }
};

export const reset2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { currentPassword } = verifyPasswordSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, password: true, is2FAEnabled: true }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        if (!user.is2FAEnabled) {
            return sendError(res, '2FA is not enabled', 400);
        }

        // Verify current password for security
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return sendError(res, 'Invalid current password', 400);
        }

        // Generate new 2FA secret
        const { secret, otpauthUrl } = twoFAService.generateSecret(user.email);
        
        if (!otpauthUrl) {
            return sendError(res, 'Failed to generate 2FA URL', 500);
        }
        
        const qrCode = await twoFAService.generateQRCode(otpauthUrl);

        // Update user with new secret but keep 2FA disabled until verification
        await prisma.user.update({
            where: { id: userId },
            data: { 
                twoFactorSecret: secret,
                is2FAEnabled: false
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'RESET_2FA',
                resource: 'User',
                details: { method: 'password_verification' },
                ip: (req as any).ip || 'unknown'
            }
        });

        sendSuccess(res, '2FA reset initiated', {
            secret,
            qrCodeUrl: qrCode
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, error.message, 500, error);
    }
};

export const get2FAStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { is2FAEnabled: true }
        });
        
        if (!user) {
            return sendError(res, 'User not found', 404);
        }
        
        sendSuccess(res, '2FA status retrieved', { is2FAEnabled: user.is2FAEnabled });
    } catch (error: any) {
        sendError(res, error.message, 500, error);
    }
};
