/**
 * Full demo seed: users, categories, vendor links, products, offers, carts, orders, payments, shipping, reviews.
 * ShopIQ-themed realistic data (Egypt / EGP).
 *
 *   npm run seed:all              → skip if categories already exist
 *   npm run seed:all -- --reset   → wipe listed collections and re-seed
 *
 * Optional .env: SEED_USER_PASSWORD (default ShopiqDemo123), SEED_ADMIN_* for admin account.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/user.model');
const Category = require('../models/category.model');
const VendorCategory = require('../models/vendorCategory.model');
const Product = require('../models/product.model');
const Offer = require('../models/offer.model');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const Payment = require('../models/payment.model');
const Shipping = require('../models/shipping.model');
const Review = require('../models/review.model');

const mongoUri = (process.env.MONGODB_URI || '').replace(/\/$/, '');
const dbName = process.env.DB_NAME;
const reset = process.argv.includes('--reset') || process.env.SEED_RESET === '1' || process.env.SEED_RESET === 'true';
const demoPassword = process.env.SEED_USER_PASSWORD || 'ShopiqDemo123';
const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@shopiq.com').toLowerCase().trim();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
const adminName = (process.env.SEED_ADMIN_NAME || 'ShopIQ Admin').trim();

function img(seed) {
  return {
    fileId: `seed_${seed}`,
    url: `https://placehold.co/800x800/2563eb/ffffff/png?text=${encodeURIComponent(seed)}`,
  };
}

async function clearAll() {
  const order = [
    Review,
    Shipping,
    Payment,
    Order,
    Cart,
    Product,
    VendorCategory,
    Offer,
    Category,
    User,
  ];
  for (const Model of order) {
    const r = await Model.deleteMany({});
    console.log(`   Cleared ${Model.modelName}: ${r.deletedCount}`);
  }
}

async function run() {
  if (!mongoUri || !dbName) {
    console.error('❌ MONGODB_URI and DB_NAME must be set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(`${mongoUri}/${dbName}`);
    console.log(`✅ Connected → "${mongoose.connection.name}"`);

    if (!reset) {
      const existing = await Category.countDocuments();
      if (existing > 0) {
        console.log('ℹ️  Database already has categories. To replace everything, run:');
        console.log('   npm run seed:all -- --reset');
        process.exit(0);
      }
    } else {
      console.log('🗑️  Resetting collections...');
      await clearAll();
    }

    console.log('📦 Seeding users...');
    const users = await User.create([
      {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        phone: '+20 100 000 0001',
        birthdate: new Date('1990-05-15'),
        address: {
          street: '26 Sheraton Heliopolis',
          city: 'Cairo',
          state: 'Cairo',
          country: 'Egypt',
          zipCode: '11361',
        },
        authProvider: 'local',
        isActive: true,
      },
      {
        name: 'Nour El-Din Mahmoud',
        email: 'nour.tech@shopiq.demo',
        password: demoPassword,
        role: 'seller',
        phone: '+20 128 334 5520',
        birthdate: new Date('1988-03-22'),
        address: {
          street: 'Road 9, Maadi',
          city: 'Cairo',
          state: 'Cairo',
          country: 'Egypt',
          zipCode: '11728',
        },
        sellerProfile: {
          storeName: 'NourTech Electronics',
          bio: 'Authorized phones, laptops & accessories. Fast delivery inside Cairo & Giza.',
          earnings: 124500,
          isApproved: true,
        },
        authProvider: 'local',
        isActive: true,
      },
      {
        name: 'Omar Hassan Khaled',
        email: 'omar.style@shopiq.demo',
        password: demoPassword,
        role: 'seller',
        phone: '+20 100 887 4412',
        birthdate: new Date('1992-11-08'),
        address: {
          street: 'Smouha, Alexandria',
          city: 'Alexandria',
          state: 'Alexandria',
          country: 'Egypt',
          zipCode: '21500',
        },
        sellerProfile: {
          storeName: 'Alexandria Style Co.',
          bio: 'Men & women fashion, local brands and imports. Easy returns within 14 days.',
          earnings: 67800,
          isApproved: true,
        },
        authProvider: 'local',
        isActive: true,
      },
      {
        name: 'Sara Ahmed Fathy',
        email: 'sara.ahmed@shopiq.demo',
        password: demoPassword,
        role: 'customer',
        phone: '+20 111 223 4455',
        birthdate: new Date('1996-07-12'),
        address: {
          street: 'Building 12, Nasr City',
          city: 'Cairo',
          state: 'Cairo',
          country: 'Egypt',
          zipCode: '11765',
        },
        authProvider: 'local',
        isActive: true,
      },
      {
        name: 'Mahmoud Ali Ibrahim',
        email: 'mahmoud.ali@shopiq.demo',
        password: demoPassword,
        role: 'customer',
        phone: '+20 122 998 7766',
        birthdate: new Date('1994-01-30'),
        address: {
          street: 'Roushdy, Stanley Bridge area',
          city: 'Alexandria',
          state: 'Alexandria',
          country: 'Egypt',
          zipCode: '21523',
        },
        authProvider: 'local',
        isActive: true,
      },
      {
        name: 'Layla Ibrahim Mostafa',
        email: 'layla.ibrahim@shopiq.demo',
        password: demoPassword,
        role: 'customer',
        phone: '+20 106 554 3322',
        birthdate: new Date('1999-09-03'),
        address: {
          street: 'Zamalek, 26th July St',
          city: 'Cairo',
          state: 'Cairo',
          country: 'Egypt',
          zipCode: '11211',
        },
        authProvider: 'local',
        isActive: true,
      },
    ]);

    const [admin, sellerNour, sellerOmar, customerSara, customerMahmoud, customerLayla] = users;

    console.log('📁 Seeding categories...');
    const categories = await Category.create([
      {
        name: 'Electronics',
        description: 'Phones, laptops, audio, and smart gadgets — ShopIQ electronics hall.',
      },
      {
        name: 'Fashion',
        description: 'Clothing, shoes, and accessories for every season.',
      },
      {
        name: 'Home & Kitchen',
        description: 'Cookware, decor, and everyday home essentials.',
      },
      {
        name: 'Beauty & Care',
        description: 'Skincare, haircare, and personal care picks.',
      },
      {
        name: 'Sports & Outdoors',
        description: 'Fitness gear, team sports, and outdoor equipment.',
      },
    ]);

    const [catElectronics, catFashion, catHome, catBeauty, catSports] = categories;

    console.log('🔗 Vendor ↔ category links...');
    await VendorCategory.create([
      { vendorId: sellerNour._id, categoryId: catElectronics._id, isApproved: true },
      { vendorId: sellerNour._id, categoryId: catHome._id, isApproved: true },
      { vendorId: sellerOmar._id, categoryId: catFashion._id, isApproved: true },
      { vendorId: sellerOmar._id, categoryId: catSports._id, isApproved: true },
    ]);

    console.log('🛒 Products...');
    const products = await Product.create([
      {
        name: 'Samsung Galaxy A55 5G 256GB',
        description:
          '6.6" Super AMOLED, 50MP OIS camera, 5000mAh battery. Egyptian warranty. Bestseller on ShopIQ Cairo.',
        price: 18999,
        stock: 42,
        categoryId: catElectronics._id,
        vendorId: sellerNour._id,
        images: [img('Galaxy-A55'), img('Galaxy-A55-2')],
        tags: ['samsung', '5g', 'android', 'smartphone'],
      },
      {
        name: 'Anker Soundcore Q20i Wireless Headphones',
        description: 'Hybrid ANC, 40h playtime, USB-C. Great for metro & study.',
        price: 1899,
        stock: 120,
        categoryId: catElectronics._id,
        vendorId: sellerNour._id,
        images: [img('Anker-Q20i')],
        tags: ['anker', 'headphones', 'anc'],
      },
      {
        name: 'Philips Daily Collection Blender 500W',
        description: '2L jar, 5-star blade, ideal for smoothies and soups.',
        price: 1299,
        stock: 35,
        categoryId: catHome._id,
        vendorId: sellerNour._id,
        images: [img('Philips-Blender')],
        tags: ['philips', 'kitchen', 'blender'],
      },
      {
        name: 'Egyptian Cotton Polo Shirt — Navy',
        description: 'Premium cotton, tailored fit. Made for ShopIQ fashion week drop.',
        price: 449,
        stock: 200,
        categoryId: catFashion._id,
        vendorId: sellerOmar._id,
        images: [img('Polo-Navy')],
        tags: ['polo', 'cotton', 'men'],
      },
      {
        name: 'Linen Wide-Leg Trousers — Sand',
        description: 'Breathable linen blend, perfect for Alexandria summer heat.',
        price: 599,
        stock: 85,
        categoryId: catFashion._id,
        vendorId: sellerOmar._id,
        images: [img('Linen-Trousers')],
        tags: ['women', 'linen', 'summer'],
      },
      {
        name: 'Training Dumbbells Set 2×10kg',
        description: 'Rubber-coated hex dumbbells with carry stand.',
        price: 2200,
        stock: 18,
        categoryId: catSports._id,
        vendorId: sellerOmar._id,
        images: [img('Dumbbells')],
        tags: ['gym', 'weights', 'home-gym'],
      },
      {
        name: 'Nivea Men Sensitive Shaving Foam 200ml',
        description: 'Bundle-friendly; alcohol-free. Top repeat buy on ShopIQ.',
        price: 89,
        stock: 300,
        categoryId: catBeauty._id,
        vendorId: sellerNour._id,
        images: [img('Nivea-Shave')],
        tags: ['nivea', 'shaving', 'men'],
      },
    ]);

    const [pPhone, pHeadphones, pBlender, pPolo, pTrousers, pDumbbells, pNivea] = products;


    console.log('🏷️  Offers / promos...');
    const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await Offer.create([
      {
        discountPercentage: 15,
        discountCode: 'SHOPIQ15',
        description: 'Welcome offer — 15% off orders 500 EGP+ on ShopIQ',
        vendorId: null,
        productId: null,
        categoryId: null,
        startDate: new Date(),
        endDate: in90,
        minimumOrderValue: 500,
        usageLimit: 10000,
        isActive: true,
      },
      {
        discountPercentage: 10,
        discountCode: 'TECH10',
        description: 'NourTech — 10% off electronics category basket',
        vendorId: sellerNour._id,
        categoryId: catElectronics._id,
        startDate: new Date(),
        endDate: in90,
        minimumOrderValue: 1000,
        isActive: true,
      },
      {
        discountAmount: 50,
        discountCode: 'STYLE50',
        description: 'Alexandria Style — 50 EGP off fashion orders 400+',
        vendorId: sellerOmar._id,
        categoryId: catFashion._id,
        startDate: new Date(),
        endDate: in90,
        minimumOrderValue: 400,
        isActive: true,
      },
    ]);

    console.log('🛒 Carts...');
    await Cart.create([
      {
        userId: customerSara._id,
        items: [
          { productId: pPhone._id, quantity: 1, priceAtAddTime: pPhone.price },
          { productId: pHeadphones._id, quantity: 2, priceAtAddTime: pHeadphones.price },
        ],
        promoCode: 'SHOPIQ15',
        discountAmount: 500,
      },
      {
        userId: customerLayla._id,
        items: [{ productId: pPolo._id, quantity: 3, priceAtAddTime: pPolo.price }],
      },
    ]);

    const addrSara = {
      street: '12 Mostafa El-Nahhas, Nasr City',
      city: 'Cairo',
      state: 'Cairo',
      country: 'Egypt',
      zipCode: '11765',
      phone: '+20 111 223 4455',
    };

    console.log('📋 Orders, payments, shipping...');

    const order1 = await Order.create({
      userId: customerSara._id,
      status: 'pending',
      totalAmount: 18999 + 1899 + 50,
      subtotal: 18999 + 1899,
      discountAmount: 0,
      shippingFee: 50,
      tax: 0,
      paymentMethod: 'credit_card',
      shippingAddress: addrSara,
      items: [
        {
          productId: pPhone._id,
          productName: pPhone.name,
          productImage: pPhone.imageUrl,
          priceAtOrder: 18999,
          quantity: 1,
          vendorId: sellerNour._id,
        },
        {
          productId: pHeadphones._id,
          productName: pHeadphones.name,
          productImage: pHeadphones.imageUrl,
          priceAtOrder: 1899,
          quantity: 1,
          vendorId: sellerNour._id,
        },
      ],
    });
    for (const s of ['confirmed', 'processing', 'shipped', 'delivered']) {
      order1.status = s;
      await order1.save();
    }

    const pay1 = await Payment.create({
      orderId: order1._id,
      totalAmount: order1.totalAmount,
      paymentMethod: 'credit_card',
      paymentStatus: 'completed',
      transactionId: 'KSH-SEED-' + Date.now(),
      paidBy: { userId: customerSara._id, email: customerSara.email },
    });
    order1.paymentId = pay1._id;
    await order1.save();

    await Shipping.create({
      orderId: order1._id,
      vendorId: sellerNour._id,
      status: 'delivered',
      carrier: 'Aramex Egypt',
      trackingNumber: 'AREX-EG-' + Math.floor(Math.random() * 1e9),
      trackingUrl: 'https://www.aramex.com/track',
      shippingAddress: addrSara,
      actualDeliveryDate: new Date(Date.now() - 2 * 86400000),
      statusHistory: [
        { status: 'preparing', note: 'Picked at NourTech Maadi', updatedAt: new Date(Date.now() - 7 * 86400000) },
        { status: 'shipped', note: 'Handed to Aramex', updatedAt: new Date(Date.now() - 5 * 86400000) },
        { status: 'delivered', note: 'Signed by customer', updatedAt: new Date(Date.now() - 2 * 86400000) },
      ],
    });

    const order2 = await Order.create({
      userId: customerMahmoud._id,
      status: 'pending',
      totalAmount: 599 + 45,
      subtotal: 599,
      shippingFee: 45,
      paymentMethod: 'cash_on_delivery',
      shippingAddress: {
        street: customerMahmoud.address.street,
        city: customerMahmoud.address.city,
        state: customerMahmoud.address.state,
        country: customerMahmoud.address.country,
        zipCode: customerMahmoud.address.zipCode,
        phone: customerMahmoud.phone,
      },
      items: [
        {
          productId: pTrousers._id,
          productName: pTrousers.name,
          productImage: pTrousers.imageUrl,
          priceAtOrder: 599,
          quantity: 1,
          vendorId: sellerOmar._id,
        },
      ],
    });
    for (const s of ['confirmed', 'shipped']) {
      order2.status = s;
      await order2.save();
    }

    const pay2 = await Payment.create({
      orderId: order2._id,
      totalAmount: order2.totalAmount,
      paymentMethod: 'cash_on_delivery',
      paymentStatus: 'pending',
      paidBy: { userId: customerMahmoud._id, email: customerMahmoud.email },
    });
    order2.paymentId = pay2._id;
    await order2.save();

    const estDel = new Date(Date.now() + 5 * 86400000);
    await Shipping.create({
      orderId: order2._id,
      vendorId: sellerOmar._id,
      status: 'in_transit',
      carrier: 'Bosta',
      trackingNumber: 'BOSTA-' + Math.floor(Math.random() * 1e8),
      estimatedDeliveryDate: estDel,
      shippingAddress: order2.shippingAddress,
    });

    const order3Sub = 449 * 2;
    const order3 = await Order.create({
      userId: customerLayla._id,
      status: 'pending',
      totalAmount: order3Sub - 50 + 40,
      subtotal: order3Sub,
      shippingFee: 40,
      promoCode: 'STYLE50',
      discountAmount: 50,
      paymentMethod: 'wallet',
      shippingAddress: {
        street: customerLayla.address.street,
        city: customerLayla.address.city,
        state: customerLayla.address.state,
        country: customerLayla.address.country,
        zipCode: customerLayla.address.zipCode,
        phone: customerLayla.phone,
      },
      items: [
        {
          productId: pPolo._id,
          productName: pPolo.name,
          productImage: pPolo.imageUrl,
          priceAtOrder: 449,
          quantity: 2,
          vendorId: sellerOmar._id,
        },
      ],
    });
    for (const s of ['confirmed', 'processing']) {
      order3.status = s;
      await order3.save();
    }

    const pay3 = await Payment.create({
      orderId: order3._id,
      totalAmount: order3.totalAmount,
      paymentMethod: 'wallet',
      paymentStatus: 'completed',
      transactionId: 'WALLET-SEED-' + Date.now(),
      paidBy: { userId: customerLayla._id, email: customerLayla.email },
    });
    order3.paymentId = pay3._id;
    await order3.save();

    await Shipping.create({
      orderId: order3._id,
      vendorId: sellerOmar._id,
      status: 'preparing',
      carrier: 'Alexandria Style internal',
      estimatedDeliveryDate: new Date(Date.now() + 3 * 86400000),
      shippingAddress: order3.shippingAddress,
    });

    console.log('⭐ Reviews...');
    await Review.create([
      {
        userId: customerSara._id,
        productId: pPhone._id,
        rating: 5,
        comment:
          'Phone arrived sealed with warranty card. NourTech called before delivery — exactly what we expect from ShopIQ.',
      },
      {
        userId: customerMahmoud._id,
        productId: pTrousers._id,
        rating: 4,
        comment: 'Fabric feels great in Alexandria humidity. Slightly long on me but quality is solid.',
      },
      {
        userId: customerLayla._id,
        productId: pPolo._id,
        rating: 5,
        comment: 'Gifted two to my brother — true to size, fast shipping to Zamalek.',
      },
      {
        userId: customerSara._id,
        productId: pHeadphones._id,
        rating: 4,
        comment: 'ANC is strong on the metro. Great value vs imported shops in Citystars.',
      },
      {
        userId: customerMahmoud._id,
        productId: pDumbbells._id,
        rating: 5,
        comment: 'Heavy and stable. Omar’s store packaged well — no chips on rubber.',
      },
    ]);

    await pPhone.updateRatingCache();
    await pHeadphones.updateRatingCache();
    await pTrousers.updateRatingCache();
    await pPolo.updateRatingCache();
    await pDumbbells.updateRatingCache();

    console.log('\n✅ Seed complete.\n');
    console.log('── Demo logins (password: ' + demoPassword + ' except admin) ──');
    console.log(`   Admin:     ${adminEmail} / ${adminPassword}`);
    console.log('   Sellers:   nour.tech@shopiq.demo | omar.style@shopiq.demo');
    console.log('   Customers: sara.ahmed@shopiq.demo | mahmoud.ali@shopiq.demo | layla.ibrahim@shopiq.demo');
    console.log('── Promo codes: SHOPIQ15, TECH10, STYLE50 ──\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
