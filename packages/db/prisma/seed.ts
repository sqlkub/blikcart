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

  // Static pages with CMS content
  const PAGE_CONTENTS: Record<string, object> = {
    'returns': {
      hero: { eyebrow: 'Policies', title: 'Returns & Refunds', subtitle: 'Custom-made items are non-returnable unless defective. Standard products have a 14-day return window.' },
      summaryCards: [
        { label: 'Custom items', sub: 'Non-returnable (unless defective)' },
        { label: 'Catalogue items', sub: '14-day return window' },
        { label: 'Refund speed', sub: 'Within 5 business days' },
        { label: 'Start a return', sub: 'support@blikcart.nl' },
      ],
      sections: [
        { title: 'Custom-Made Items', paragraphs: ['All products made to your specification through our configurator are custom-made and are therefore exempt from standard distance-selling return rights under EU consumer law.', 'Custom items cannot be returned or exchanged unless they:'], bullets: ['Arrive materially different from your confirmed, approved specification', 'Are defective due to a manufacturing fault', 'Are damaged in transit'], footer: 'If any of the above apply, please contact us within 48 hours of delivery. We will arrange a free replacement or full refund.' },
        { title: 'Standard Catalogue Products', paragraphs: ['Ready-made products ordered from our standard catalogue may be returned within 14 days of delivery, provided:'], bullets: ['The item is unused and in its original, undamaged packaging', 'A return request is initiated from your account order page before the 14-day window closes', 'The item was not a sale/clearance item (marked "Final Sale" at time of purchase)'], footer: "Return shipping is at the customer's expense unless the item arrived faulty. Once received and inspected, refunds are processed within 5 business days to the original payment method." },
        { title: 'Damaged or Incorrect Items', paragraphs: ['If your order arrives damaged or does not match your approved specification:'], bullets: ['Email support@blikcart.nl within 48 hours of delivery', 'Include your order number and clear photos of the issue', 'We will review and respond within one business day', 'Approved claims receive a free replacement or full refund — your choice'], footer: '' },
        { title: 'How to Initiate a Return', paragraphs: ['For eligible standard-product returns:'], bullets: ['Log in to your account and open the relevant order', 'Click "Request Return" and select your reason', "We'll email you a return shipping label (cost deducted from refund for non-faulty items)", 'Pack the item securely and drop it off at any PostNL, DPD, or DHL point', 'Refund is processed within 5 business days of receipt'], footer: '' },
      ],
      cta: { title: 'Need to Report a Problem?', body: 'Contact us within 48 hours of delivery with your order number and photos.', email: 'support@blikcart.nl', lastUpdated: 'March 2026' },
    },
    'sizing-guide': {
      hero: { eyebrow: 'Fit Guide', title: 'Sizing Guide', subtitle: 'Correct fit is critical for comfort and performance. Use these charts alongside our configurator to select the right size for every product.' },
      bridleSizes: [
        { size: 'Pony', headpiece: '50–54 cm', browband: '38–42 cm', noseband: '30–33 cm', cheekpieces: '28–34 cm' },
        { size: 'Cob', headpiece: '54–58 cm', browband: '42–46 cm', noseband: '33–36 cm', cheekpieces: '34–40 cm' },
        { size: 'Full', headpiece: '58–63 cm', browband: '46–52 cm', noseband: '36–40 cm', cheekpieces: '40–46 cm' },
        { size: 'Full XL', headpiece: '63–68 cm', browband: '52–56 cm', noseband: '40–44 cm', cheekpieces: '46–52 cm' },
      ],
      bridleNote: '* All measurements are total length of leather on the buckle holes.',
      rugSizes: [
        { size: "4'3\"", cm: '130 cm', back: '111 cm', chest: '120 cm', breeds: 'Small pony' },
        { size: "4'6\"", cm: '137 cm', back: '120 cm', chest: '128 cm', breeds: 'Medium pony' },
        { size: "4'9\"", cm: '145 cm', back: '127 cm', chest: '136 cm', breeds: 'Large pony / small cob' },
        { size: "5'0\"", cm: '152 cm', back: '134 cm', chest: '142 cm', breeds: 'Cob' },
        { size: "5'3\"", cm: '160 cm', back: '140 cm', chest: '150 cm', breeds: 'Small TB / WB' },
        { size: "5'6\"", cm: '167 cm', back: '147 cm', chest: '158 cm', breeds: 'TB / Warm Blood' },
        { size: "5'9\"", cm: '175 cm', back: '154 cm', chest: '166 cm', breeds: 'Large WB' },
        { size: "6'0\"", cm: '183 cm', back: '161 cm', chest: '174 cm', breeds: 'XL WB / Draught' },
        { size: "6'3\"", cm: '191 cm', back: '168 cm', chest: '182 cm', breeds: 'XXL / Draught' },
      ],
      bootSizes: [
        { size: 'XS', canon: '< 19 cm', fits: 'Small pony, fine-boned' },
        { size: 'S', canon: '19–21 cm', fits: 'Pony / small cob' },
        { size: 'M', canon: '21–23 cm', fits: 'Cob / average horse' },
        { size: 'L', canon: '23–25 cm', fits: 'Warmblood / TB' },
        { size: 'XL', canon: '25–28 cm', fits: 'Large WB / Draught cross' },
      ],
      howToMeasure: [
        { title: 'Headpiece / Bridle', steps: ['Use a soft tape measure', 'Measure over the poll from cheek ring to cheek ring', 'Add 4 cm for buckle adjustment range'] },
        { title: 'Rug Back Length', steps: ['Start from the centre of the chest', 'Measure along the back following the spine', 'End at the base of the tail', 'Do not measure under the belly'] },
        { title: 'Cannon Bone', steps: ['Have the horse standing square', 'Use a soft tape around the cannon', 'Measure at the widest point (middle third)', 'Front and hind cannons may differ'] },
      ],
      cta: { title: 'Not sure what size to order?', body: "Our team can advise — just share your horse's measurements." },
    },
    'price-lists': {
      hero: { eyebrow: 'Transparency', title: 'Price Lists', subtitle: 'Starting prices, volume discount tiers, and lead times for every product category. Live prices with all options are shown in the configurator.' },
      basePrices: [
        { category: 'Bridles', from: 38, to: 140, moq: 1, note: 'Full leather, padded, or simple strap styles', leadTime: '10–14 days' },
        { category: 'Browbands', from: 18, to: 85, moq: 1, note: 'Plain leather, crystal-set, or embroidered', leadTime: '7–10 days' },
        { category: 'Saddle Pads', from: 24, to: 110, moq: 5, note: 'GP, dressage, or jumping cut', leadTime: '7–10 days' },
        { category: 'Horse Rugs', from: 65, to: 210, moq: 3, note: 'Turnout (lightweight to 400g) and stable', leadTime: '14–21 days' },
        { category: 'Head Collars', from: 16, to: 60, moq: 1, note: 'Leather or nylon with name plate option', leadTime: '7–12 days' },
        { category: 'Numnahs', from: 20, to: 75, moq: 5, note: 'Quilted and fleece-lined options', leadTime: '7–10 days' },
        { category: 'Leg Boots', from: 28, to: 95, moq: 4, note: 'Brushing, tendon, and over-reach styles', leadTime: '10–14 days' },
      ],
      volumeTiers: [
        { range: '1 – 4 units', discount: 'Base price', highlight: false },
        { range: '5 – 19 units', discount: '10% off', highlight: false },
        { range: '20 – 49 units', discount: '15% off', highlight: true },
        { range: '50 – 99 units', discount: '20% off', highlight: false },
        { range: '100+ units', discount: '30% off', highlight: false },
      ],
      expressSection: { title: 'Express Production', body: 'Express production (approximately half the standard lead time) is available on all categories except Horse Rugs. A 25% price premium applies and is calculated automatically when you select Express delivery in the configurator. Express lead times: Browbands 4–5 days · Bridles 5–7 days · Saddle pads 4–5 days · Head collars 4–6 days.' },
      wholesaleSection: { title: 'Full Wholesale Price List', body: 'Our full PDF price list includes per-unit pricing for every option combination across all 7 categories, with wholesale discount tiers applied. Available to approved wholesale partners and verified businesses.', promoText: 'Alternatively, use our live configurator for instant per-unit pricing.' },
    },
    'custom-orders': {
      hero: { eyebrow: 'Bespoke Manufacturing', title: 'Custom Orders', subtitle: 'Every Blikcart product can be made to your exact specification. Use our step-by-step configurator to design, price, and order — all in one place.' },
      processSteps: [
        { step: 1, title: 'Choose a Category', desc: 'Pick the product type below. Each category has its own guided configurator.' },
        { step: 2, title: 'Configure Your Design', desc: 'Step through material, colour, hardware, sizing, and delivery options. Live price shown throughout.' },
        { step: 3, title: 'Submit for Quote', desc: 'No payment needed yet. Your spec is sent to our team for review.' },
        { step: 4, title: 'Quote Approval', desc: 'We confirm the final price within 24 hours. You approve and pay to start production.' },
        { step: 5, title: 'Handmade in Workshop', desc: 'Your order is manufactured by our craftspeople to your exact specification.' },
        { step: 6, title: 'Quality Check & Dispatch', desc: 'Every item passes a 12-point QC check before being packed and shipped directly to you.' },
      ],
      categories: [
        { slug: 'bridles', name: 'Bridles', from: 38, leadTime: '10–14 days', moq: 1 },
        { slug: 'browbands', name: 'Browbands', from: 18, leadTime: '7–10 days', moq: 1 },
        { slug: 'saddle-pads', name: 'Saddle Pads', from: 24, leadTime: '7–10 days', moq: 5 },
        { slug: 'rugs', name: 'Horse Rugs', from: 65, leadTime: '14–21 days', moq: 3 },
        { slug: 'head-collars', name: 'Head Collars', from: 16, leadTime: '7–12 days', moq: 1 },
        { slug: 'numnahs', name: 'Numnahs', from: 20, leadTime: '7–10 days', moq: 5 },
        { slug: 'boots', name: 'Leg Boots', from: 28, leadTime: '10–14 days', moq: 4 },
      ],
      capabilities: [
        { label: 'Colours', desc: '20+ leather and fabric colour options per category' },
        { label: 'Hardware', desc: 'Stainless, brass, antique brass, and rose gold finishes' },
        { label: 'Stitching', desc: 'Contrast or matching thread, multiple stitch patterns' },
        { label: 'Branding', desc: 'Logo embossing, name plates, custom labels' },
        { label: 'Sizing', desc: 'Standard sizes plus custom measurements on request' },
        { label: 'Eco Options', desc: 'Bio-certified leather tanning and recycled fill on rugs' },
      ],
    },
    'b2b': {
      hero: { eyebrow: 'Business Accounts', title: 'B2B Portal', subtitle: 'Unlock wholesale pricing, private-label options, Net-30 terms, and a dedicated account manager — all through one login.' },
      stats: [
        { value: '500+', label: 'Wholesale Partners' },
        { value: '24h', label: 'Quote Response' },
        { value: '30%', label: 'Max Volume Discount' },
        { value: 'Net-30', label: 'Payment Terms (approved)' },
      ],
      features: [
        { title: 'Dedicated Account Manager', desc: 'One named contact for all your orders, quotes, and questions. Available Mon–Fri 09:00–17:00 CET.' },
        { title: 'Volume Pricing', desc: 'Automatic discounts from 5 units. Custom pricing available for regular high-volume partners.' },
        { title: 'Private Label & White Label', desc: 'Custom branding, swing tags, and packaging with your logo. Apply for branding requirements at time of ordering.' },
        { title: 'Net-30 Payment Terms', desc: 'Approved accounts receive Net-30 invoicing after 3 completed orders. Apply after your first order.' },
        { title: 'Order Management Portal', desc: 'Your account dashboard tracks every quote, order, and shipment across your entire purchase history.' },
        { title: 'Priority Production', desc: 'B2B accounts get priority scheduling in our production queue during peak seasons.' },
      ],
      steps: [
        { step: '01', title: 'Apply for Wholesale Access', desc: 'Complete the form on our Wholesale page. We review and respond within 1 business day.', link: '/wholesale', linkText: 'Apply now' },
        { step: '02', title: 'Get Your Account Activated', desc: "Once approved, you receive your B2B login, custom pricing tier, and your account manager's direct contact details.", link: '', linkText: '' },
        { step: '03', title: 'Place Orders via Configurator', desc: 'Log in and use the same step-by-step configurator — your wholesale prices are applied automatically.', link: '', linkText: '' },
        { step: '04', title: 'Manage Everything in One Place', desc: 'All quotes, orders, shipments, and invoices are accessible from your account dashboard.', link: '', linkText: '' },
      ],
      volumeTiers: [
        { range: '5 – 19 units', pct: '10%', note: '' },
        { range: '20 – 49 units', pct: '15%', note: 'Popular' },
        { range: '50 – 99 units', pct: '20%', note: '' },
        { range: '100+ units', pct: '30%', note: 'Best Value' },
      ],
      cta: { title: 'Ready to Partner?', body: 'Apply for a wholesale account in 2 minutes. We approve and respond within 1 business day.', email: 'wholesale@blikcart.nl' },
    },
    'contact': {
      hero: { eyebrow: 'Get in Touch', title: 'Contact Us', subtitle: "Questions about an order, a custom quote, or just want to say hello — we're here." },
      contactCards: [
        { label: 'General Support', value: 'support@blikcart.nl', sub: 'Mon – Fri, replies within 4 hours', link: 'mailto:support@blikcart.nl' },
        { label: 'Wholesale & B2B', value: 'wholesale@blikcart.nl', sub: 'Account & pricing enquiries', link: 'mailto:wholesale@blikcart.nl' },
        { label: 'Phone', value: '+31 (0)20 123 4567', sub: 'Mon – Fri, 09:00 – 17:00 CET', link: 'tel:+31201234567' },
        { label: 'Workshop', value: 'Amsterdam, NL', sub: 'Not open to walk-ins', link: '' },
      ],
      formSection: {
        title: 'Send a Message',
        body: "Fill in the form and we'll get back to you within one business day.",
        topics: ['General enquiry', 'Custom order / quote', 'Existing order', 'Wholesale / B2B', 'Returns & refunds', 'Product information', 'Technical / website issue'],
      },
      responseTimes: ['General enquiries — same day', 'Custom quotes — within 24 hours', 'Order updates — within 4 hours'],
    },
    'design-your-own': {
      hero: { eyebrow: 'Bespoke Manufacturing', title: 'Design Your Own', subtitle: "From first click to your door — here's exactly how the Blikcart custom order process works." },
      stats: [
        { num: '7', label: 'Product Categories' },
        { num: '24h', label: 'Quote Turnaround' },
        { num: '7–21', label: 'Days Lead Time' },
        { num: '30%', label: 'Max Volume Discount' },
      ],
      lifecycle: [
        { phase: 'You', step: 1, title: 'Choose a Category', desc: 'Pick the product you want to customise. Each category has its own guided configurator tailored to that product.' },
        { phase: 'You', step: 2, title: 'Configure Your Design', desc: 'Step through material, colour, hardware, stitching, sizing, and delivery options. A live price updates with every choice.' },
        { phase: 'You', step: 3, title: 'Submit for Quote', desc: 'No payment required yet. Your full specification is sent to our team for review and final pricing.' },
        { phase: 'You', step: 4, title: 'Approve & Pay', desc: 'We confirm the final price within 24 hours. You review, approve, and pay to release your order into production.' },
        { phase: 'Blikcart', step: 5, title: 'Production Starts', desc: 'Your order enters our manufacturing queue. Our craftspeople begin production to your exact specification.' },
        { phase: 'Blikcart', step: 6, title: '12-Point Quality Check', desc: 'Every finished item is inspected against your original specification before it leaves our workshop.' },
        { phase: 'Blikcart', step: 7, title: 'Packed & Dispatched', desc: 'Your order is carefully packed and handed to our courier. You receive a tracking link by email.' },
        { phase: 'Delivered', step: 8, title: 'Delivered to You', desc: 'Your custom order arrives at your door. EU delivery typically takes 2–5 business days after dispatch.' },
      ],
      categories: [
        { slug: 'bridles', name: 'Bridles', description: 'Custom-fitted leather bridles in 4 styles, 3 materials, 8 colours, and 4 hardware finishes.', leadTime: '10–14 days', minOrder: 1, steps: 9 },
        { slug: 'browbands', name: 'Browbands', description: 'Plain leather, crystal-set, or embroidered. Your colours, your pattern.', leadTime: '7–10 days', minOrder: 1, steps: 7 },
        { slug: 'saddle-pads', name: 'Saddle Pads', description: 'GP, dressage, or jumping cut. Choose fabric, colour, piping, and embroidery.', leadTime: '7–10 days', minOrder: 5, steps: 8 },
        { slug: 'rugs', name: 'Horse Rugs', description: 'Turnout and stable rugs. Select weight, lining, colour, and custom fit.', leadTime: '14–21 days', minOrder: 3, steps: 8 },
        { slug: 'head-collars', name: 'Head Collars', description: 'Leather or nylon with optional name plate. Multiple colour combinations.', leadTime: '7–12 days', minOrder: 1, steps: 6 },
        { slug: 'numnahs', name: 'Numnahs', description: 'Quilted and fleece-lined. Match your saddle pad or create a contrast.', leadTime: '7–10 days', minOrder: 5, steps: 7 },
        { slug: 'boots', name: 'Leg Boots', description: 'Brushing, tendon, and over-reach styles. Choose colour, fastening, and lining.', leadTime: '10–14 days', minOrder: 4, steps: 7 },
      ],
      whyBlikcart: [
        { title: 'Direct from Workshop', desc: 'No middlemen. We manufacture everything in-house at our Amsterdam workshop.' },
        { title: 'Live Price Preview', desc: 'See the exact price as you configure. No surprises at checkout.' },
        { title: '24h Quote Confirmation', desc: 'We review every order and confirm within one business day.' },
        { title: '12-Point QC', desc: "Every item is inspected before dispatch. We won't ship anything we wouldn't use ourselves." },
        { title: 'Wholesale Pricing', desc: 'Volume discounts from 5 units. Up to 30% off for orders of 100+.' },
        { title: 'EU-Wide Delivery', desc: 'Free shipping over €150. Standard EU delivery in 2–5 days after dispatch.' },
      ],
      faqs: [
        { q: 'Do I need to pay before the quote is confirmed?', a: 'No. You configure and submit for free. Payment is only requested after you approve the final quote.' },
        { q: 'Can I make changes after submitting?', a: 'Yes — before you approve the quote you can request any revisions. Once payment is made and production starts, changes may incur additional charges.' },
        { q: 'Is there a minimum order quantity?', a: 'Bridles, browbands, and head collars start at 1 unit. Other products have MOQs of 3–5 units. MOQ is shown on each category card.' },
        { q: 'How accurate is the live price?', a: 'The configurator price is typically within 5% of the final confirmed quote. Any difference is explained in the quote email.' },
      ],
      finalCta: { title: 'Ready to Start?', body: 'Pick a category above, or jump straight into our most popular configurator — bridles.' },
    },
  };

  for (const [slug, contentObj] of Object.entries(PAGE_CONTENTS)) {
    await prisma.staticPage.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        content: JSON.stringify(contentObj),
        isPublished: true,
      },
    });
    console.log(`✅ Static page seeded: /${slug}`);
  }

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
