require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('FATAL UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL UNHANDLED REJECTION:', reason);
  process.exit(1);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { sequelize } = require('./models');
const apiRoutes = require('./routes/api');
const setupSockets = require('./controllers/socketController');

const app = express();
const server = http.createServer(app);

// CORS configuration - allow all for local dev
app.use(cors());
app.use(express.json());

const io = new Server(server, {
  path: '/masterclass/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use('/masterclass/api', apiRoutes);

setupSockets(io);

const path = require('path');

const PORT = process.env.PORT || 3001;

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use('/masterclass', express.static(path.join(__dirname, '../frontend/dist')));
  app.get('/masterclass/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
  
  // Redirect root to the subpath
  app.get('/', (req, res) => {
    res.redirect('/masterclass');
  });
}

// Sync DB and start server
sequelize.sync().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.error('FATAL DATABASE CONNECTION ERROR:', err);
  console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
  process.exit(1);
});
