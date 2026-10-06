import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env') });

const SERVER_IP = process.env.SERVER_IP?.trim();
let SERVER_PORT = parseInt(process.env.SERVER_PORT?.trim() || '22', 10);
if (SERVER_PORT === 80 || SERVER_PORT === 443) {
  SERVER_PORT = 22;
}
const SERVER_USER = process.env.SERVER_USER?.trim() || 'root';
let SERVER_PASSWORD = process.env.SERVER_PASSWORD?.trim();
const SERVER_SSH_KEY = process.env.SERVER_SSH_KEY?.trim();

if (SERVER_PASSWORD && SERVER_PASSWORD.startsWith('"') && SERVER_PASSWORD.endsWith('"')) {
  SERVER_PASSWORD = SERVER_PASSWORD.slice(1, -1);
}

function exitWithError(message) {
  console.error(`\n❌ Error: ${message}`);
  process.exit(1);
}

if (!SERVER_IP) {
  exitWithError('SERVER_IP is not defined in .env');
}

if (!SERVER_PASSWORD && !SERVER_SSH_KEY) {
  exitWithError('SERVER_PASSWORD or SERVER_SSH_KEY is required in .env');
}

function executeRemote(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('close', (code, signal) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command failed with code ${code}:\n${stderr || stdout}`));
        }
      });
      stream.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });
      stream.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });
    });
  });
}

async function run() {
  console.log('==============================================');
  console.log('🔒 Starting automated SSL (Let\'s Encrypt) setup');
  console.log(`🌐 Server:  ${SERVER_USER}@${SERVER_IP}:${SERVER_PORT}`);
  console.log('🏷️ Domains: wordy.ir, www.wordy.ir');
  console.log('==============================================\n');

  const conn = new Client();

  conn.on('ready', async () => {
    console.log('🔌 SSH connection established.');

    try {
      console.log('\n📦 1. Checking & installing Certbot and Nginx plugin...');
      await executeRemote(
        conn,
        `export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y certbot python3-certbot-nginx`
      );
      console.log('✅ Certbot packages installed successfully.');

      console.log('\n🛡️ 2. Updating firewall rules (allowing 80 & 443)...');
      await executeRemote(
        conn,
        `if command -v ufw > /dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 'Nginx Full'
fi`
      ).catch(() => {});
      console.log('✅ Firewall verified.');

      console.log('\n📜 3. Requesting Let\'s Encrypt certificate for wordy.ir & www.wordy.ir...');
      await executeRemote(
        conn,
        `certbot --nginx -d wordy.ir -d www.wordy.ir --non-interactive --agree-tos --register-unsafely-without-email --redirect`
      );
      console.log('✅ Certificate obtained and Nginx configured with HTTPS & automatic redirect.');

      console.log('\n🔍 4. Verifying Nginx configuration and restarting...');
      await executeRemote(
        conn,
        `nginx -t && systemctl reload nginx`
      );
      console.log('✅ Nginx configuration valid and reloaded.');

      console.log('\n==============================================');
      console.log('🎉 SSL Setup completed successfully!');
      console.log('🔒 Secure Application URL:');
      console.log('   https://wordy.ir');
      console.log('   https://www.wordy.ir');
      console.log('==============================================\n');

      conn.end();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Error during SSL setup:', err.message);
      conn.end();
      process.exit(1);
    }
  });

  conn.on('error', (err) => {
    exitWithError(`SSH connection error: ${err.message}`);
  });

  const sshConfig = {
    host: SERVER_IP,
    port: SERVER_PORT,
    username: SERVER_USER,
    readyTimeout: 30000,
  };

  if (SERVER_SSH_KEY) {
    sshConfig.privateKey = fs.readFileSync(SERVER_SSH_KEY);
  } else {
    sshConfig.password = SERVER_PASSWORD;
  }

  console.log(`🔌 Connecting to ${SERVER_USER}@${SERVER_IP}:${SERVER_PORT}...`);
  conn.connect(sshConfig);
}

run();
