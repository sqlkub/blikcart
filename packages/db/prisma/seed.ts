import { PrismaClient, AccountType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2026!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@blikcart.nl' },
    update: {},
    create: {
      email: 'admin@blikcart.nl',
      passwordHash: adminPassword,
      fullName: 'Blikcart Admin',
      accountType: AccountType.admin,
      isApproved: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Demo wholesale user
  const wsPassword = await bcrypt.hash('Wholesale@2026!', 12);
  const wsUser = await prisma.user.upsert({
    where: { email: 'buyer@equestrian-demo.nl' },
    update: {},
    create: {
      email: 'buyer@equestrian-demo.nl',
      passwordHash: wsPassword,
      fullName: 'Demo Buyer',
      companyName: 'Equestrian Demo BV',
      vatNumber: 'NL123456789B01',
      accountType: AccountType.wholesale,
      wholesaleTier: 'silver',
      isApproved: true,
    },
  });
  console.log(`✅ Wholesale user: ${wsUser.email}`);

  // Categories
  const horsesCat = await prisma.category.upsert({
    where: { slug: 'for-horses' },
    update: {},
    create: {
      slug: 'for-horses',
      name: 'For Horses',
      description: 'Premium saddlery for horses',
      sortOrder: 1,
    },
  });

  const bridleCat = await prisma.category.upsert({
    where: { slug: 'bridles' },
    update: {},
    create: {
      slug: 'bridles',
      name: 'Bridles',
      description: 'Handcrafted leather bridles',
      parentId: horsesCat.id,
      isCustomizable: true,
      sortOrder: 1,
      imageUrl: '/images/categories/bridles.jpg',
    },
  });

  const browbandCat = await prisma.category.upsert({
    where: { slug: 'browbands' },
    update: {},
    create: {
      slug: 'browbands',
      name: 'Browbands',
      description: 'Decorative and functional browbands',
      parentId: horsesCat.id,
      isCustomizable: true,
      sortOrder: 2,
    },
  });

  const halterCat = await prisma.category.upsert({
    where: { slug: 'halters' },
    update: {},
    create: {
      slug: 'halters',
      name: 'Halters',
      description: 'Durable leather halters',
      parentId: horsesCat.id,
      isCustomizable: true,
      sortOrder: 3,
    },
  });

  console.log('✅ Categories created');

  // Products
  const bridle1 = await prisma.product.upsert({
    where: { slug: 'classic-padded-bridle' },
    update: {},
    create: {
      categoryId: bridleCat.id,
      slug: 'classic-padded-bridle',
      sku: 'BR-001',
      name: 'Classic Padded Bridle',
      description: 'Our best-selling bridle with premium padding for comfort. Available in multiple colors and materials.',
      basePrice: 38,
      wholesalePrice: 28,
      moq: 5,
      isCustomizable: true,
      weightGrams: 450,
      leadTimeDays: 21,
      tags: ['leather', 'padded', 'bestseller'],
    },
  });

  await prisma.productImage.createMany({
    skipDuplicates: true,
    data: [
      { productId: bridle1.id, url: '/images/products/classic-bridle-black.jpg', altText: 'Classic Padded Bridle Black', isPrimary: true, sortOrder: 0 },
      { productId: bridle1.id, url: '/images/products/classic-bridle-brown.jpg', altText: 'Classic Padded Bridle Brown', sortOrder: 1 },
    ],
  });

  await prisma.productVariant.createMany({
    skipDuplicates: true,
    data: [
      { productId: bridle1.id, sku: 'BR-001-PONY-BLK', size: 'Pony', color: 'Black', material: 'Full Grain Leather', stockQty: 50 },
      { productId: bridle1.id, sku: 'BR-001-COB-BLK', size: 'Cob', color: 'Black', material: 'Full Grain Leather', stockQty: 75 },
      { productId: bridle1.id, sku: 'BR-001-FULL-BLK', size: 'Full', color: 'Black', material: 'Full Grain Leather', stockQty: 100 },
      { productId: bridle1.id, sku: 'BR-001-FULL-BRN', size: 'Full', color: 'Brown Havana', material: 'Full Grain Leather', stockQty: 60 },
    ],
  });

  const bridle2 = await prisma.product.upsert({
    where: { slug: 'center-line-bridle' },
    update: {},
    create: {
      categoryId: bridleCat.id,
      slug: 'center-line-bridle',
      sku: 'BR-002',
      name: 'Center Line Dressage Bridle',
      description: 'Elegant dressage bridle with anatomical headpiece for maximum comfort during competition.',
      basePrice: 52,
      wholesalePrice: 38,
      moq: 5,
      isCustomizable: true,
      weightGrams: 480,
      leadTimeDays: 21,
      tags: ['dressage', 'anatomical', 'competition'],
    },
  });

  const browband1 = await prisma.product.upsert({
    where: { slug: 'crystal-browband-swarovski' },
    update: {},
    create: {
      categoryId: browbandCat.id,
      slug: 'crystal-browband-swarovski',
      sku: 'BB-001',
      name: 'Crystal Swarovski Browband',
      description: 'Stunning browband with genuine Swarovski crystals.',
      basePrice: 24,
      wholesalePrice: 16,
      moq: 10,
      isCustomizable: true,
      weightGrams: 120,
      leadTimeDays: 14,
      tags: ['swarovski', 'crystal', 'competition'],
    },
  });

  console.log('✅ Products created');

  // Configurator schema for bridles
  const bridleSchema = await prisma.configuratorSchema.upsert({
    where: { categoryId: bridleCat.id },
    update: {},
    create: {
      categoryId: bridleCat.id,
      basePrice: 38,
      moq: 5,
      leadTimeStandardDays: 21,
      leadTimeExpressDays: 10,
      expressPriceMultiplier: 1.25,
    },
  });

  const schemaVersion = await prisma.schemaVersion.create({
    data: {
      schemaId: bridleSchema.id,
      versionNumber: 1,
      notes: 'Initial bridle configurator',
      steps: [
        {
          id: 'base_style',
          order: 1,
          title: 'Choose Style',
          description: 'Select your bridle style',
          ui_type: 'image_card_grid',
          required: true,
          options: [
            { id: 'classic_padded', label: 'Classic Padded', price_modifier: 0, image: '/config/bridle-classic.jpg' },
            { id: 'center_line', label: 'Center Line', price_modifier: 5, image: '/config/bridle-centerline.jpg' },
            { id: 'dura_drop', label: 'Dura Drop', price_modifier: 3, image: '/config/bridle-duradrop.jpg' },
            { id: 'serenade', label: 'Serenade', price_modifier: 8, image: '/config/bridle-serenade.jpg' },
          ],
        },
        {
          id: 'material',
          order: 2,
          title: 'Choose Material',
          description: 'Select your preferred leather',
          ui_type: 'image_card_grid',
          required: true,
          options: [
            { id: 'full_grain', label: 'Full Grain Leather', price_modifier: 0, description: 'Traditional premium leather', image: '/config/mat-full-grain.jpg' },
            { id: 'bio_leather', label: 'Bio Leather', price_modifier: 4, description: 'Eco-certified tanning process', image: '/config/mat-bio.jpg' },
            { id: 'patent', label: 'Patent Leather', price_modifier: 6, description: 'High-gloss finish', image: '/config/mat-patent.jpg' },
          ],
        },
        {
          id: 'color_primary',
          order: 3,
          title: 'Choose Color',
          description: 'Select primary leather color',
          ui_type: 'swatch',
          required: true,
          options: [
            { id: 'black', label: 'Black', price_modifier: 0, color_hex: '#1a1a1a' },
            { id: 'brown_havana', label: 'Brown Havana', price_modifier: 0, color_hex: '#6B3A2A' },
            { id: 'cognac', label: 'Cognac', price_modifier: 0, color_hex: '#9B5523' },
            { id: 'navy', label: 'Navy Blue', price_modifier: 2, color_hex: '#1A3C5E' },
            { id: 'burgundy', label: 'Burgundy', price_modifier: 2, color_hex: '#800020' },
            { id: 'forest_green', label: 'Forest Green', price_modifier: 2, color_hex: '#2D5016' },
            { id: 'caramel', label: 'Caramel', price_modifier: 0, color_hex: '#C67D3A' },
            { id: 'custom_ral', label: 'Custom RAL Color', price_modifier: 8, color_hex: null },
          ],
        },
        {
          id: 'hardware',
          order: 4,
          title: 'Hardware Finish',
          description: 'Select buckle and ring finish',
          ui_type: 'icon_radio',
          required: true,
          options: [
            { id: 'stainless', label: 'Stainless Silver', price_modifier: 0, icon: '🔘' },
            { id: 'brass', label: 'Antique Brass', price_modifier: 4, icon: '🟡' },
            { id: 'black_matt', label: 'Black Matt', price_modifier: 6, icon: '⚫' },
            { id: 'rose_gold', label: 'Rose Gold', price_modifier: 8, icon: '🌸' },
          ],
        },
        {
          id: 'padding',
          order: 5,
          title: 'Padding Type',
          description: 'Optional headpiece and noseband padding',
          ui_type: 'image_card_grid',
          required: false,
          options: [
            { id: 'none', label: 'No Padding', price_modifier: 0, image: '/config/pad-none.jpg' },
            { id: 'memory_foam', label: 'Memory Foam', price_modifier: 5, image: '/config/pad-foam.jpg' },
            { id: 'sheepskin', label: 'Real Sheepskin', price_modifier: 4, image: '/config/pad-sheepskin.jpg' },
            { id: 'gel', label: 'Gel Cushion', price_modifier: 7, image: '/config/pad-gel.jpg' },
          ],
        },
        {
          id: 'stitching',
          order: 6,
          title: 'Stitching Color',
          description: 'Choose stitching thread color',
          ui_type: 'swatch',
          required: true,
          options: [
            { id: 'matching', label: 'Matching (same as leather)', price_modifier: 0, color_hex: null },
            { id: 'white', label: 'White', price_modifier: 0, color_hex: '#FFFFFF' },
            { id: 'contrast_white', label: 'Contrast White', price_modifier: 2, color_hex: '#F8F8F8' },
            { id: 'custom_thread', label: 'Custom Thread Color', price_modifier: 4, color_hex: null },
          ],
        },
        {
          id: 'size',
          order: 7,
          title: 'Size',
          description: 'Select horse head size',
          ui_type: 'icon_radio',
          required: true,
          options: [
            { id: 'pony', label: 'Pony', price_modifier: 0, icon: '🐴' },
            { id: 'cob', label: 'Cob', price_modifier: 0, icon: '🐎' },
            { id: 'full', label: 'Full', price_modifier: 0, icon: '🐴' },
            { id: 'xfull', label: 'X-Full', price_modifier: 2, icon: '🦄' },
          ],
        },
        {
          id: 'quantity',
          order: 8,
          title: 'Quantity & Delivery',
          description: 'Minimum order quantity is 5 units',
          ui_type: 'quantity_delivery',
          required: true,
          min_quantity: 5,
          options: [
            { id: 'standard', label: 'Standard (21 days)', price_modifier: 0, icon: '📦' },
            { id: 'express', label: 'Express (10 days, +25%)', price_modifier: 0, icon: '🚀', is_express: true },
          ],
        },
        {
          id: 'notes',
          order: 9,
          title: 'Notes & Files',
          description: 'Add special instructions or upload reference images',
          ui_type: 'notes_upload',
          required: false,
          options: [],
        },
      ],
    },
  });

  console.log(`✅ Configurator schema v${schemaVersion.versionNumber} created`);
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
