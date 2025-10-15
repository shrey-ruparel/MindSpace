require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8000;

// Configure CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

// Parse JSON bodies
app.use(express.json());
// Parse URL-encoded bodies with increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure security headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: [
                "'self'", 
                "http://localhost:*", 
                "https://*.cloudinary.com",
                "https://api.cloudinary.com"
            ],
            imgSrc: ["'self'", "https://res.cloudinary.com", "data:", "blob:"],
            mediaSrc: ["'self'", "https://res.cloudinary.com", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            formAction: ["'self'"],
            frameSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"]
        }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.get('/', (req, res) => {
    res.send('Node.js backend is running!');
});

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const forumRoutes = require('./routes/forumRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const screeningRoutes = require('./routes/screeningRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const counsellorRoutes = require('./routes/counsellorRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/screenings', screeningRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/counsellors', counsellorRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(require('./middleware/errorHandler'));