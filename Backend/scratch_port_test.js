import net from 'net';

const testPort = (host, port) => {
  return new Promise((resolve) => {
    console.log(`Testing connection to ${host}:${port}...`);
    const socket = new net.Socket();
    const startTime = Date.now();

    socket.setTimeout(5000);

    socket.connect(port, host, () => {
      const duration = Date.now() - startTime;
      console.log(`[Success] Connected to ${host}:${port} in ${duration}ms`);
      socket.destroy();
      resolve({ host, port, success: true, duration });
    });

    socket.on('error', (err) => {
      console.log(`[Error] Failed to connect to ${host}:${port} - ${err.message}`);
      socket.destroy();
      resolve({ host, port, success: false, error: err.message });
    });

    socket.on('timeout', () => {
      console.log(`[Timeout] Connection timed out for ${host}:${port}`);
      socket.destroy();
      resolve({ host, port, success: false, error: 'Timeout' });
    });
  });
};

// Route for diagnostic port test on deployed server
export const runPortDiagnostics = async () => {
  const targets = [
    { host: 'smtp.gmail.com', port: 587 },
    { host: 'smtp.gmail.com', port: 465 },
    { host: 'smtp.sendgrid.net', port: 2525 },
    { host: 'smtp.sendgrid.net', port: 587 },
    { host: 'smtp-relay.brevo.com', port: 587 },
    { host: 'smtp-relay.brevo.com', port: 2525 },
    { host: 'www.google.com', port: 80 },
    { host: 'www.google.com', port: 443 },
  ];

  const results = [];
  for (const target of targets) {
    const res = await testPort(target.host, target.port);
    results.push(res);
  }
  return results;
};
