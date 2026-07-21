const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("JWT_SECRET =", process.env.JWT_SECRET);
const reviewRoutes = require("./routes/review.routes");
const ratingRoutes = require("./routes/rating.routes");

const adminRoutes = require("./routes/admin.routes");
const favoriteRoutes = require("./routes/favorite.routes");

const actorRoutes = require("./routes/actor.routes");
const directorRoutes = require("./routes/director.routes");
const movieActorRoutes = require("./routes/movieActor.routes");
const authRoutes = require("./routes/auth.routes");
const movieRoutes = require("./routes/movie.routes");
const auth = require("./middleware/auth");
const path = require("path");
const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

// Middleware FIRST
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/movies", auth, movieRoutes);
app.use("/api/reviews", auth, reviewRoutes);
app.use("/api/ratings", auth, ratingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/favorites", auth, favoriteRoutes);
app.use("/api/actors", actorRoutes);
app.use("/api/directors", directorRoutes);
app.use("/api/movie-actors", movieActorRoutes);
app.get("/", (req, res) => {
  res.json({
    app: "Movix API",
    version: "1.0.0",
    status: "Running 🚀"
  });
});
app.get("/api/profile", auth, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed successfully",
    user: req.user
  });
});

const PORT = process.env.PORT || 5000;
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`🚀 Movix API is running on port ${PORT}`);
});
