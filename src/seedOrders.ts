import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/borkashop";

const OrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    deliveryZone: { type: String, default: "dhaka" },
    deliveryFee: { type: Number, default: 70 },
    items: { type: Array, default: [] },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "cod" },
    status: { type: String, default: "Pending" },
    role: { type: String, default: "guest" },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: true,
    collection: "orders",
  }
);

export const OrderModel =
  mongoose.models.Order || mongoose.model("Order", OrderSchema);

export const REAL_INITIAL_ORDERS = [
  {
    id: "BS-8921",
    customerName: "Ayesha Siddiqua",
    phone: "01712345678",
    address: "House 14, Road 5, Dhanmondi, Dhaka",
    deliveryZone: "dhaka",
    deliveryFee: 70,
    items: [
      {
        productId: "prod-1876",
        productName: "Classic Everyday Black Burqa",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-everyday-black-burqa.png",
        size: "54",
        color: "Jet Black",
        quantity: 1,
        price: 3034,
      },
    ],
    subtotal: 3034,
    total: 3104,
    paymentMethod: "cod",
    status: "Processing",
    role: "user",
    createdAt: "Today, 10:30 AM",
  },
  {
    id: "BS-8920",
    customerName: "Nusrat Jahan",
    phone: "01898765432",
    address: "Flat 4B, Green Road, Farmgate, Dhaka",
    deliveryZone: "dhaka",
    deliveryFee: 70,
    items: [
      {
        productId: "prod-1918",
        productName: "Elegant Modest Two Piece Set",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-lightweight-long-niqab.png",
        size: "52",
        color: "Mocha",
        quantity: 1,
        price: 4924,
      },
      {
        productId: "prod-1924",
        productName: "Classic Lightweight Long Niqab",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-lightweight-long-niqab.png",
        size: "Standard",
        color: "Jet Black",
        quantity: 2,
        price: 1250,
      },
    ],
    subtotal: 7424,
    total: 7494,
    paymentMethod: "bkash",
    status: "Pending",
    role: "guest",
    createdAt: "Today, 09:15 AM",
  },
  {
    id: "BS-8919",
    customerName: "Farhana Akter",
    phone: "01933445566",
    address: "Chittagong GEC Circle, Nasirabad, Chattogram",
    deliveryZone: "outside_dhaka",
    deliveryFee: 130,
    items: [
      {
        productId: "prod-1876",
        productName: "Classic Everyday Black Burqa",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-everyday-black-burqa.png",
        size: "56",
        color: "Black",
        quantity: 1,
        price: 3034,
      },
    ],
    subtotal: 3034,
    total: 3164,
    paymentMethod: "cod",
    status: "Shipped",
    role: "user",
    createdAt: "Yesterday, 04:45 PM",
  },
  {
    id: "BS-8918",
    customerName: "Sadia Rahman",
    phone: "01677889900",
    address: "Block C, Bashundhara R/A, Dhaka",
    deliveryZone: "dhaka",
    deliveryFee: 70,
    items: [
      {
        productId: "prod-1924",
        productName: "Classic Lightweight Long Niqab",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-lightweight-long-niqab.png",
        size: "Extra Long",
        color: "Dark Coffee",
        quantity: 1,
        price: 1250,
      },
    ],
    subtotal: 1250,
    total: 1320,
    paymentMethod: "nagad",
    status: "Delivered",
    role: "guest",
    createdAt: "2 days ago",
  },
  {
    id: "BS-8917",
    customerName: "Sumaiya Islam",
    phone: "01799887766",
    address: "Sector 7, Road 12, Uttara, Dhaka",
    deliveryZone: "dhaka",
    deliveryFee: 70,
    items: [
      {
        productId: "prod-5171",
        productName: "Elegant Premium Nida Burqa",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-everyday-black-burqa.png",
        size: "54",
        color: "Jet Black",
        quantity: 1,
        price: 4950,
      },
    ],
    subtotal: 4950,
    total: 5020,
    paymentMethod: "bkash",
    status: "Delivered",
    role: "user",
    createdAt: "3 days ago",
  },
  {
    id: "BS-8915",
    customerName: "Tahsina Karim",
    phone: "01555667788",
    address: "Sylhet Sadar, Zindabazar, Sylhet",
    deliveryZone: "outside_dhaka",
    deliveryFee: 130,
    items: [
      {
        productId: "prod-1918",
        productName: "Elegant Modest Two Piece Set",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-lightweight-long-niqab.png",
        size: "54",
        color: "Black",
        quantity: 1,
        price: 4924,
      },
    ],
    subtotal: 4924,
    total: 5054,
    paymentMethod: "cod",
    status: "Cancelled",
    role: "user",
    createdAt: "4 days ago",
  },
];

export async function seedOrders() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    const existingCount = await OrderModel.countDocuments();
    console.log(`Current orders count in collection: ${existingCount}`);

    if (existingCount === 0) {
      console.log("Seeding real initial orders into MongoDB Atlas...");
      for (const orderData of REAL_INITIAL_ORDERS) {
        await OrderModel.create(orderData);
        console.log(`+ Seeded order: ${orderData.id} (${orderData.customerName})`);
      }
      console.log(`Successfully seeded ${REAL_INITIAL_ORDERS.length} real orders!`);
    } else {
      console.log("Orders already exist in MongoDB Atlas. Skipping initial seed.");
    }

    const finalCount = await OrderModel.countDocuments();
    console.log(`Final orders in database: ${finalCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding orders:", error);
    process.exit(1);
  }
}

seedOrders();
