import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response.utils';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
    imagePath: z.string().url('Invalid image URL').optional().or(z.literal(''))
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                imagePath: true,
                is2FAEnabled: true,
                createdAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        sendSuccess(res, 'Profile retrieved successfully', user);
    } catch (error: any) {
        sendError(res, 'Error retrieving profile', 500, error);
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { name, email, currentPassword, newPassword, imagePath } = updateProfileSchema.parse(req.body);

        // Get current user data
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, password: true }
        });

        if (!currentUser) {
            return sendError(res, 'User not found', 404);
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== currentUser.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return sendError(res, 'Email already in use', 400);
            }
        }

        // Handle password change
        let hashedNewPassword;
        if (newPassword) {
            if (!currentPassword) {
                return sendError(res, 'Current password is required to change password', 400);
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
            if (!isCurrentPasswordValid) {
                return sendError(res, 'Current password is incorrect', 400);
            }

            hashedNewPassword = await bcrypt.hash(newPassword, 10);
        }

        // Update user profile
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (hashedNewPassword) updateData.password = hashedNewPassword;
        if (imagePath !== undefined) updateData.imagePath = imagePath || null;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                imagePath: true,
                is2FAEnabled: true,
                createdAt: true,
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                }
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE_PROFILE',
                resource: 'User',
                details: {
                    updatedFields: Object.keys(updateData),
                    passwordChanged: !!hashedNewPassword
                },
                ip: req.ip
            }
        });

        sendSuccess(res, 'Profile updated successfully', updatedUser);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, 'Error updating profile', 500, error);
    }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { imagePath } = req.body;

        if (!imagePath) {
            return sendError(res, 'Image path is required', 400);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { imagePath },
            select: {
                id: true,
                email: true,
                name: true,
                imagePath: true
            }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'UPDATE_PROFILE_IMAGE',
                resource: 'User',
                details: { imagePath },
                ip: req.ip
            }
        });

        sendSuccess(res, 'Profile image updated successfully', updatedUser);
    } catch (error: any) {
        sendError(res, 'Error updating profile image', 500, error);
    }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.user!;
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, password: true, email: true }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return sendError(res, 'Current password is incorrect', 400);
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'CHANGE_PASSWORD',
                resource: 'User',
                details: { email: user.email },
                ip: (req as any).ip || 'unknown'
            }
        });

        sendSuccess(res, 'Password changed successfully');
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, 'Error changing password', 500, error);
    }
};
