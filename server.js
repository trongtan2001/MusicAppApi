const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(bodyParser.json());

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "music_app",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database.");
});

// Api get user
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM users WHERE id = ?";

  connection.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching user data:", err);
      return res.status(500).send("Error fetching user data");
    }
    if (result.length > 0) {
      const user = result[0];
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  });
});

// API để đăng nhập
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ?";

  connection.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      return res.status(500).send("Error during login");
    }
    if (results.length > 0) {
      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, message: "Wrong password" });
      }
    } else {
      res.status(401).json({ success: false, message: "Email not exists" });
    }
  });
});

//Api register
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
    connection.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error("Error checking email:", err);
        return res.status(500).send("Error checking email");
      }

      if (results.length > 0) {
        return res.status(400).send("Email already exists");
      } else {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query =
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        connection.query(
          query,
          [name, email, hashedPassword, role],
          (err, result) => {
            if (err) throw err;
          }
        );
      }
    });
  } catch (error) {
    res.status(500).send("Error registering user");
  }
});

//Get favorite song
app.get("/favorites/:id", (req, res) => {
  const userId = req.params.id;
  const query = "SELECT * FROM favorite_songs WHERE user_id = ?";

  connection.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching favorite data:", err);
      return res.status(500).send("Error fetching favorite data");
    }
    if (result.length > 0) {
      res.json({ success: true, favorites: result });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Favorite song not found" });
    }
  });
});

//Add favorite song
app.post("/favorites", async (req, res) => {
  const { user_id, song_id } = req.body;
  try {
    const query = "INSERT INTO favorite_songs (user_id, song_id) VALUES (?, ?)";
    connection.query(query, [user_id, song_id], (err, result) => {
      if (err) {
        console.error("Error adding favorite song:", err);
        return res.status(500).send("Error adding favorite song");
      }
      res.json({ success: true, message: "Favorite song added successfully" });
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    res.status(500).send("Error add faovorite song");
  }
});

//Delete favorite song
app.delete("/favorites", async (req, res) => {
  const { user_id, song_id } = req.body;
  try {
    const query =
      "DELETE FROM favorite_songs WHERE user_id = ? AND song_id = ?";
    connection.query(query, [user_id, song_id], (err, result) => {
      if (err) {
        console.error("Error deleting favorite song:", err);
        return res.status(500).send("Error deleting favorite song");
      }
      if (result.affectedRows > 0) {
        res.json({
          success: true,
          message: "Favorite song deleted successfully",
        });
      } else {
        res
          .status(404)
          .json({ success: false, message: "Favorite song not found" });
      }
    });
  } catch (e) {
    console.error("Unexpected error:", e);
    res.status(500).send("Unexpected error");
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
