import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth, mongoClient, db } from "./auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// =========================================================================
// 1. CORS Configuration
// =========================================================================
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// =========================================================================
// 2. Mount Better Auth Handler (MUST BE BEFORE express.json / body parsers)
// =========================================================================
app.all("/api/auth/*", toNodeHandler(auth));

// =========================================================================
// 3. Body Parsing Middleware
// =========================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================================================
// 4. Database Connection (MongoDB via MongoClient & Mongoose)
// =========================================================================
import { REAL_PRODUCTS } from "./seedProducts";

let isDbConnected = false;

async function initDatabases() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/borkashop";
  try {
    // Connect MongoClient for Better Auth
    await mongoClient.connect();
    // Connect Mongoose for Ecommerce Models (Products, Orders, Customers)
    await mongoose.connect(uri, { dbName: "borkashop" });
    isDbConnected = true;
    console.log("✅ [MongoDB Atlas] Connected successfully to database: borkashop");

    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
      console.log("🌱 Auto-seeding real products into 'products' collection...");
      await ProductModel.insertMany(REAL_PRODUCTS);
      console.log(`✅ Seeded ${REAL_PRODUCTS.length} real products.`);
    } else {
      console.log(`📦 Loaded ${productCount} real products from MongoDB Atlas.`);
    }

    // Auto-seed initial notifications if empty
    const notifCount = await NotificationModel.countDocuments();
    if (notifCount === 0) {
      console.log("🌱 Seeding initial real activity notifications into 'notifications' collection...");
      await NotificationModel.insertMany(SEED_NOTIFICATIONS);
      console.log(`✅ Seeded ${SEED_NOTIFICATIONS.length} notifications.`);
    } else {
      console.log(`🔔 Loaded ${notifCount} notifications from MongoDB Atlas.`);
    }

    // Auto-seed initial review into 'reviews' collection if empty
    const reviewCount = await ReviewModel.countDocuments();
    if (reviewCount === 0) {
      console.log("🌱 Auto-seeding initial review into 'reviews' collection...");
      await ReviewModel.create({
        productId: "prod-1876",
        productName: "Classic Everyday Black Burqa",
        productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-everyday-black-burqa.png",
        userAvatar: "https://lh3.googleusercontent.com/a/ACg8ocKLUoFGZebmRDhPHfzX4jmmuO9MgDubClBCwVM3X3tNSMSf9ag=s96-c",
        userId: null,
        name: "Eyasin Arafat",
        email: "eyasinwebdev@gmail.com",
        rating: 5,
        comment: "ফেব্রিক কোয়ালিটি অনেক ভালো এবং ফিটিং পারফেক্ট হয়েছে। ডেলিভারিও অনেক দ্রুত পেয়েছি। ধন্যবাদ বোরকা শপ!",
        status: "Approved",
      });
      console.log("✅ Seeded initial review.");
    }
  } catch (err: any) {
    isDbConnected = false;
    console.warn("\n⚠️ [MongoDB] Connection Warning:", err.message);
    console.warn("👉 Action Required: Add your MongoDB Atlas connection string to Backend/.env as MONGODB_URI=...\n");
  }
}
initDatabases();

// =========================================================================
// 5. Auth Helper Middleware
// =========================================================================
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please login to continue." });
    }
    (req as any).user = session.user;
    (req as any).session = session.session;
    next();
  } catch (error: any) {
    return res.status(401).json({ success: false, message: "Invalid session." });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    const isAdmin =
      session &&
      ((session.user as any).role === "admin" ||
        (session.user as any).email?.toLowerCase().startsWith("admin") ||
        (session.user as any).email === "admin12@gmail.com");
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }
    (req as any).user = session.user;
    (req as any).session = session.session;
    next();
  } catch (error: any) {
    return res.status(403).json({ success: false, message: "Access denied." });
  }
};

