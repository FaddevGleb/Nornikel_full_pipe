#!/usr/bin/env node
/**
 * Fail fast when dev ports are already taken (common after an unclean exit).
 */
import net from 'node:net';

const PORTS = [
  { port: 5173, label: 'Vite frontend (npm run dev:frontend)' },
  { port: 3847, label: 'Express API (npm run dev:server / npm start)' },
];

function isPortBusy(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', (error) => {
      resolve(error.code === 'EADDRINUSE');
    });
    probe.once('listening', () => {
      probe.close(() => resolve(false));
    });
    probe.listen(port, host);
  });
}

let blocked = false;

for (const { port, label } of PORTS) {
  // eslint-disable-next-line no-await-in-loop
  if (await isPortBusy(port)) {
    blocked = true;
    console.error(`\n[dev] Port ${port} is already in use (${label}).`);
    console.error(`      Find the process: netstat -ano | findstr :${port}`);
    console.error('      Stop it: taskkill /PID <pid> /F');
    console.error('      Or close the terminal where npm run dev / npm start is still running.\n');
  }
}

if (blocked) {
  process.exit(1);
}
