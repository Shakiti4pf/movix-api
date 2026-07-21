const express = require("express");
const pool = require("../config/database");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const router = express.Router();

// Link an actor to a movie
router.post("/", auth, admin, async (req, res) => {
  try {
    const { movie_id, actor_id } = req.body;

    const result = await pool.query(
      `INSERT INTO movie_actors(movie_id, actor_id)
       VALUES($1,$2)
       RETURNING *`,
      [movie_id, actor_id]
    );

    res.status(201).json({
      success: true,
      link: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success:false,
      message:"Server error"
    });
  }
});

module.exports = router;
