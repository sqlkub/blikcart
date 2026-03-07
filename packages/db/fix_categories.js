const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {

  const forHorses = await p.category.findUnique({ where: { slug: 'for-horses' } });
  const bridles   = await p.category.findUnique({ where: { slug: 'bridles' } });

  // Create or fix girths under for-horses
  const girths = await p.category.upsert({
    where: { slug: 'girths' },
    update: { parentId: forHorses.id, sortOrder: 4 },
    create: { slug: 'girths', name: 'Girths', description: 'Dressage, jumping and stud guard girths', parentId: forHorses.id, sortOrder: 4, isActive: true, isCustomizable: true }
  });
  console.log('Girths category:', girths.id);

  // Create or fix reins under for-horses (separate from parts-components reins)
  const reinsCat = await p.category.upsert({
    where: { slug: 'horse-reins' },
    update: { parentId: forHorses.id, sortOrder: 5 },
    create: { slug: 'horse-reins', name: 'Reins', description: 'Leather, laced and rubber grip reins', parentId: forHorses.id, sortOrder: 5, isActive: true, isCustomizable: true }
  });
  console.log('Reins category:', reinsCat.id);

  // Seed girth products
  const girthProducts = [
    { slug:'dressage-girth',     sku:'GR-001', name:'Dressage Girth',        description:'Short anatomical dressage girth with elastic ends.',         basePrice:38.00, wholesalePrice:26.00 },
    { slug:'jumping-girth',      sku:'GR-002', name:'Jumping Girth',         description:'Shaped jumping girth with stainless steel buckles.',          basePrice:34.00, wholesalePrice:24.00 },
    { slug:'stud-guard-girth',   sku:'GR-003', name:'Stud Guard Girth',      description:'Protective stud guard girth for cross-country.',             basePrice:42.00, wholesalePrice:30.00 },
    { slug:'anatomical-girth',   sku:'GR-004', name:'Anatomical Girth',      description:'Curved anatomical girth for maximum freedom of movement.',   basePrice:48.00, wholesalePrice:34.00 },
    { slug:'sheepskin-girth',    sku:'GR-005', name:'Sheepskin Girth Cover', description:'Genuine sheepskin girth cover. Fits all standard girths.',   basePrice:22.00, wholesalePrice:15.00 },
  ];
  for (const g of girthProducts) {
    const exists = await p.product.findUnique({ where: { slug: g.slug } });
    if (exists) { await p.product.update({ where: { slug: g.slug }, data: { categoryId: girths.id } }); console.log('Fixed girth:', g.name); continue; }
    await p.product.create({ data: { ...g, categoryId: girths.id, moq: 5, isCustomizable: true, isActive: true, weightGrams: 400, leadTimeDays: 14, tags: [], metaTitle: g.name, metaDescription: g.description }});
    console.log('Created girth:', g.name);
  }

  // Seed reins products
  const reinProducts = [
    { slug:'plain-leather-reins-set',    sku:'RN-010', name:'Plain Leather Reins',    description:'Classic flat leather reins, 14mm width.',                  basePrice:24.00, wholesalePrice:17.00 },
    { slug:'laced-reins-horse',          sku:'RN-011', name:'Laced Leather Reins',    description:'Hand-laced full grain leather reins for competition.',      basePrice:32.00, wholesalePrice:22.00 },
    { slug:'rubber-grip-reins-horse',    sku:'RN-012', name:'Rubber Grip Reins',      description:'Leather reins with rubber grip inserts.',                   basePrice:36.00, wholesalePrice:25.00 },
    { slug:'continental-reins-horse',    sku:'RN-013', name:'Continental Reins',      description:'Continental style reins with leather stops.',               basePrice:28.00, wholesalePrice:20.00 },
    { slug:'plaited-cotton-reins-horse', sku:'RN-014', name:'Plaited Cotton Reins',   description:'Plaited cotton reins with leather ends. Lightweight.',      basePrice:18.00, wholesalePrice:13.00 },
  ];
  for (const r of reinProducts) {
    const exists = await p.product.findUnique({ where: { slug: r.slug } });
    if (exists) { console.log('Skip:', r.name); continue; }
    await p.product.create({ data: { ...r, categoryId: reinsCat.id, moq: 5, isCustomizable: true, isActive: true, weightGrams: 200, leadTimeDays: 14, tags: [], metaTitle: r.name, metaDescription: r.description }});
    console.log('Created rein:', r.name);
  }

  // Print final tree
  console.log('\nFinal tree:');
  const tree = await p.category.findMany({
    where: { parentId: null },
    include: { children: { include: { children: true, _count: { select: { products: true } } }, orderBy: { sortOrder: 'asc' } }, _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' }
  });
  for (const root of tree) {
    console.log(`[${root.slug}]`);
    for (const child of root.children) {
      console.log(`  [${child.slug}] ${child._count.products} products`);
      for (const gc of child.children) { console.log(`    [${gc.slug}]`); }
    }
  }

  await p.$disconnect();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