// =========================================================================
// 6. Base & Public API Routes
// =========================================================================
app.get("/", (req: Request, res: Response) => {
  res.json({
    status: "success",
    name: "BorkaShop E-commerce Backend API",
    authProvider: "Better Auth (v1.7.x) + MongoDB",
    database: isDbConnected ? "Connected" : "Pending MongoDB URI",
    port: Number(PORT),
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      authStatus: "/api/auth/status",
      currentUser: "/api/auth/me",
      betterAuthBase: "/api/auth",
      products: "/api/products",
      orders: "/api/orders",
    },
  });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    uptime: process.uptime(),
    status: "OK",
    port: Number(PORT),
    database: isDbConnected ? "Connected" : "Disconnected (Awaiting MONGODB_URI in Backend/.env)",
    authEngine: "Better Auth",
    supportedRoles: ["guest", "user", "admin"],
  });
});

// Better Auth status check
app.get("/api/auth/status", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.json({
        authenticated: false,
        role: "guest",
        user: null,
      });
    }
    const resolvedRole =
      (session.user as any).role === "admin" ||
      (session.user as any).email?.toLowerCase().startsWith("admin") ||
      (session.user as any).email === "admin12@gmail.com"
        ? "admin"
        : (session.user as any).role || "user";

    return res.json({
      authenticated: true,
      role: resolvedRole,
      user: session.user,
    });
  } catch (err: any) {
    return res.json({
      authenticated: false,
      role: "guest",
      error: err.message,
    });
  }
});

// Get currently logged-in user profile
app.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ authenticated: false, user: null });
    }
    return res.json({
      authenticated: true,
      user: session.user,
      session: session.session,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Protected route demo
app.get("/api/user/profile", requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Welcome to your protected profile",
    user: (req as any).user,
  });
});

// Admin-only route demo
app.get("/api/admin/dashboard", requireAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Welcome to Borka Shop Admin Dashboard",
    admin: (req as any).user,
  });
});

// =========================================================================
// Models: Orders & Products (MongoDB Atlas Collection)
// =========================================================================
const OrderModel = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({
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
  email: { type: String, default: "" },
  userKey: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
}, { collection: "orders" }));

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  category: { type: String, required: true },
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
  createdAt: { type: Date, default: Date.now },
}, { collection: "products" });

const ProductModel = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// =========================================================================
// Model: MyCollection (MongoDB Atlas Collection: 'my-collection')
// Real-time synchronization of cart, wishlist, checkout info, and orders
// For all user roles: admin, guest user, user with unique identity
// =========================================================================
const MyCollectionSchema = new mongoose.Schema(
  {
    userKey: { type: String, required: true, unique: true, index: true },
    email: { type: String, index: true },
    phone: { type: String, index: true },
    customerName: { type: String, default: "" },
    role: { type: String, enum: ["admin", "user", "guest"], default: "guest" },
    userId: { type: String },
    cart: { type: Array, default: [] },
    wishlist: { type: Array, default: [] },
    checkoutInfo: {
      fullName: { type: String },
      phone: { type: String },
      address: { type: String },
      deliveryArea: { type: String },
      deliveryCharge: { type: Number },
      couponCode: { type: String },
      appliedDiscount: { type: Number },
      updatedAt: { type: Date, default: Date.now },
    },
    orders: { type: Array, default: [] },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { collection: "my-collection", timestamps: true }
);

const MyCollectionModel =
  mongoose.models.MyCollection ||
  mongoose.model("MyCollection", MyCollectionSchema);

// =========================================================================
// Model: Notifications (MongoDB Atlas Collection)
// =========================================================================
const NotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "order" }, // 'order', 'stock', 'system', 'customer'
    isRead: { type: Boolean, default: false },
    orderId: { type: String },
    price: { type: Number, default: 0 },
    productImage: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "notifications" }
);

const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

// =========================================================================
// Model: StoreSettings (MongoDB Atlas Collection: 'storesettings')
// =========================================================================
const StoreSettingsSchema = new mongoose.Schema(
  {
    insideDhaka: { type: Number, default: 70 },
    outsideDhaka: { type: Number, default: 130 },
    freeShippingThreshold: { type: Number, default: 4000 },
    helplinePhone: { type: String, default: "01793 679 254" },
    helplineEmail: { type: String, default: "support@burkashop.com" },
    enableCod: { type: Boolean, default: true },
    enableBkash: { type: Boolean, default: true },
    enableNagad: { type: Boolean, default: true },
    enableRocket: { type: Boolean, default: true },
  },
  { collection: "storesettings", timestamps: true }
);

const StoreSettingsModel =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", StoreSettingsSchema);

