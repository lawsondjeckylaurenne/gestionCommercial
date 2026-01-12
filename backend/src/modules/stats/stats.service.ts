import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StatsService {
    async getSuperadminStats() {
        try {
            const totalTenants = await prisma.tenant.count();
            const totalUsers = await prisma.user.count();
            const totalSales = await prisma.sale.aggregate({
                _sum: { totalAmount: true },
            });

        // Global revenue by period (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const globalRevenueByPeriod = await prisma.$queryRaw`
            SELECT 
                DATE("createdAt") as date,
                SUM("totalAmount") as amount
            FROM "Sale"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY DATE("createdAt")
        `;

        // Revenue by tenant (top 10)
        const revenueByTenant = await prisma.$queryRaw`
            SELECT 
                t.name as tenant_name,
                t.slug as tenant_slug,
                SUM(s."totalAmount") as revenue,
                COUNT(s.id) as sales_count
            FROM "Sale" s
            JOIN "Tenant" t ON s."tenantId" = t.id
            WHERE s."createdAt" >= ${thirtyDaysAgo}
            GROUP BY t.id, t.name, t.slug
            ORDER BY revenue DESC
            LIMIT 10
        `;

            return {
                totalTenants,
                totalUsers,
                totalRevenue: totalSales._sum.totalAmount || 0,
                revenueByPeriod: (globalRevenueByPeriod as any[]).map(row => ({
                    date: row.date.toISOString().split('T')[0],
                    amount: Number(row.amount)
                })),
                revenueByTenant: (revenueByTenant as any[]).map(row => ({
                    tenantName: row.tenant_name,
                    tenantSlug: row.tenant_slug,
                    revenue: Number(row.revenue),
                    salesCount: Number(row.sales_count)
                }))
            };
        } catch (error) {
            console.error('Error fetching superadmin stats:', error);
            // Return default values if database query fails
            return {
                totalTenants: 0,
                totalUsers: 0,
                totalRevenue: 0,
                revenueByPeriod: [],
                revenueByTenant: []
            };
        }
    }

    async getDirectorStats(tenantId: string) {
        try {
            const totalSalesSum = await prisma.sale.aggregate({
                where: { tenantId },
                _sum: { totalAmount: true },
            });

        const salesCount = await prisma.sale.count({ where: { tenantId } });

        const totalProducts = await prisma.product.count({ where: { tenantId } });
        const totalUsers = await prisma.user.count({ where: { tenantId } });

        const lowStockProducts = await prisma.product.findMany({
            where: { tenantId, stock: { lt: 5 } },
            select: { id: true, name: true, stock: true },
            take: 5
        });

        // Recent sales
        const recentSales = await prisma.sale.findMany({
            where: { tenantId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } },
        });

        // Revenue by period (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const revenueByPeriod = await prisma.$queryRaw`
            SELECT 
                DATE("createdAt") as date,
                SUM("totalAmount") as amount
            FROM "Sale"
            WHERE "tenantId" = ${tenantId} 
            AND "createdAt" >= ${thirtyDaysAgo}
            GROUP BY DATE("createdAt")
            ORDER BY DATE("createdAt")
        `;

        // Top products by sales volume
        const topProducts = await prisma.$queryRaw`
            SELECT 
                p.name,
                COUNT(si.id) as sales_count,
                SUM(si.quantity * si."unitPrice") as revenue
            FROM "SaleItem" si
            JOIN "Sale" s ON si."saleId" = s.id
            JOIN "Product" p ON si."productId" = p.id
            WHERE s."tenantId" = ${tenantId}
            AND s."createdAt" >= ${thirtyDaysAgo}
            GROUP BY p.id, p.name
            ORDER BY sales_count DESC
            LIMIT 5
        `;

            return {
                totalRevenue: totalSalesSum._sum.totalAmount || 0,
                totalSales: salesCount,
                totalProducts,
                totalUsers,
                lowStock: lowStockProducts,
                recentSales,
                revenueByPeriod: (revenueByPeriod as any[]).map(row => ({
                    date: row.date.toISOString().split('T')[0],
                    amount: Number(row.amount)
                })),
                topProducts: (topProducts as any[]).map(row => ({
                    name: row.name,
                    sales: Number(row.sales_count),
                    revenue: Number(row.revenue)
                }))
            };
        } catch (error) {
            console.error('Error fetching director stats:', error);
            // Return default values if database query fails
            return {
                totalRevenue: 0,
                totalSales: 0,
                totalProducts: 0,
                totalUsers: 0,
                lowStock: [],
                recentSales: [],
                revenueByPeriod: [],
                topProducts: []
            };
        }
    }
}
