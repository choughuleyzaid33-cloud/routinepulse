import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Force India Standard Time (IST) on Cloud Containers / Render
process.env.TZ = process.env.TZ || 'Asia/Kolkata';

import { router } from './routes.js';
import { startScheduler } from './scheduler.js';
import { reconnectAllActiveWhatsAppSessions } from './whatsapp-client.js';
import { getLocalIpAddress } from './network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.use('/api', router);

// Serve static frontend in production if built
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static Files] Serving built client from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start Server on all interfaces (0.0.0.0)
app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log(`====================================================`);
  console.log(` RoutinePulse 24/7 Multi-User Automation Engine`);
  console.log(` Local URL:         http://localhost:${PORT}`);
  console.log(` Phone (Wi-Fi):     http://${localIp}:${PORT}`);
  console.log(` Public Status:     http://localhost:${PORT}/api/status`);
  console.log(`====================================================`);

  // Start background scheduler
  startScheduler();

  // Reconnect all active user WhatsApp sessions
  reconnectAllActiveWhatsAppSessions();

  // 24/7 Cloud Keep-Alive (Prevents Render / Koyeb free tier from sleeping)
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
  if (externalUrl) {
    console.log(`[Keep-Alive] 24/7 Auto-Ping active for: ${externalUrl}`);
    setInterval(async () => {
      try {
        const pingUrl = `${externalUrl}/api/status`;
        await fetch(pingUrl);
        console.log(`[Keep-Alive] Pinged ${pingUrl} at ${new Date().toLocaleTimeString()} - Staying awake.`);
      } catch (err) {
        console.warn('[Keep-Alive Error]', err.message);
      }
    }, 9 * 60 * 1000); // Ping every 9 minutes (Render sleeps at 15m)
  }
});