// =========================================================================
// Model: Review (MongoDB Atlas Collection: 'reviews')
// =========================================================================
const ReviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, default: "" },
    productImage: { type: String, default: "" },
    userAvatar: { type: String, default: "" },
    userId: { type: String, default: null },
    name: { type: String, required: true },
    email: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true },
    status: { type: String, default: "Approved" },
  },
  { collection: "reviews", timestamps: true }
);

const ReviewModel =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);

const SEED_NOTIFICATIONS = [
  {
    title: "New Order Placed",
    message: "Order #BS-8921 by Tanzila Rahman for ৳4,350 has been recorded. Fulfillment pending.",
    type: "order",
    isRead: false,
    orderId: "BS-8921",
    price: 4350,
    productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-everyday-black-burqa.png",
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
  },
  {
    title: "SMS Gateway Alert",
    message: "Cash on Delivery confirmation SMS sent to Nusrat Jahan (01712-998877) for Order #BS-8922.",
    type: "order",
    isRead: false,
    orderId: "BS-8922",
    price: 3450,
    productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/dubai-cherry-georgette-abaya.png",
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
  },
  {
    title: "Low Inventory Warning",
    message: "'Luxury Dubai Stone Work Abaya' (Size 54) reached low stock threshold (2 units remaining).",
    type: "stock",
    isRead: false,
    price: 5200,
    productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/premium-crinkle-chiffon-hijab.png",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    title: "Customer Registration",
    message: "Sumaiya Akter created a new customer account via Google Authentication.",
    type: "customer",
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    title: "Order Dispatched",
    message: "Order #BS-8924 for Farhana Islam handed over to SteadFast Courier.",
    type: "order",
    isRead: true,
    orderId: "BS-8924",
    price: 3200,
    productImage: "https://borkashop.borbila.net/wp-content/uploads/2026/08/classic-everyday-black-burqa.png",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
  },
  {
    title: "MongoDB Atlas Connected",
    message: "Primary cluster synced successfully with database 'borkashop'. Automated index verification complete.",
    type: "system",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

// =========================================================================
// Admin & Store REST API Endpoints
// =========================================================================

// -------------------------------------------------------------------------
// Notifications Endpoints (Matching StyleHub /dashboard/notifications)
// -------------------------------------------------------------------------

// GET all / filtered notifications
app.get(["/api/notifications", "/notifications"], async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const type = (req.query.type as string) || "all";

    const query: any = {};
    if (type === "unread") {
      query.isRead = false;
    } else if (type === "read") {
      query.isRead = true;
    } else if (type && type !== "all") {
      query.type = type;
    }

    const [notifications, totalFiltered, unreadCount, totalAll] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments({ isRead: false }),
      NotificationModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalFiltered / limit) || 1;

    res.json({
      success: true,
      notifications,
      unreadCount,
      page,
      totalPages,
      totalCount: totalFiltered,
      counts: {
        all: totalAll,
        unread: unreadCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, notifications: [] });
  }
});

