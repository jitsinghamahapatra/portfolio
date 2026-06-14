import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'jit-portfolio-secret-key-2026';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json());

// Ensure required directories exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(UPLOADS_DIR));

const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultData = {
  portfolio: {
    name: "Jit Singha Mahapatra",
    title: "Hello,\nI'm Jit!",
    bio: "I am a creative Front-end Developer and UI Designer based in India with extensive experience in building responsive web applications. I approach problems in a rational way and seek the simplest, most functional solutions.",
    linkedin: "https://www.linkedin.com/in/jitsinghamahapatra/",
    contact: {
      location: "West Bengal, India",
      email: "jitsinghamahapatra2006@gmail.com",
      phone: "+91 9933****15"
    },
    education: [
      {
        id: 1,
        date: "2024 - Present",
        title: "B.Sc. Computer Science",
        subtitle: "P.R.M.S. Mahavidyalaya, Bankura"
      },
      {
        id: 2,
        date: "2022 - 2024",
        title: "HS In Science",
        subtitle: "Simlapal M.M. High School, Bankura"
      }
    ],
    experience: [
      {
        id: 1,
        date: "2024 - Present",
        title: "UG Software Engineer",
        subtitle: "Web Developer",
        description: "Designed and developed scalable web solutions while improving performance and user experience across platforms."
      },
      {
        id: 2,
        date: "2021 - 2023",
        title: "Thumbnail Designer",
        subtitle: "Remote",
        description: "Designed high-converting YouTube thumbnails and social media graphics, focusing on strong visual hierarchy and audience engagement."
      }
    ],
    tags: ["Creativity", "Leadership", "ProblemSolving", "Agile"],
    activities: [
      {
        id: 1,
        date: "2025",
        title: "Web Developer",
        subtitle: "Design Many web Pages"
      },
      {
        id: 2,
        date: "2022",
        title: "Content Creation",
        subtitle: "Create Contents in youtube"
      }
    ],
    skills: {
      software: ["Ps", "Ai", "Canva", "Blender", "Affinity", "Vs"],
      coding: "HTML • CSS • JS\nJAVA • Python • C/C++",
      pills: ["UI/UX Design", "Thumbnail Design", "Visualization"]
    },
    languages: [
      {
        id: 1,
        name: "Bengali",
        level: "Native"
      },
      {
        id: 2,
        name: "English",
        level: "Fluent"
      },
      {
        id: 3,
        name: "Hindi",
        level: "Basic"
      }
    ],
    hobbies: [
      {
        id: 1,
        icon: "📷",
        name: "Photography"
      },
      {
        id: 2,
        icon: "🧑‍💻",
        name: "Coding"
      },
      {
        id: 3,
        icon: "🎮",
        name: "Gaming"
      },
      {
        id: 4,
        icon: "✈️",
        name: "Travel"
      }
    ],
    resumeUrl: "/uploads/Jit_Singha_Mahapatra_Resume.pdf",
    avatarUrl: "/uploads/my_img.jpeg"
  },
  messages: []
};

// Load or Initialize DB
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database:", error);
    return defaultData;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error("Error writing to database:", error);
    return false;
  }
}

// Multer Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Keep name consistent or append timestamp
    const ext = path.extname(file.originalname);
    if (file.fieldname === 'resume') {
      cb(null, 'Jit_Singha_Mahapatra_Resume.pdf'); // keep constant or dynamic
    } else if (file.fieldname === 'avatar') {
      cb(null, 'my_img.jpeg');
    } else {
      cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    }
  }
});
const upload = multer({ storage: storage });

// Admin Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token is invalid or expired' });
    req.user = user;
    next();
  });
};

// --- API ENDPOINTS ---

// Public: Get Portfolio details
app.get('/api/portfolio', (req, res) => {
  const db = readDB();
  res.json(db.portfolio);
});

// Public: Submit a contact message
app.post('/api/messages', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const db = readDB();
  const newMessage = {
    id: Date.now().toString(),
    name,
    email,
    subject: subject || 'No Subject',
    message,
    date: new Date().toISOString()
  };

  db.messages.push(newMessage);
  writeDB(db);

  res.status(201).json({ success: true, message: 'Message sent successfully!' });
});

// Admin: Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Invalid username or password' });
});

// Admin: Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// Admin: Update portfolio
app.post('/api/portfolio', authenticateToken, (req, res) => {
  const db = readDB();
  db.portfolio = { ...db.portfolio, ...req.body };
  writeDB(db);
  res.json({ success: true, message: 'Portfolio updated successfully!', portfolio: db.portfolio });
});

// Admin: Get contact messages
app.get('/api/messages', authenticateToken, (req, res) => {
  const db = readDB();
  res.json(db.messages);
});

// Admin: Delete contact message
app.delete('/api/messages/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const initialLength = db.messages.length;
  db.messages = db.messages.filter(msg => msg.id !== id);
  
  if (db.messages.length === initialLength) {
    return res.status(404).json({ error: 'Message not found' });
  }

  writeDB(db);
  res.json({ success: true, message: 'Message deleted successfully!' });
});

// Admin: Upload profile image / resume
app.post('/api/upload', authenticateToken, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'resume', maxCount: 1 }
]), (req, res) => {
  const db = readDB();
  
  if (req.files['avatar']) {
    db.portfolio.avatarUrl = `/uploads/my_img.jpeg?t=${Date.now()}`; // cache busting query param
  }
  
  if (req.files['resume']) {
    db.portfolio.resumeUrl = `/uploads/Jit_Singha_Mahapatra_Resume.pdf?t=${Date.now()}`;
  }

  writeDB(db);
  res.json({
    success: true,
    message: 'Files uploaded successfully!',
    avatarUrl: db.portfolio.avatarUrl,
    resumeUrl: db.portfolio.resumeUrl
  });
});

// Serve frontend in production
const DIST_DIR = path.join(__dirname, 'dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    // Avoid capturing api routes
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
