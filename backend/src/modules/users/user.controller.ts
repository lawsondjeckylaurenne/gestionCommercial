import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response.utils';

const prisma = new PrismaClient();

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional(),
    role: z.enum(['GERANT', 'VENDEUR', 'MAGASINIER']),
    imagePath: z.string().optional(),
});

export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, name, role, imagePath } = createUserSchema.parse(req.body);
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return sendError(res, 'Unauthorized', 403);
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return sendError(res, 'User already exists', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                imagePath,
                tenantId,
            },
        });

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                userId: req.user!.userId,
                action: 'CREATE_USER',
                resource: 'User',
                details: { createdUserId: user.id, role: user.role },
                ip: req.ip
            }
        });

        sendSuccess(res, 'User created successfully', { user: { id: user.id, email: user.email, role: user.role } }, 201);
    } catch (error: any) {
        sendError(res, 'Error creating user', 400, error);
    }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId, role } = req.user!;

        // If Superadmin, return all users with tenant info
        if (role === 'SUPERADMIN') {
            const users = await prisma.user.findMany({
                select: { 
                    id: true, 
                    email: true, 
                    name: true, 
                    role: true, 
                    imagePath: true, 
                    createdAt: true,
                    tenant: {
                        select: { name: true }
                    }
                }
            });
            return sendSuccess(res, 'All users retrieved successfully', users);
        }

        if (!tenantId) {
            return sendError(res, 'Unauthorized', 403);
        }

        const users = await prisma.user.findMany({
            where: { tenantId },
            select: { id: true, email: true, name: true, role: true, imagePath: true, createdAt: true }
        });

        sendSuccess(res, 'Users retrieved successfully', users);
    } catch (error: any) {
        sendError(res, 'Error fetching users', 500, error);
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;

        const user = await prisma.user.findUnique({ where: { id } });

        if (!user || user.tenantId !== tenantId) {
            return sendError(res, 'User not found', 404);
        }

        // Prevent deleting self or higher roles (though middleware handles role check, logic check is good)
        if (user.id === req.user?.userId) {
            return sendError(res, 'Cannot delete yourself', 400);
        }

        await prisma.user.delete({ where: { id } });

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                userId: req.user!.userId,
                action: 'DELETE_USER',
                resource: 'User',
                details: { deletedUserId: id },
                ip: req.ip
            }
        });

        sendSuccess(res, 'User deleted successfully');
    } catch (error: any) {
        sendError(res, 'Error deleting user', 500, error);
    }
};
