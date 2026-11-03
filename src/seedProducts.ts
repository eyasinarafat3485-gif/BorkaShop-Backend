import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in Backend/.env");
  process.exit(1);
}

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["abaya", "burqa", "hijab", "khimar", "modest-sets", "niqab"],
    },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discountPercent: { type: Number },
    rating: { type: Number, default: 5 },
    reviewsCount: { type: Number, default: 0 },
    image: { type: String, required: true },
    alternateImage: { type: String },
    tag: { type: String },
    inStock: { type: Boolean, default: true },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    sizes: { type: [String], default: [] },
    colors: { type: Array, default: [] },
    fabric: { type: String },
    description: { type: String },
  },
  {
    timestamps: true,
    collection: "products",
  }
);

export const ProductModel =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);

export const REAL_PRODUCTS = [
  {
    id: "prod-1876",
    name: "Classic Everyday Black Burqa",
    slug: "classic-everyday-black-burqa",
    category: "burqa",
    price: 3034,
    originalPrice: 3943,
    discountPercent: 23,
    rating: 4.9,
    reviewsCount: 88,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-everyday-black-burqa.png",
    tag: "EID COLLECTION",
    inStock: true,
    isNewArrival: true,
    isBestSeller: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Navy", hex: "#1B2A4A" },
      { name: "Mocha", hex: "#8A6D58" },
      { name: "Beige", hex: "#D8C7B5" },
    ],
    fabric: "Premium Korean Zoom Georgette",
    description: "Designed for everyday elegance, comfort, and complete modesty. Wrinkle-resistant with a graceful silhouette.",
  },
  {
    id: "prod-1924",
    name: "Classic Lightweight Long Niqab",
    slug: "classic-lightweight-long-niqab",
    category: "niqab",
    price: 1250,
    originalPrice: 1640,
    discountPercent: 9,
    tag: "9% OFF",
    rating: 4.8,
    reviewsCount: 52,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-lightweight-long-niqab.png",
    inStock: true,
    isNewArrival: true,
    isBestSeller: false,
    sizes: ["Standard", "Extra Long"],
    colors: [
      { name: "Jet Black", hex: "#111111" },
      { name: "Dark Coffee", hex: "#2C1B18" },
    ],
    fabric: "Ultra-Light Japanese Chiffon",
    description: "Extra breathable dual-layer long niqab providing maximum comfort and gentle eye-opening finish.",
  },
  {
    id: "prod-1918",
    name: "Elegant Modest Two Piece Set",
    slug: "elegant-modest-two-piece-set",
    category: "modest-sets",
    price: 4924,
    originalPrice: 5833,
    discountPercent: 15,
    rating: 5.0,
    reviewsCount: 76,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/elegant-modest-two-piece-set.png",
    tag: "BEST SELLER",
    inStock: true,
    isNewArrival: true,
    isBestSeller: true,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Navy", hex: "#1B2A4A" },
      { name: "Mocha", hex: "#8A6D58" },
      { name: "Beige", hex: "#D8C7B5" },
    ],
    fabric: "Premium Dubai Satin & Linen Blend",
    description: "Comes with an oversized flowing tunic abaya and matching wide-cut modest palazzo trousers.",
  },
  {
    id: "prod-1910",
    name: "Luxury Korean Georgette Burqa",
    slug: "luxury-korean-georgette-burqa",
    category: "burqa",
    price: 3804,
    originalPrice: 4713,
    discountPercent: 19,
    rating: 4.9,
    reviewsCount: 110,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/luxury-korean-georgette-burqa.png",
    tag: "EID SPECIAL",
    inStock: true,
    isNewArrival: true,
    isBestSeller: true,
    sizes: ["50", "52", "54", "56"],
    colors: [
      { name: "Deep Charcoal", hex: "#1C1C1C" },
      { name: "Royal Plum", hex: "#4F213B" },
    ],
    fabric: "Original Korean Double Georgette",
    description: "Heavy drop and non-transparent finish with subtle wrist cuffs for refined modest dressing.",
  },
  {
    id: "prod-1890",
    name: "Luxury Medina Silk Hijab",
    slug: "luxury-medina-silk-hijab",
    category: "hijab",
    price: 1590,
    originalPrice: 1790,
    discountPercent: 11,
    tag: "11% OFF",
    rating: 5.0,
    reviewsCount: 164,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/luxury-medina-silk-hijab.png",
    inStock: true,
    isNewArrival: true,
    isBestSeller: false,
    sizes: ["75 x 195 cm"],
    colors: [
      { name: "Dusty Cedar", hex: "#995A59" },
      { name: "Mocha Cream", hex: "#D4B996" },
      { name: "Jet Black", hex: "#111111" },
    ],
    fabric: "Authentic Imported Medina Silk",
    description: "Super soft matte sheen, entirely non-slip texture, and lightweight drape that holds all day without pins.",
  },
  {
    id: "prod-1906",
    name: "Embroidered Front Open Abaya",
    slug: "embroidered-front-open-abaya",
    category: "abaya",
    price: 5694,
    originalPrice: 6603,
    discountPercent: 14,
    rating: 5.0,
    reviewsCount: 95,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/embroidered-front-open-abaya.png",
    tag: "PREMIUM",
    inStock: true,
    isNewArrival: false,
    isBestSeller: true,
    sizes: ["52", "54", "56"],
    colors: [
      { name: "Plum Berry", hex: "#4F213B" },
      { name: "Obsidian Black", hex: "#0E0E0E" },
    ],
    fabric: "Dubai Grade-A Nida",
    description: "Intricately hand-embroidered floral motifs down the front opening and bell sleeves. Includes matching belt.",
  },
  {
    id: "prod-1872",
    name: "Luxury Nida Embroidered Abaya",
    slug: "luxury-nida-embroidered-abaya",
    category: "abaya",
    price: 5124,
    originalPrice: 6033,
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 68,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/luxury-nida-embroidered-abaya.png",
    tag: "NEW",
    inStock: true,
    isNewArrival: true,
    isBestSeller: false,
    sizes: ["52", "54", "56"],
    colors: [
      { name: "Midnight Black", hex: "#141414" },
      { name: "Deep Plum", hex: "#4F213B" },
    ],
    fabric: "Royal Dubai Nida",
    description: "Sophisticated tone-on-tone embroidery on the sleeve borders and front placket.",
  },
  {
    id: "prod-1914",
    name: "Minimal Black Everyday Abaya",
    slug: "minimal-black-everyday-abaya",
    category: "abaya",
    price: 2914,
    originalPrice: 3823,
    discountPercent: 24,
    rating: 4.8,
    reviewsCount: 43,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/minimal-black-everyday-abaya.png",
    inStock: true,
    isNewArrival: false,
    isBestSeller: false,
    sizes: ["50", "52", "54", "56"],
    colors: [
      { name: "Jet Black", hex: "#111111" },
    ],
    fabric: "Korean Zoom Silk",
    description: "Clean, streamlined silhouette designed for University, work, and everyday modest wear.",
  },
  {
    id: "prod-1884",
    name: "Pearl Work Elegant Burqa",
    slug: "pearl-work-elegant-burqa",
    category: "burqa",
    price: 4354,
    originalPrice: 5263,
    discountPercent: 17,
    rating: 5.0,
    reviewsCount: 82,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/pearl-work-elegant-burqa.png",
    tag: "TRENDING",
    inStock: true,
    isNewArrival: true,
    isBestSeller: false,
    sizes: ["52", "54", "56"],
    colors: [
      { name: "Jet Black", hex: "#111111" },
      { name: "Plum Wine", hex: "#4F213B" },
    ],
    fabric: "Soft Nida with Pearl Accents",
    description: "Hand-embellished pearl bead detailing on the cuffs and bodice for special occasions.",
  },
  {
    id: "prod-1880",
    name: "Premium Butterfly Style Abaya",
    slug: "premium-butterfly-style-abaya",
    category: "abaya",
    price: 4644,
    originalPrice: 5553,
    discountPercent: 16,
    rating: 4.9,
    reviewsCount: 71,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/premium-butterfly-style-abaya.png",
    tag: "FARASHA",
    inStock: true,
    isNewArrival: false,
    isBestSeller: false,
    sizes: ["Free Size (52-56)"],
    colors: [
      { name: "Jet Black", hex: "#111111" },
      { name: "Dark Plum", hex: "#4F213B" },
    ],
    fabric: "Breathable Chiffon Georgette",
    description: "Sweeping batwing / farasha cut providing graceful flow and universal coverage for any silhouette.",
  },
  {
    id: "prod-1864",
    name: "Premium Dubai Black Abaya",
    slug: "premium-dubai-black-abaya",
    category: "abaya",
    price: 4804,
    originalPrice: 5713,
    discountPercent: 16,
    rating: 5.0,
    reviewsCount: 104,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/premium-dubai-black-abaya.png",
    tag: "BESTSELLER",
    inStock: true,
    isNewArrival: false,
    isBestSeller: true,
    sizes: ["52", "54", "56"],
    colors: [
      { name: "Pitch Black", hex: "#0A0A0A" },
    ],
    fabric: "Premium Dubai Zoom",
    description: "Timeless classic silhouette featuring durable stitching and soft skin-friendly comfort.",
  },
  {
    id: "prod-1892",
    name: "Classic Double Layer Niqab",
    slug: "classic-double-layer-niqab",
    category: "niqab",
    price: 1190,
    originalPrice: 1350,
    discountPercent: 12,
    rating: 4.9,
    reviewsCount: 39,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-double-layer-niqab.png",
    inStock: true,
    isNewArrival: true,
    isBestSeller: false,
    sizes: ["Standard"],
    colors: [
      { name: "Jet Black", hex: "#111111" },
    ],
    fabric: "Airy Japanese Chiffon",
    description: "Dual-layer tie-back niqab with soft eye-slit and completely non-see-through coverage.",
  },
  {
    id: "prod-1868",
    name: "Elegant Front Open Burqa",
    slug: "elegant-front-open-burqa",
    category: "burqa",
    price: 4314,
    originalPrice: 5223,
    discountPercent: 17,
    rating: 4.8,
    reviewsCount: 56,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/elegant-front-open-burqa.png",
    inStock: true,
    isNewArrival: false,
    isBestSeller: false,
    sizes: ["50", "52", "54", "56"],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Navy", hex: "#1B2A4A" },
    ],
    fabric: "Korean Zoom Georgette",
    description: "Concealed snap button closure along the front opening for versatility and easy wear.",
  },
  {
    id: "prod-1898",
    name: "Elegant Prayer Khimar Set",
    slug: "elegant-prayer-khimar-set",
    category: "khimar",
    price: 3774,
    originalPrice: 4683,
    discountPercent: 19,
    rating: 5.0,
    reviewsCount: 62,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/elegant-prayer-khimar-set.png",
    tag: "PRAYER WEAR",
    inStock: true,
    isNewArrival: true,
    isBestSeller: false,
    sizes: ["Free Size"],
    colors: [
      { name: "Soft Mauve", hex: "#8C5E72" },
      { name: "Jet Black", hex: "#111111" },
      { name: "Dark Plum", hex: "#4F213B" },
    ],
    fabric: "Silk-Touch Poly Chiffon",
    description: "Full length prayer khimar with elasticated skirt ensuring 100% compliant prayer coverage.",
  },
  {
    id: "prod-1902",
    name: "Premium Full Prayer Dress",
    slug: "premium-full-prayer-dress",
    category: "modest-sets",
    price: 3784,
    originalPrice: 4693,
    discountPercent: 19,
    rating: 4.9,
    reviewsCount: 48,
    image: "https://borkashop.borbila.net/wp-content/uploads/2026/08/premium-full-prayer-dress.png",
    tag: "PRAYER SET",
    inStock: true,
    isNewArrival: false,
    isBestSeller: false,
    sizes: ["Free Size"],
    colors: [
      { name: "Rose Mauve", hex: "#8C5E72" },
      { name: "Olive Mist", hex: "#6B7D6E" },
    ],
    fabric: "High-grade Turkish Rayon",
    description: "All-in-one head-to-toe prayer gown with integrated soft hijab and wrist straps.",
  },
];

export async function seedProducts() {
  console.log("🔌 Connecting to MongoDB Atlas database 'borkashop'...");
  await mongoose.connect(MONGODB_URI!, { dbName: "borkashop" });
  console.log("✅ Connected to MongoDB Atlas.");

  console.log(`📦 Upserting ${REAL_PRODUCTS.length} real products into 'products' collection...`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const prod of REAL_PRODUCTS) {
    const res = await ProductModel.updateOne(
      { id: prod.id },
      { $set: prod },
      { upsert: true }
    );
    if (res.upsertedCount > 0) {
      insertedCount++;
    } else {
      updatedCount++;
    }
  }

  const totalInDb = await ProductModel.countDocuments();
  console.log(`🎉 Seeding complete!`);
  console.log(`✨ Newly Inserted: ${insertedCount}`);
  console.log(`🔄 Updated/Verified: ${updatedCount}`);
  console.log(`📊 Total real products in MongoDB Atlas 'products' collection: ${totalInDb}`);

  await mongoose.disconnect();
  console.log("👋 Disconnected cleanly from MongoDB Atlas.");
}

// Run directly if called from command line
if (require.main === module) {
  seedProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error seeding products:", err);
      process.exit(1);
    });
}
