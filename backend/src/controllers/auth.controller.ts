import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateTokens, setAuthCookies } from '../utils/jwt.utils';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const prisma = new PrismaClient();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    role: z.enum(['SUPERADMIN', 'DIRECTEUR', 'GERANT', 'VENDEUR', 'MAGASINIER']).optional(),
    tenantId: z.string().optional(), // Only for non-superadmin
});

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, tenantId } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'VENDEUR',
                tenantId,
            },
        });

        const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.tenantId);
        setAuthCookies(res, accessToken, refreshToken);

        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(400).json({ message: 'Error registering user', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password, twoFactorToken } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.is2FAEnabled) {
            if (!twoFactorToken) {
                return res.json({ message: '2FA required', require2FA: true, userId: user.id });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret!,
                encoding: 'base32',
                token: twoFactorToken,
            });

            if (!verified) {
                return res.status(401).json({ message: 'Invalid 2FA token' });
            }
        }

        const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.tenantId);
        setAuthCookies(res, accessToken, refreshToken);

        res.json({ message: 'Login successful', user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

export const setup2FA = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.userId;

    const secret = speakeasy.generateSecret({ name: 'SaaS Gestion Commerciale' });

    await prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret.base32 },
    });

    qrcode.toDataURL(secret.otpauth_url!, (err, data_url) => {
        if (err) {
            return res.status(500).json({ message: 'Error generating QR code' });
        }
        res.json({ message: '2FA setup initiated', secret: secret.base32, qrCode: data_url });
    });
};

export const verify2FA = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.userId;
    const { token } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.twoFactorSecret) {
        return res.status(400).json({ message: '2FA not initialized' });
    }

    const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
    });

    if (verified) {
        await prisma.user.update({
            where: { id: userId },
            data: { is2FAEnabled: true },
        });
        res.json({ message: '2FA enabled successfully' });
    } else {
        res.status(400).json({ message: 'Invalid token' });
    }
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};
