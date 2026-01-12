import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TwoFAService {
    generateSecret(userEmail: string, appName: string = 'SaaS Gestion Commerciale') {
        const secret = speakeasy.generateSecret({
            name: userEmail,
            issuer: appName,
            length: 32
        });

        return {
            secret: secret.base32,
            otpauthUrl: secret.otpauth_url
        };
    }

    async generateQRCode(otpauthUrl: string): Promise<string> {
        try {
            return await QRCode.toDataURL(otpauthUrl);
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }

    verifyToken(secret: string, token: string): boolean {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2 // Allow 2 time steps (60 seconds) tolerance
        });
    }

    async enable2FA(userId: string, secret: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                is2FAEnabled: true,
                twoFactorSecret: secret
            }
        });
    }

    async disable2FA(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                is2FAEnabled: false,
                twoFactorSecret: null
            }
        });
    }

    async getUserSecret(userId: string): Promise<string | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true }
        });

        return user?.twoFactorSecret || null;
    }

    async isUser2FAEnabled(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { is2FAEnabled: true }
        });

        return user?.is2FAEnabled || false;
    }
}
