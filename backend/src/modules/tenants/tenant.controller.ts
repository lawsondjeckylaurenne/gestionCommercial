import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { sendSuccess, sendError } from '../../utils/response.utils';
import { AuthRequest } from '../../middleware/auth.middleware';

const prisma = new PrismaClient();

const createTenantSchema = z.object({
    name: z.string().min(3),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    adminEmail: z.string().email(),
    adminPassword: z.string().min(6),
    adminName: z.string().optional(),
});

export const createTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { name, slug, adminEmail, adminPassword, adminName } = createTenantSchema.parse(req.body);

        const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
        if (existingTenant) {
            return sendError(res, 'Tenant slug already exists', 400);
        }

        const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (existingUser) {
            return sendError(res, 'Admin email already exists', 400);
        }

        // Transaction to create Tenant and Admin User
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: { name, slug },
            });

            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const user = await tx.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: adminName,
                    role: 'DIRECTEUR',
                    tenantId: tenant.id,
                },
            });

            // Audit Log
            // @ts-ignore
            await tx.auditLog.create({
                data: {
                    userId: req.user!.userId,
                    action: 'CREATE_TENANT',
                    resource: 'Tenant',
                    details: { tenantId: tenant.id, name: tenant.name },
                    ip: req.ip
                }
            });

            return { tenant, user };
        });

        sendSuccess(res, 'Tenant created successfully', { 
            tenant: result.tenant, 
            admin: { 
                id: result.user.id, 
                email: result.user.email,
                role: result.user.role,
                imagePath: result.user.imagePath 
            } 
        }, 201);
    } catch (error: any) {
        console.error('Create Tenant Error:', JSON.stringify(error, null, 2));
        if (error instanceof z.ZodError) {
             return sendError(res, 'Validation failed', 400, error.errors);
        }
        sendError(res, 'Error creating tenant', 400, error);
    }
};

export const getTenants = async (req: Request, res: Response) => {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                users: {
                    where: { role: 'DIRECTEUR' },
                    take: 1,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        imagePath: true,
                    },
                },
                _count: {
                    select: { users: true, products: true, sales: true }
                }
            }
        });
        sendSuccess(res, 'Tenants retrieved successfully', tenants);
    } catch (error: any) {
        sendError(res, 'Error fetching tenants', 500, error);
    }
};
