import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response.utils';
import { notifyStockUpdate } from '../../utils/socket.utils';

const prisma = new PrismaClient();

const createSaleSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
    })).min(1),
});

export const createSale = async (req: AuthRequest, res: Response) => {
    try {
        const { items } = createSaleSchema.parse(req.body);
        const userId = req.user?.userId;
        const tenantId = req.user?.tenantId;

        if (!userId || !tenantId) {
            return sendError(res, 'User not authenticated', 401);
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // Validate products and check stock
            const productIds = items.map(item => item.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, tenantId },
            });

            if (products.length !== productIds.length) {
                throw new Error('One or more products not found');
            }

            // Check stock availability
            for (const item of items) {
                const product = products.find((p: any) => p.id === item.productId);
                if (!product || product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for product ${product?.name || item.productId}`);
                }
            }

            // Calculate total
            let total = 0;
            for (const item of items) {
                const product = products.find((p: any) => p.id === item.productId);
                total += product!.price * item.quantity;
            }

            // Create sale
            const sale = await tx.sale.create({
                data: {
                    userId,
                    tenantId,
                    totalAmount: total,
                    items: {
                        create: items.map(item => {
                            const product = products.find((p: any) => p.id === item.productId);
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                unitPrice: product!.price,
                            };
                        }),
                    },
                },
                include: {
                    items: true,
                },
            });

            // Update product stock and prepare response
            const responseItems = [];
            for (const saleItem of sale.items) {
                const updatedProduct = await tx.product.update({
                    where: { id: saleItem.productId },
                    data: { stock: { decrement: saleItem.quantity } },
                });

                responseItems.push({
                    id: saleItem.id,
                    quantity: saleItem.quantity,
                    unitPrice: saleItem.unitPrice,
                    productId: saleItem.productId,
                    remainingStock: updatedProduct.stock
                });
            }

            // Create audit log
            await tx.auditLog.create({
                data: {
                    action: 'CREATE_SALE',
                    resource: 'Sale',
                    userId,
                    details: { 
                        saleTotal: total, 
                        itemCount: items.length,
                        entityId: sale.id,
                        tenantId
                    },
                    ip: req.ip,
                },
            });

            return { ...sale, items: responseItems };
        });

        // Emit socket event for real-time stock updates
        for (const item of result.items) {
             notifyStockUpdate(tenantId, item.productId, item.remainingStock);
        }

        sendSuccess(res, 'Sale created successfully', result, 201);
    } catch (error: any) {
        sendError(res, error.message || 'Error processing sale', 400);
    }
};

export const getSales = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) {
            return sendError(res, 'Tenant not found', 400);
        }

        const sales = await prisma.sale.findMany({
            where: { tenantId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        imagePath: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        sendSuccess(res, 'Sales retrieved successfully', sales);
    } catch (error: any) {
        sendError(res, error.message || 'Error retrieving sales', 500);
    }
};
