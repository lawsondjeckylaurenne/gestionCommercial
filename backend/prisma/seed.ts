import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Superadmin
    const superadminEmail = 'superadmin@gestcom.com';
    const superadminPassword = await bcrypt.hash('SuperAdmin123!', 12);

    const superadmin = await prisma.user.upsert({
        where: { email: superadminEmail },
        update: {},
        create: {
            email: superadminEmail,
            password: superadminPassword,
            name: 'Super Admin',
            role: Role.SUPERADMIN,
            is2FAEnabled: true, // 2FA enabled for security
            twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Example secret for testing
        },
    });
    console.log('✅ Superadmin created:', { email: superadmin.email, name: superadmin.name });

    // 2. Create Tenant 1 (Test Tenant)
    const tenant1 = await prisma.tenant.upsert({
        where: { slug: 'tenant1' },
        update: {},
        create: {
            name: 'Tenant 1 - Boutique Test',
            slug: 'tenant1',
        },
    });

    const director1Password = await bcrypt.hash('Director123!', 12);
    const director1 = await prisma.user.upsert({
        where: { email: 'director@tenant1.com' },
        update: {},
        create: {
            email: 'director@tenant1.com',
            password: director1Password,
            name: 'Jean Directeur',
            role: Role.DIRECTEUR,
            tenantId: tenant1.id,
            is2FAEnabled: true,
            twoFactorSecret: 'JBSWY3DPEHPK3PXQ', // Different secret for testing
        },
    });
    console.log('✅ Tenant 1 created:', { name: tenant1.name, slug: tenant1.slug });
    console.log('✅ Director 1 created:', { email: director1.email, name: director1.name });

    // 3. Create Products for Tenant 1
    const products = [
        {
            name: 'iPhone 15 Pro',
            sku: 'IPHONE-15-PRO',
            price: 1199.99,
            stock: 25,
            category: 'Smartphones',
            description: 'Dernier iPhone avec puce A17 Pro',
            status: 'ACTIVE'
        },
        {
            name: 'MacBook Pro M3',
            sku: 'MBP-M3-14',
            price: 2199.99,
            stock: 15,
            category: 'Ordinateurs',
            description: 'MacBook Pro 14" avec puce M3',
            status: 'ACTIVE'
        },
        {
            name: 'AirPods Pro 2',
            sku: 'AIRPODS-PRO-2',
            price: 279.99,
            stock: 50,
            category: 'Audio',
            description: 'Écouteurs sans fil avec réduction de bruit',
            status: 'ACTIVE'
        },
        {
            name: 'iPad Air M2',
            sku: 'IPAD-AIR-M2',
            price: 699.99,
            stock: 30,
            category: 'Tablettes',
            description: 'iPad Air avec puce M2 et écran 10.9"',
            status: 'ACTIVE'
        },
        {
            name: 'Apple Watch Series 9',
            sku: 'WATCH-S9-45MM',
            price: 449.99,
            stock: 0, // Out of stock for testing
            category: 'Montres',
            description: 'Apple Watch Series 9 45mm',
            status: 'OUT_OF_STOCK'
        }
    ];

    for (const productData of products) {
        await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant1.id, sku: productData.sku } },
            update: {},
            create: {
                ...productData,
                tenantId: tenant1.id,
            },
        });
    }
    console.log('✅ Products created:', products.length, 'items');

    // 4. Create additional users for Tenant 1
    const users = [
        {
            email: 'vendeur@tenant1.com',
            password: await bcrypt.hash('Vendeur123!', 12),
            name: 'Paul Vendeur',
            role: Role.VENDEUR,
            is2FAEnabled: true,
            twoFactorSecret: 'JBSWY3DPEHPK3PXR'
        },
        {
            email: 'gerant@tenant1.com',
            password: await bcrypt.hash('Gerant123!', 12),
            name: 'Sophie Gérant',
            role: Role.GERANT,
            is2FAEnabled: true,
            twoFactorSecret: 'JBSWY3DPEHPK3PXS'
        },
        {
            email: 'magasinier@tenant1.com',
            password: await bcrypt.hash('Magasinier123!', 12),
            name: 'Marc Magasinier',
            role: Role.MAGASINIER,
            is2FAEnabled: true,
            twoFactorSecret: 'JBSWY3DPEHPK3PXT'
        }
    ];

    for (const userData of users) {
        await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                ...userData,
                tenantId: tenant1.id,
            },
        });
    }
    console.log('✅ Additional users created:', users.length, 'users');

    // 5. Create sample sales for Tenant 1
    const sampleSales = [
        {
            totalAmount: 1479.98, // iPhone + AirPods
            userId: director1.id,
            items: [
                { productSku: 'IPHONE-15-PRO', quantity: 1, unitPrice: 1199.99 },
                { productSku: 'AIRPODS-PRO-2', quantity: 1, unitPrice: 279.99 }
            ]
        },
        {
            totalAmount: 2199.99, // MacBook
            userId: director1.id,
            items: [
                { productSku: 'MBP-M3-14', quantity: 1, unitPrice: 2199.99 }
            ]
        },
        {
            totalAmount: 1399.98, // iPad + AirPods
            userId: director1.id,
            items: [
                { productSku: 'IPAD-AIR-M2', quantity: 1, unitPrice: 699.99 },
                { productSku: 'AIRPODS-PRO-2', quantity: 1, unitPrice: 279.99 }
            ]
        }
    ];

    for (const saleData of sampleSales) {
        const sale = await prisma.sale.create({
            data: {
                totalAmount: saleData.totalAmount,
                tenantId: tenant1.id,
                userId: saleData.userId,
                status: 'COMPLETED'
            }
        });

        for (const item of saleData.items) {
            const product = await prisma.product.findFirst({
                where: { 
                    sku: item.productSku,
                    tenantId: tenant1.id 
                }
            });

            if (product) {
                await prisma.saleItem.create({
                    data: {
                        saleId: sale.id,
                        productId: product.id,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice
                    }
                });

                // Update stock
                await prisma.product.update({
                    where: { id: product.id },
                    data: {
                        stock: {
                            decrement: item.quantity
                        }
                    }
                });

                // Create stock movement
                await prisma.stockMovement.create({
                    data: {
                        productId: product.id,
                        quantity: -item.quantity,
                        reason: 'SALE'
                    }
                });
            }
        }
    }
    console.log('✅ Sample sales created:', sampleSales.length, 'sales');

    console.log('🎉 Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });