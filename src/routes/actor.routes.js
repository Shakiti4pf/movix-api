const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();
/**
 * @swagger
 * /api/actors:
 *   post:
 *     summary: Create a new actor
 *     tags:
 *       - Actors
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               birth_date:
 *                 type: string
 *                 format: date
 *               photo_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Actor created successfully
 */
// Create actor (Admin only)
router.post("/", auth, admin, async (req, res) => {
  try {
    const { name, bio, birth_date, photo_url } = req.body;

    const result = await pool.query(
      `INSERT INTO actors (name, bio, birth_date, photo_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, bio, birth_date, photo_url]
    );

    res.status(201).json({
      success: true,
      actor: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});
/**
 * @swagger
 * /api/actors:
 *   get:
 *     summary: Get all actors
 *     tags:
 *       - Actors
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of actors
 */
// Get all actors
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM actors ORDER BY name ASC"
    );

    res.json({
      success: true,
      actors: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
