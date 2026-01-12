import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response.utils';

const prisma = new PrismaClient();

const createProductSchema = z.object({
    name: z.string().min(2),
    sku: z.string().min(3),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    imagePath: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'DRAFT', 'OUT_OF_STOCK']).optional(),
});

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { name, sku, price, stock, imagePath, category, description, status } = createProductSchema.parse(req.body);
        const tenantId = req.user?.tenantId;

        if (!tenantId) {
            return sendError(res, 'Unauthorized', 403);
        }

        const product = await prisma.product.create({
            data: {
                name,
                sku,
                price,
                stock,
                imagePath,
                category,
                description,
                status: status || (stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'),
                tenantId,
                stockMovements: {
                    create: {
                        quantity: stock,
                        reason: 'INITIAL_STOCK',
                    }
                }
            },
        });

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                userId: req.user!.userId,
                action: 'CREATE_PRODUCT',
                resource: 'Product',
                details: { productId: product.id, sku: product.sku },
                ip: req.ip
            }
        });

        sendSuccess(res, 'Product created successfully', product, 201);
    } catch (error: any) {
        sendError(res, 'Error creating product', 400, error);
    }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return sendError(res, 'Unauthorized', 403);
        }

        const products = await prisma.product.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });

        sendSuccess(res, 'Products retrieved successfully', products);
    } catch (error: any) {
        sendError(res, 'Error fetching products', 500, error);
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = req.user?.tenantId;
        const data = req.body;

        const product = await prisma.product.findUnique({ where: { id } });

        if (!product || product.tenantId !== tenantId) {
            return sendError(res, 'Product not found', 404);
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data,
        });

        // Audit Log
        // @ts-ignore
        await prisma.auditLog.create({
            data: {
                userId: req.user!.userId,
                action: 'UPDATE_PRODUCT',
                resource: 'Product',
                details: { productId: id, updates: data },
                ip: req.ip
            }
        });

        sendSuccess(res, 'Product updated successfully', updatedProduct);
    } catch (error: any) {
        sendError(res, 'Error updating product', 400, error);
    }
};
