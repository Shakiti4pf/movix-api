const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const JWT_SECRET = process.env.JWT_SECRET;
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}
const router = express.Router();
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

const accessToken = generateAccessToken(user);
const refreshToken = generateRefreshToken();

await pool.query(
  `INSERT INTO refresh_tokens (user_id, token)
   VALUES ($1, $2)`,
  [user.id, refreshToken]
);
res.json({
    success: true,
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }
});
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
router.post("/refresh", async (req, res) => {
  try {
const { refreshToken } = req.body;

if (!refreshToken) {
    return res.status(401).json({
        success: false,
        message: "Refresh token required"
    });
}

const debugResult = await pool.query(
    "SELECT token, LENGTH(token) AS len FROM refresh_tokens ORDER BY id DESC LIMIT 1"
);

console.log("Received:", refreshToken);
console.log("Length:", refreshToken.length);
console.log("DB Token:", debugResult.rows[0].token);
console.log("DB Length:", debugResult.rows[0].len);
console.log("Match:", refreshToken === debugResult.rows[0].token);

const result = await pool.query(
    "SELECT * FROM refresh_tokens WHERE token = $1",
    [refreshToken]
);

if (result.rows.length === 0) {
    return res.status(403).json({
        success: false,
        message: "Invalid refresh token"
    });
}
    const tokenRow = result.rows[0];

    const userResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [tokenRow.user_id]
    );

    const user = userResult.rows[0];

    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
module.exports = router;
