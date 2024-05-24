const express = require('express')
const pool = require('./db');
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
const app = express();
var cookieParser = require('cookie-parser')
const dotenv = require('dotenv').config();
const cors = require("cors");
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(express.json());
const bcrypt = require("bcrypt");
app.use(cors({
  origin:'http://localhost:3000', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200
}));

// =-=-=-=-=-=-=register=-=-=-=-=-=-=-
app.post('/register', async(req,res)=>{
  const { email, name, password } = req.body;
console.log(email,name,password)
try {
  const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

  if (user.rows.length > 0) {
      return res.status(401).json("User already exists!");
  }

  const salt = await bcrypt.genSalt(10);
  const bcryptPassword = await bcrypt.hash(password, salt);

  const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, bcryptPassword]
  );

  const newId = newUser.rows[0];
  const jwtToken = jwt.sign({ userId: newId.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return res.json({ jwtToken, userId: newId.id })
} catch (err) {
  console.error(err.message);
  res.status(500).send("Server error");
}
})
// =-=-=-=-=-=-=register=-=-=-=-=-=-=-

// =-=-=-=-=-=-=Login=-=-=-=-=-=-=-
app.post("/login",async(req,res)=>{
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ token, userId: user.rows[0].id });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
})
// =-=-=-=-=-=-=Login=-=-=-=-=-=-=-

// =-=-=-=-=-=-All User=-=-=-=-=-=-=-
app.get('/users', async (req, res) => {
  try {
      const allUsers = await pool.query("SELECT * FROM users");
      res.json(allUsers.rows);
  } catch (err) {
      console.error(err.message);
  }
});
// =-=-=-=-=-=-All User=-=-=-=-=-=-=-

// =-=-=-=-=-=-User By Id=-=-=-=-=-=-=-
app.get('/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
      if (user.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }
      res.json(user.rows[0]);
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server error" });
  }
});
// =-=-=-=-=-=-User By Id=-=-=-=-=-=-=-

// Update user route
app.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
 console.log(name,email,password)
  if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
          'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING *',
          [name, email, hashedPassword, id]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (err) {
      if (err.code === '23505') {
          res.status(400).json({ error: 'Email already exists' });
      } else {
          res.status(500).json({ error: 'Database error' });
          console.error(err);
      }
  }
});
// =-=-=-=-=-=-=--
app.post('/userpost',  async (req, res) => {
  const {image, author, title, content } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO posts (image, author, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [image, author, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// =-=-=-=-=-=-=--
app.get('/allposts', async (req, res) => {
  try {
      const allPost = await pool.query("SELECT * FROM posts");
      res.json(allPost.rows);
  } catch (err) {
      console.error(err.message);
  }
});
// =-=-=-=-=-=-=--
app.get('/userpost/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const user = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);
      if (user.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }
      res.json(user.rows[0]);
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Server error" });
  }
});
// =-=-=-=-=-=-=--
app.put('/userput/:id', async (req, res) => {
   const { id } = req.params;
  const { image, author, title, content } = req.body;
 console.log(image, author, title, content)
 
 if (!image || !title || !author || !content) {
  return res.status(400).json({ error: 'Image, title, author, and content are required' });
}

try {
  const result = await pool.query(
    'UPDATE posts SET image = $1, title = $2, author = $3, content = $4 WHERE id = $5 RETURNING *',
    [image, title, author, content, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json({ message: 'User updated successfully', user: result.rows[0] });
} catch (err) {
  res.status(500).json({ error: 'Database error' });
  console.error(err);
}
});
// =-=-=-=-=-=-=--
app.delete('/deletepost/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleteQuery = `
      DELETE FROM posts
      WHERE id = $1
      RETURNING *;
    `;

    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({ message: 'Post deleted successfully', post: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// =-=-=-=-=-=-=--

// =-=-=-=-=-=-=-=-=-
app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})