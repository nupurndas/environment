const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// In-memory storage with test user
const users = [
  { id: 1, uid: 'admin', password: 'admin123', name: 'Administrator', email: 'admin@tms.com' }
];
const timesheets = [];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TMS Backend API',
      version: '1.0.0',
      description: 'Time Management System Backend API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
app.post('/api/login', (req, res) => {
  const { uid, password } = req.body;
  const user = users.find(u => u.uid === uid && u.password === password);
  
  if (user) {
    res.json({ success: true, user: { id: user.id, uid: user.uid, name: user.name, email: user.email } });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uid:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
app.post('/api/users', (req, res) => {
  const user = { id: users.length + 1, ...req.body };
  users.push(user);
  res.status(201).json(user);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 */
app.get('/api/users', (req, res) => {
  res.json(users);
});

/**
 * @swagger
 * /api/timesheet:
 *   post:
 *     summary: Create a timesheet entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               project:
 *                 type: string
 *               task:
 *                 type: string
 *               hours:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Timesheet entry created
 */
app.post('/api/timesheet', (req, res) => {
  const entry = { id: timesheets.length + 1, ...req.body, createdAt: new Date() };
  timesheets.push(entry);
  res.status(201).json(entry);
});

/**
 * @swagger
 * /api/timesheet:
 *   get:
 *     summary: Get all timesheet entries
 *     responses:
 *       200:
 *         description: List of timesheet entries
 */
app.get('/api/timesheet', (req, res) => {
  res.json(timesheets);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on port ${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
  console.log(`CORS enabled for: ${FRONTEND_URL}`);
});
