import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

const app = express();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
});

dotenv.config();

const { Pool } = pkg;

// Add JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your_fallback_secret",
    (err, user) => {
      if (err)
        return res.status(403).json({ message: "Invalid or Expired Token" });
      req.user = user;
      next();
    },
  );
};

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ PostgreSQL connection error:", err));

// AFTER
app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  // Handle preflight OPTIONS requests immediately
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
// RSVP Endpoints
app.post("/api/rsvp", async (req, res) => {
  try {
    const {
      eventId,
      eventTitle,
      name,
      email,
      studentId,
      phone,
      university,
      department,
      semester,
      ...rest
    } = req.body;

    if (!eventId || !eventTitle || !name || !email || !studentId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    const query = `
      INSERT INTO rsvps (event_id, event_title, name, email, student_id, phone, university, department, semester, extra_fields)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      eventId,
      eventTitle,
      name,
      email,
      studentId,
      phone || "",
      university || "",
      department || "",
      semester || "",
      JSON.stringify(rest),
    ];

    const result = await pool.query(query, values);
    return res
      .status(201)
      .json({ message: "Registration successful!", rsvp: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ message: "You are already registered for this event." });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

app.get("/api/rsvp/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const query =
      "SELECT * FROM rsvps WHERE event_id = $1 ORDER BY registered_at DESC";
    const result = await pool.query(query, [eventId]);

    return res.json({ count: result.rows.length, registrations: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const result = await pool.query(
      "SELECT * FROM events ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/gallery", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const result = await pool.query(
      "SELECT * FROM gallery ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/team", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const result = await pool.query(
      "SELECT * FROM team ORDER BY rank ASC LIMIT $1",
      [limit],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post(
  "/api/dashboard/sync",
  apiLimiter,
  authenticateToken,
  async (req, res) => {
    const { events = [], gallery = [], team = [] } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");

      // 1. Sync Events
      await client.query("DELETE FROM events");
      for (const ev of events) {
        await client.query(
          `INSERT INTO events (title, description, date, month, year, time, venue, image_url, status, register_link, drive_link) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            ev.title || '',
            ev.description || '',
            ev.date || '',
            ev.month || '',
            ev.year || '',
            ev.time || '',
            ev.venue || '',
            ev.image_url || ev.image || '',
            ev.status || 'upcoming',
            ev.register_link || '',
            ev.drive_link || ''
          ]
        );
      }

      // 2. Sync Gallery
      await client.query("DELETE FROM gallery");
      for (const gal of gallery) {
        await client.query(
          `INSERT INTO gallery (image_url, caption) VALUES ($1, $2)`, 
          [
            gal.image_url || gal.image || '',
            gal.caption || ''
          ]
        );
      }

      // 3. Sync Team (Safely parse rank to integer)
      await client.query("DELETE FROM team");
      for (const tm of team) {
        // Parse rank to integer, fallback to 99 if missing/invalid
        const safeRank = tm.rank && !isNaN(tm.rank) ? parseInt(tm.rank, 10) : 99;

        await client.query(
          `INSERT INTO team (name, role, image_url, category, rank) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            tm.name || '',
            tm.role || tm.designation || '',
            tm.image_url || tm.image || '',
            tm.category || 'Team',
            safeRank
          ]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Sync successful" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Sync error:", err);
      res.status(500).json({ error: "Failed to sync changes: " + err.message });
    } finally {
      client.release();
    }
  }
);

// Admin Login Endpoint
app.post("/api/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL || "admin@sense.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET || "fallback_secret",
      {
        expiresIn: "2h",
      },
    );
    return res.json({ message: "Login successful", token });
  }

  return res.status(401).json({ message: "Invalid email or password" });
});

// Endpoint to verify token when Dashboard loads
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