// PUT mark all notifications as read
app.put(["/api/notifications/mark-all-read", "/notifications/mark-all-read"], async (req: Request, res: Response) => {
  try {
    await NotificationModel.updateMany({ isRead: false }, { $set: { isRead: true } });
    res.json({ success: true, message: "All notifications marked as read!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT mark single notification as read
app.put(["/api/notifications/:id/read", "/notifications/:id/read"], async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    let updated = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      updated = await NotificationModel.findByIdAndUpdate(
        id,
        { $set: { isRead: true } },
        { new: true }
      );
    }
    if (!updated) {
      updated = await NotificationModel.findOneAndUpdate(
        { $or: [{ _id: id }, { orderId: id }, { id }] },
        { $set: { isRead: true } },
        { new: true }
      );
    }

    res.json({ success: true, message: "Notification marked as read", notification: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT mark single notification as unread
app.put(["/api/notifications/:id/unread", "/notifications/:id/unread"], async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    let updated = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      updated = await NotificationModel.findByIdAndUpdate(
        id,
        { $set: { isRead: false } },
        { new: true }
      );
    }
    if (!updated) {
      updated = await NotificationModel.findOneAndUpdate(
        { $or: [{ _id: id }, { orderId: id }, { id }] },
        { $set: { isRead: false } },
        { new: true }
      );
    }

    res.json({ success: true, message: "Notification marked as unread", notification: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE single notification
app.delete(["/api/notifications/:id", "/notifications/:id"], async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    let deleted = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await NotificationModel.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await NotificationModel.findOneAndDelete({
        $or: [{ _id: id }, { orderId: id }, { id }],
      });
    }

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE clear all notifications
app.delete(["/api/notifications", "/notifications"], async (req: Request, res: Response) => {
  try {
    await NotificationModel.deleteMany({});
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all orders
app.get("/api/orders", async (req: Request, res: Response) => {
  try {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, orders: [] });
  }
});

// CREATE an order (Saves to 'orders' collection, creates notification, and syncs to 'my-collection')
app.post("/api/orders", async (req: Request, res: Response) => {
  try {
    const orderData = req.body;

    // Safely parse or default createdAt to a valid Date object
    const validCreatedAt =
      orderData.createdAt && !isNaN(new Date(orderData.createdAt).getTime())
        ? new Date(orderData.createdAt)
        : new Date();

    const orderPayload = {
      ...orderData,
      createdAt: validCreatedAt,
      role: orderData.role || "guest",
      status: orderData.status || "Pending",
      deliveryZone: orderData.deliveryZone || "dhaka",
      deliveryFee: Number(orderData.deliveryFee) || 70,
      subtotal: Number(orderData.subtotal) || 0,
      total: Number(orderData.total) || 0,
      paymentMethod: orderData.paymentMethod || "cod",
      email: orderData.email || "",
      userKey: orderData.userKey || "",
    };

    // Save or upsert into MongoDB Atlas 'orders' collection
    const newOrder = await OrderModel.findOneAndUpdate(
      { id: orderPayload.id },
      { $set: orderPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Auto-create notification for new order placed
    try {
      await NotificationModel.create({
        title: "New Order Placed",
        message: `Order #${newOrder.id} by ${newOrder.customerName || "Customer"} for ৳${newOrder.total} has been recorded. Fulfillment pending.`,
        type: "order",
        isRead: false,
        orderId: newOrder.id,
        price: newOrder.total,
        productImage: newOrder.items?.[0]?.productImage || "",
        createdAt: new Date(),
      });
    } catch (notifErr) {
      console.warn("Failed to auto-create order notification:", notifErr);
    }

    // Simultaneously sync into 'my-collection' in database
    try {
      const cleanEmail = orderData.email ? String(orderData.email).toLowerCase().trim() : "";
      const userKey =
        orderData.userKey ||
        (cleanEmail ? `user:${cleanEmail}` : (orderData.phone ? `phone_${orderData.phone}` : `order_${newOrder.id}`));

      const isRegistered = cleanEmail || String(userKey).startsWith("user:");
      let myColQuery: any;
      if (isRegistered) {
        myColQuery = {
          $or: [
            { userKey: `user:${cleanEmail}` },
            { email: cleanEmail },
          ],
        };
      } else {
        myColQuery = { userKey };
      }

      const existingDoc = await MyCollectionModel.findOne(myColQuery);
      const orderObj = newOrder.toObject ? newOrder.toObject() : newOrder;

      if (!existingDoc) {
        await MyCollectionModel.create({
          userKey,
          email: cleanEmail,
          phone: orderData.phone || "",
          customerName: orderData.customerName || "",
          role: orderData.role || "guest",
          cart: [],
          wishlist: [],
          orders: [{ ...orderObj, updatedAt: new Date() }],
          lastActiveAt: new Date(),
        });
      } else {
        const orderExists = existingDoc.orders.some((o: any) => o.id === newOrder.id);
        const updateOps: any = {
          $set: {
            cart: [], // Clear cart upon placing order
            lastActiveAt: new Date(),
            updatedAt: new Date(),
            customerName: orderData.customerName || existingDoc.customerName,
            phone: orderData.phone || existingDoc.phone,
          },
        };
        if (!orderExists) {
          updateOps.$push = { orders: { ...orderObj, updatedAt: new Date() } };
        }
        await MyCollectionModel.findOneAndUpdate(myColQuery, updateOps, { new: true });
      }
    } catch (mcErr) {
      console.warn("Failed to auto-sync order to my-collection:", mcErr);
    }

    console.log(`✅ Order #${newOrder.id} successfully saved to 'orders' & 'my-collection' collections.`);
    res.status(201).json({ success: true, order: newOrder });
  } catch (err: any) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE order status (Updates in 'OrderModel' AND 'my-collection')
app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const updated = await OrderModel.findOneAndUpdate(
      { id: orderId },
      { status },
      { new: true }
    );

    // Simultaneously update status in 'my-collection' where this order exists
    try {
      await MyCollectionModel.updateMany(
        { "orders.id": orderId },
        {
          $set: {
            "orders.$.status": status,
            "orders.$.updatedAt": new Date(),
            lastActiveAt: new Date(),
          },
        }
      );
    } catch (mcErr) {
      console.warn("Failed to sync order status to my-collection:", mcErr);
    }

    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// Real-time 'my-collection' Endpoints
// Live store user activity: cart, wishlist, checkout info, and orders
// =========================================================================

// GET user document from 'my-collection'
app.get("/api/my-collection", async (req: Request, res: Response) => {
  try {
    const { userKey, email } = req.query;

    let query: any = null;

    if (email || (userKey && String(userKey).startsWith("user:"))) {
      // 1. REGISTERED USER: Strictly check by userKey or email (NEVER by device or guest phone)
      const cleanEmail = email
        ? String(email).toLowerCase().trim()
        : String(userKey).replace("user:", "").toLowerCase().trim();

      query = {
        $or: [
          { userKey: `user:${cleanEmail}` },
          { email: cleanEmail },
        ],
      };
    } else if (userKey && String(userKey).startsWith("guest:")) {
      // 2. ONLY GUEST USER: Strictly check by guest device key
      query = { userKey: String(userKey) };
    } else if (userKey) {
      query = { userKey: String(userKey) };
    } else {
      return res.status(400).json({ success: false, message: "userKey or email is required" });
    }

    const doc = await MyCollectionModel.findOne(query).lean();
    res.json({ success: true, data: doc || null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all documents in 'my-collection' (Admin / Store Overview)
app.get("/api/my-collection/all", async (req: Request, res: Response) => {
  try {
    const allDocs = await MyCollectionModel.find().sort({ updatedAt: -1 }).lean();
    res.json({ success: true, count: allDocs.length, data: allDocs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/my-collection/sync (Real-time sync for cart, wishlist, checkout, orders)
app.post("/api/my-collection/sync", async (req: Request, res: Response) => {
  try {
    const {
      userKey,
      email,
      phone,
      customerName,
      role,
      userId,
      cart,
      wishlist,
      checkoutInfo,
      order,
      isNewUser,
    } = req.body;

    if (!userKey && !email) {
      return res.status(400).json({ success: false, message: "userKey or email is required" });
    }

    const isRegistered = email || (userKey && String(userKey).startsWith("user:"));
    let primaryKey: string;
    let query: any;

    if (isRegistered) {
      // Registered User: strictly isolated by email
      const cleanEmail = email
        ? email.toLowerCase().trim()
        : String(userKey).replace("user:", "").toLowerCase().trim();
      primaryKey = `user:${cleanEmail}`;
      query = {
        $or: [
          { userKey: primaryKey },
          { email: cleanEmail },
        ],
      };
    } else {
      // Guest User: strictly isolated by guest device ID
      primaryKey = userKey;
      query = { userKey: primaryKey };
    }

    // If new user registration: guarantee clean fresh state with zero guest items
    if (isNewUser) {
      const cleanDoc = await MyCollectionModel.findOneAndUpdate(
        query,
        {
          $set: {
            userKey: primaryKey,
            email: email ? email.toLowerCase().trim() : "",
            phone: phone ? String(phone) : "",
            customerName: customerName || "",
            role: role || "user",
            userId: userId || "",
            cart: [],
            wishlist: [],
            orders: [],
            checkoutInfo: {},
            lastActiveAt: new Date(),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { new: true, upsert: true }
      );
      return res.json({ success: true, message: "New user initialized with clean collection", data: cleanDoc });
    }

    const updateFields: any = {
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };

    if (email) updateFields.email = email.toLowerCase().trim();
    if (phone) updateFields.phone = String(phone);
    if (customerName) updateFields.customerName = customerName;
    if (role) updateFields.role = role;
    if (userId) updateFields.userId = userId;

    if (cart !== undefined) updateFields.cart = cart;
    if (wishlist !== undefined) updateFields.wishlist = wishlist;
    if (checkoutInfo !== undefined) updateFields.checkoutInfo = checkoutInfo;

    const updateQuery: any = {
      $set: updateFields,
      $setOnInsert: {
        userKey: primaryKey,
        createdAt: new Date(),
      },
    };

    // If an order is present
    if (order && order.id) {
      const orderCreatedAt =
        order.createdAt && !isNaN(new Date(order.createdAt).getTime())
          ? new Date(order.createdAt)
          : new Date();
      const sanitizedOrder = {
        ...order,
        createdAt: orderCreatedAt,
        updatedAt: new Date(),
      };

      const existingDoc = await MyCollectionModel.findOne(query);
      if (!existingDoc) {
        const created = await MyCollectionModel.create({
          userKey: primaryKey,
          email: email || "",
          phone: phone || "",
          customerName: customerName || "",
          role: role || "guest",
          userId: userId || "",
          cart: cart || [],
          wishlist: wishlist || [],
          checkoutInfo: checkoutInfo || {},
          orders: [sanitizedOrder],
          lastActiveAt: new Date(),
        });
        return res.json({ success: true, message: "Created and synced order", data: created });
      }

      const orderExists = existingDoc.orders.some((o: any) => o.id === order.id);
      if (!orderExists) {
        updateQuery.$push = { orders: sanitizedOrder };
      }
    }

    const updated = await MyCollectionModel.findOneAndUpdate(
      query,
      updateQuery,
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Synced successfully to my-collection", data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// Store & Shipping Settings API
// Real-time synchronization of delivery fees, thresholds, and support info
// =========================================================================

// GET current store settings from 'storesettings' collection
app.get(["/api/settings", "/api/storesettings"], async (req: Request, res: Response) => {
  try {
    let settings = await StoreSettingsModel.findOne().lean();
    if (!settings) {
      settings = await StoreSettingsModel.create({
        insideDhaka: 70,
        outsideDhaka: 130,
        freeShippingThreshold: 4000,
        helplinePhone: "01793 679 254",
        helplineEmail: "support@burkashop.com",
        enableCod: true,
        enableBkash: true,
        enableNagad: true,
        enableRocket: true,
      });
    }
    res.json({ success: true, settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE store settings in 'storesettings' collection
app.put(["/api/settings", "/api/storesettings"], async (req: Request, res: Response) => {
  try {
    const updateData = req.body;
    const settings = await StoreSettingsModel.findOneAndUpdate(
      {},
      {
        $set: {
          insideDhaka: Number(updateData.insideDhaka) ?? 70,
          outsideDhaka: Number(updateData.outsideDhaka) ?? 130,
          freeShippingThreshold: Number(updateData.freeShippingThreshold) ?? 4000,
          helplinePhone: updateData.helplinePhone || "01793 679 254",
          helplineEmail: updateData.helplineEmail || "support@burkashop.com",
          enableCod: updateData.enableCod !== undefined ? !!updateData.enableCod : true,
          enableBkash: updateData.enableBkash !== undefined ? !!updateData.enableBkash : true,
          enableNagad: updateData.enableNagad !== undefined ? !!updateData.enableNagad : true,
          enableRocket: updateData.enableRocket !== undefined ? !!updateData.enableRocket : true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Store & Shipping settings updated in 'storesettings' collection: Inside Dhaka = ৳${settings.insideDhaka}, Outside Dhaka = ৳${settings.outsideDhaka}`);
    res.json({ success: true, message: "Settings saved to storesettings collection", settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// Reviews Routes (Collection: 'reviews')
// =========================================================================

// GET reviews (optional ?productId=...&limit=...)
app.get("/api/reviews", async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.productId) {
      filter.productId = String(req.query.productId);
    }
    const limit = Number(req.query.limit) || 50;
    const reviews = await ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, count: reviews.length, reviews });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, reviews: [] });
  }
});

// POST create a new review
app.post("/api/reviews", async (req: Request, res: Response) => {
  try {
    const {
      productId,
      productName,
      productImage,
      userAvatar,
      userId,
      name,
      email,
      rating,
      comment,
    } = req.body;

    if (!productId || !name || !email || !comment) {
      return res.status(400).json({
        success: false,
        error: "Product ID, Name, Email, and Comment are required",
      });
    }

    const review = await ReviewModel.create({
      productId: String(productId),
      productName: productName || "",
      productImage: productImage || "",
      userAvatar: userAvatar || "",
      userId: userId || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: comment.trim(),
      status: "Approved",
    });

    // Update product reviewsCount & rating
    try {
      const allProdReviews = await ReviewModel.find({ productId: String(productId) });
      const count = allProdReviews.length;
      const avg =
        count > 0
          ? Number(
              (
                allProdReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) /
                count
              ).toFixed(1)
            )
          : 5.0;

      await ProductModel.findOneAndUpdate(
        { id: String(productId) },
        { $set: { reviewsCount: count, rating: avg } }
      );
    } catch (e) {
      console.warn("Could not recalculate product rating:", e);
    }

    // Emitting notification for Admin
    try {
      await NotificationModel.create({
        title: "New Product Review",
        message: `${name.trim()} reviewed "${productName || "Product"}" (${review.rating}★): "${review.comment.substring(0, 50)}${review.comment.length > 50 ? "..." : ""}"`,
        type: "review",
        isRead: false,
        price: 0,
        productImage: productImage || "",
      });
    } catch (e) {
      console.warn("Could not create review notification:", e);
    }

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a review
app.delete("/api/reviews/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    let deleted = null;
    const { ObjectId } = await import("mongodb");
    try {
      deleted = await ReviewModel.findByIdAndDelete(new ObjectId(id));
    } catch {
      deleted = await ReviewModel.findOneAndDelete({ _id: id });
    }

    if (deleted && deleted.productId) {
      const allProdReviews = await ReviewModel.find({ productId: deleted.productId });
      const count = allProdReviews.length;
      const avg =
        count > 0
          ? Number(
              (
                allProdReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) /
                count
              ).toFixed(1)
            )
          : 5.0;

      await ProductModel.findOneAndUpdate(
        { id: deleted.productId },
        { $set: { reviewsCount: count, rating: avg } }
      );
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE order
app.delete("/api/orders/:id", async (req: Request, res: Response) => {
  try {
    await OrderModel.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all products
app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find().sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, products: [] });
  }
});

// CREATE product
app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE product
app.put("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE product
app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    await ProductModel.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: "Product deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// Real Customers CRUD API Endpoints (MongoDB Atlas user & orders collections)
// =========================================================================

// GET all customers
app.get("/api/admin/customers", async (req: Request, res: Response) => {
  try {
    const [users, orders] = await Promise.all([
      db.collection("user").find().toArray(),
      OrderModel.find().lean(),
    ]);

    const customerList: any[] = [];
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();

    // 1. Registered accounts from MongoDB
    for (const u of users) {
      const email = u.email || "";
      if (email) seenEmails.add(email.toLowerCase());
      const userOrders = orders.filter(
        (o: any) =>
          (email && o.email?.toLowerCase() === email.toLowerCase()) ||
          (u.phone && o.phone === u.phone) ||
          (u.name && o.customerName?.toLowerCase() === u.name.toLowerCase())
      );
      const totalSpent = userOrders.reduce(
        (sum: number, o: any) => sum + (o.total || 0),
        0
      );
      const lastOrder =
        userOrders[0]?.createdAt ||
        (u.createdAt
          ? new Date(u.createdAt).toLocaleDateString()
          : "Registered User");

      customerList.push({
        id: u._id.toString(),
        name: u.name || "Customer",
        email: u.email,
        phone: u.phone || (userOrders[0]?.phone || "N/A"),
        address: userOrders[0]?.address || "Registered Member",
        role: u.role === "admin" ? "Admin" : "Registered Member",
        totalOrders: userOrders.length,
        totalSpent,
        lastOrder:
          typeof lastOrder === "string"
            ? lastOrder
            : new Date(lastOrder).toLocaleDateString(),
        createdAt: u.createdAt,
      });
    }

    // 2. Verified guest shoppers from orders
    for (const ord of orders) {
      const phone = ord.phone || "";
      const email = (ord as any).email || "";
      if (email && seenEmails.has(email.toLowerCase())) continue;
      if (phone && seenPhones.has(phone)) continue;
      if (phone) seenPhones.add(phone);
      if (email) seenEmails.add(email.toLowerCase());

      const guestOrders = orders.filter(
        (o: any) => phone && o.phone === phone
      );
      const totalSpent = guestOrders.reduce(
        (sum: number, o: any) => sum + (o.total || 0),
        0
      );

      customerList.push({
        id: `CUST-${ord.id}`,
        name: ord.customerName,
        email:
          email ||
          `${ord.customerName.toLowerCase().replace(/[^a-z]/g, "")}@customer.borkashop.com`,
        phone: ord.phone,
        address: ord.address,
        role: "Guest Shopper",
        totalOrders: guestOrders.length,
        totalSpent,
        lastOrder: ord.createdAt,
        createdAt: ord.createdAt,
      });
    }

    res.json({ success: true, count: customerList.length, customers: customerList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, customers: [] });
  }
});

// CREATE customer
app.post("/api/admin/customers", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, role } = req.body;
    const newCustomer = {
      name: name || "New Customer",
      email: email || `${Date.now()}@customer.borkashop.com`,
      phone: phone || "",
      role: role || "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection("user").insertOne(newCustomer);
    res.status(201).json({ success: true, customer: { ...newCustomer, id: result.insertedId.toString() } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE customer
app.put("/api/admin/customers/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { ObjectId } = await import("mongodb");
    const { name, phone, role } = req.body;
    
    if (id.startsWith("CUST-")) {
      const orderId = id.replace("CUST-", "");
      await OrderModel.updateMany({ id: orderId }, { $set: { customerName: name, phone } });
    } else {
      try {
        await db.collection("user").updateOne(
          { _id: new ObjectId(id) },
          { $set: { name, phone, role, updatedAt: new Date() } }
        );
      } catch {
        await db.collection("user").updateOne(
          { id },
          { $set: { name, phone, role, updatedAt: new Date() } }
        );
      }
    }
    res.json({ success: true, message: "Customer updated successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE customer
app.delete("/api/admin/customers/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (id.startsWith("CUST-")) {
      const orderId = id.replace("CUST-", "");
      await OrderModel.deleteMany({ id: orderId });
    } else {
      const { ObjectId } = await import("mongodb");
      try {
        await db.collection("user").deleteOne({ _id: new ObjectId(id) });
      } catch {
        await db.collection("user").deleteOne({ id });
      }
    }
    res.json({ success: true, message: "Customer removed successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Admin Executive Overview Metrics
app.get("/api/admin/metrics", async (req: Request, res: Response) => {
  try {
    const [orders, products, users] = await Promise.all([
      OrderModel.find().lean(),
      ProductModel.find().lean(),
      db.collection("user").find().toArray(),
    ]);

    const validOrders = orders.filter((o: any) => o.status !== "Cancelled");
    const totalRevenue = validOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const avgOrderValue = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    // Unique verified customer phones + users
    const uniquePhones = new Set(orders.map((o: any) => o.phone).filter(Boolean));
    const totalCustomers = uniquePhones.size + users.length;

    res.json({
      success: true,
      metrics: {
        totalRevenue,
        avgOrderValue,
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === "Pending").length,
        processingOrders: orders.filter((o: any) => o.status === "Processing").length,
        shippedOrders: orders.filter((o: any) => o.status === "Shipped").length,
        deliveredOrders: orders.filter((o: any) => o.status === "Delivered").length,
        cancelledOrders: orders.filter((o: any) => o.status === "Cancelled").length,
        totalProducts: products.length,
        inStockProducts: products.filter((p: any) => p.inStock).length,
        outOfStockProducts: products.filter((p: any) => !p.inStock).length,
        totalCustomers,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404 Handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// =========================================================================
// 7. Server Listener
// =========================================================================
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 BorkaShop Backend running on http://localhost:${PORT}`);
  console.log(`🔐 Better Auth endpoint mounted on http://localhost:${PORT}/api/auth`);
  console.log(`📡 CORS configured for Frontend at: ${CLIENT_URL}`);
  console.log(`=================================================\n`);
});
