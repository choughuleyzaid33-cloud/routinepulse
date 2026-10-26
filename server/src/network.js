import os from 'os';
import QRCode from 'qrcode';
import localtunnel from 'localtunnel';

let activeTunnel = null;
let tunnelUrl = null;
let tunnelQrCode = null;

export function getLocalIpAddress() {
  const nets = os.networkInterfaces();
  let bestIp = '127.0.0.1';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Find IPv4 non-internal
      if (net.family === 'IPv4' && !net.internal) {
        // Prioritize Wi-Fi or Ethernet
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan') || name.toLowerCase().includes('eth')) {
          return net.address;
        }
        bestIp = net.address;
      }
    }
  }

  return bestIp;
}

export async function getNetworkInfo(port = 5000) {
  const localIp = getLocalIpAddress();
  const localUrl = `http://${localIp}:${port}`;

  let localQrCode = null;
  try {
    localQrCode = await QRCode.toDataURL(localUrl, { margin: 1.5, scale: 6 });
  } catch (err) {
    console.error('Error generating local QR code:', err);
  }

  return {
    localIp,
    port,
    localUrl,
    localQrCode,
    tunnel: {
      active: !!activeTunnel,
      url: tunnelUrl,
      qrCode: tunnelQrCode
    }
  };
}

export async function startRemoteTunnel(port = 5000) {
  if (activeTunnel && tunnelUrl) {
    return { active: true, url: tunnelUrl, qrCode: tunnelQrCode };
  }

  try {
    console.log('[Tunnel] Starting secure remote tunnel for mobile access on port', port);
    // Create random subdomain or custom prefix
    const subdomain = `zaid-pulse-${Math.random().toString(36).substring(2, 7)}`;
    activeTunnel = await localtunnel({ port, subdomain });
    tunnelUrl = activeTunnel.url;

    tunnelQrCode = await QRCode.toDataURL(tunnelUrl, { margin: 1.5, scale: 6 });

    activeTunnel.on('close', () => {
      console.log('[Tunnel] Remote tunnel closed.');
      activeTunnel = null;
      tunnelUrl = null;
      tunnelQrCode = null;
    });

    activeTunnel.on('error', err => {
      console.warn('[Tunnel Error]', err.message);
    });

    console.log(`[Tunnel] Remote tunnel active at: ${tunnelUrl}`);
    return { active: true, url: tunnelUrl, qrCode: tunnelQrCode };
  } catch (err) {
    console.error('[Tunnel Start Failed]', err);
    activeTunnel = null;
    tunnelUrl = null;
    tunnelQrCode = null;
    throw err;
  }
}

export async function stopRemoteTunnel() {
  if (activeTunnel) {
    try {
      activeTunnel.close();
    } catch (e) {}
    activeTunnel = null;
    tunnelUrl = null;
    tunnelQrCode = null;
  }
  return { active: false, url: null, qrCode: null };
}
