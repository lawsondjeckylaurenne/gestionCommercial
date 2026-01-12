import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateTokens } from '../../utils/jwt.utils';
import speakeasy from 'speakeasy';

const prisma = new PrismaClient();

export class AuthService {
    async register(data: any) {
        const { email, password, name, role, tenantId } = data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new Error('User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: role || 'VENDEUR', tenantId },
        });

        const tokens = generateTokens(user.id, user.role, user.tenantId);
        return { ...tokens, user: { id: user.id, email: user.email, role: user.role, imagePath: user.imagePath } };
    }

    async login(data: any) {
        const { email, password, twoFactorToken } = data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('Invalid credentials');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new Error('Invalid credentials');

        // 2FA is mandatory for SUPERADMIN and DIRECTEUR
        const requires2FA = user.role === 'SUPERADMIN' || user.role === 'DIRECTEUR' || user.is2FAEnabled;

        if (requires2FA) {
            if (!user.is2FAEnabled) {
                return { require2FASetup: true, userId: user.id };
            }

            if (!twoFactorToken) return { require2FA: true, userId: user.id };

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret!,
                encoding: 'base32',
                token: twoFactorToken,
                window: 2
            });

            if (!verified) throw new Error('Invalid 2FA token');
        }

        const tokens = generateTokens(user.id, user.role, user.tenantId);
        return { ...tokens, user: { id: user.id, email: user.email, role: user.role, imagePath: user.imagePath } };
    }

    async setup2FA(userId: string) {
        const secret = speakeasy.generateSecret({ name: 'SaaS Gestion Commerciale' });
        await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret.base32 } });
        return { secret: secret.base32, otpauth_url: secret.otpauth_url };
    }

    async verify2FA(userId: string, token: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) throw new Error('2FA not initialized');

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
        });

        if (!verified) throw new Error('Invalid token');

        await prisma.user.update({ where: { id: userId }, data: { is2FAEnabled: true } });
        return true;
    }
}
