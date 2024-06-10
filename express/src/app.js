require('dotenv').config();

const express = require('express');
const session = require('express-session');
const SyncManager = require('./common/syncManager');
const syncRoutes = require('./routes/syncRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

const syncManager = new SyncManager();
const xeroConnector = syncManager.getConnector('unf-xero');

app.use('/api/sync', syncRoutes);

app.get('/xero/auth', (req, res) => xeroConnector.authenticate(req, res));
app.get('/xero/callback', async (req, res) => {
    const message = await xeroConnector.callback(req);
    res.send(message);
});

syncManager.start();

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('If Xero authentication is required, visit: http://localhost:3000/xero/auth');
});