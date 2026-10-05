import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env in project root
dotenv.config({ path: path.join(rootDir, '.env') });

const SERVER_IP = process.env.SERVER_IP?.trim();
let SERVER_PORT = parseInt(process.env.SERVER_PORT?.trim() || '22', 10);
if (SERVER_PORT === 80 || SERVER_PORT === 443) {
  SERVER_PORT = 22;
}
const SERVER_USER = process.env.SERVER_USER?.trim() || 'root';
let SERVER_PASSWORD = process.env.SERVER_PASSWORD?.trim();
const SERVER_SSH_KEY = process.env.SERVER_SSH_KEY?.trim();
const SERVER_DOMAIN = process.env.SERVER_DOMAIN?.trim();
const SERVER_NEW_PASSWORD = process.env.SERVER_NEW_PASSWORD?.trim();

// Strip quotes if user entered them in .env
if (SERVER_PASSWORD && SERVER_PASSWORD.startsWith('"') && SERVER_PASSWORD.endsWith('"')) {
  SERVER_PASSWORD = SERVER_PASSWORD.slice(1, -1);
}

function exitWithError(message) {
  console.error(`\n❌ Error: ${message}`);
  process.exit(1);
}

// 1. Validation
if (!SERVER_IP) {
  exitWithError(
    'Server IP address is not specified in the .env file (SERVER_IP=...). Please update your .env file.'
  );
}

if (!SERVER_PASSWORD && !SERVER_SSH_KEY) {
  exitWithError(
    'Server password (SERVER_PASSWORD) or SSH key path (SERVER_SSH_KEY) is not provided in the .env file.'
  );
}

console.log('==============================================');
console.log('🚀 Starting automated server deployment');
console.log(`🌐 Server IP:   ${SERVER_IP}`);
console.log(`👤 User:        ${SERVER_USER}`);
console.log(`🔌 Port:        ${SERVER_PORT}`);
if (SERVER_DOMAIN) console.log(`🏷️ Domain:      ${SERVER_DOMAIN}`);
console.log('==============================================\n');

// 2. Build application locally
console.log('📦 1. Building production bundle (npm run build)...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Build completed successfully.\n');
} catch (err) {
  exitWithError('Build failed. Please check the project build errors.');
}

const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  exitWithError('dist directory not found!');
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
          reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
        }
      });
      stream.on('data', (data) => {
        stdout += data.toString();
      });
      stream.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    });
  });
}

function sftpUploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function sftpUploadDir(sftp, localDir, remoteDir, conn) {
  await executeRemote(conn, `mkdir -p "${remoteDir}"`);
  const items = fs.readdirSync(localDir);

  for (const item of items) {
    const localItemPath = path.join(localDir, item);
    const remoteItemPath = `${remoteDir}/${item}`.replace(/\\/g, '/');
    const stat = fs.statSync(localItemPath);

    if (stat.isDirectory()) {
      await sftpUploadDir(sftp, localItemPath, remoteItemPath, conn);
    } else {
      await sftpUploadFile(sftp, localItemPath, remoteItemPath);
    }
  }
}

// Check and handle mandatory first-time password change on fresh VPS
function checkAndChangeExpiredPassword(currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    const tempConn = new Client();
    tempConn.on('ready', () => {
      tempConn.shell({ term: 'xterm' }, (err, stream) => {
        if (err) {
          tempConn.end();
          return reject(err);
        }

        let buffer = '';
        let step = 0; // 0: init, 1: sent current, 2: sent new, 3: sent retype

        const timeout = setTimeout(() => {
          tempConn.end();
          if (buffer.includes('#') || buffer.includes('$')) {
            resolve({ changed: false });
          } else {
            reject(new Error('No response received from the server shell within the timeout.'));
          }
        }, 10000);

        stream.on('data', (data) => {
          const text = data.toString();
          buffer += text;

          if (buffer.includes('Current password:') && step === 0) {
            if (!newPassword) {
              clearTimeout(timeout);
              tempConn.end();
              return reject(new Error('EXPIRED_PASSWORD_REQUIRED'));
            }
            step = 1;
            stream.write(currentPassword + '\n');
          } else if (buffer.includes('New password:') && (step === 1 || step === 0)) {
            step = 2;
            stream.write(newPassword + '\n');
          } else if (buffer.includes('Retype new password:') && step === 2) {
            step = 3;
            stream.write(newPassword + '\n');
          } else if (
            (buffer.includes('password updated successfully') ||
              buffer.includes('#') ||
              buffer.includes('$')) &&
            step >= 2
          ) {
            clearTimeout(timeout);
            tempConn.end();
            resolve({ changed: true });
          }
        });

        stream.on('close', () => {
          clearTimeout(timeout);
          tempConn.end();
          if (step >= 2) resolve({ changed: true });
        });
      });
    });

    tempConn.on('error', (err) => {
      reject(err);
    });

    tempConn.connect({
      host: SERVER_IP,
      port: SERVER_PORT,
      username: SERVER_USER,
      password: currentPassword,
      readyTimeout: 20000,
    });
  });
}

async function runDeployment(activePassword) {
  const conn = new Client();

  conn.on('ready', async () => {
    console.log('🔑 2. SSH connection established with server.');

    try {
      // Check & install Nginx
      console.log('🔧 3. Checking and preparing Nginx on server...');
      await executeRemote(
        conn,
        `export DEBIAN_FRONTEND=noninteractive
which nginx > /dev/null 2>&1 || (apt-get update -y && apt-get install -y nginx)`
      );
      console.log('✅ Nginx web server is ready.');

      // Prepare target directories
      console.log('📁 4. Creating destination directories on server...');
      const remoteWebRoot = '/var/www/wordy';
      const remoteDistPath = `${remoteWebRoot}/dist`;
      await executeRemote(conn, `mkdir -p "${remoteDistPath}"`);

      // SFTP session
      console.log('📤 5. Uploading build files (dist/) to server...');
      conn.sftp(async (err, sftp) => {
        if (err) {
          exitWithError(`Failed to establish SFTP session: ${err.message}`);
        }

        try {
          await sftpUploadDir(sftp, distDir, remoteDistPath, conn);
          console.log('✅ All project files uploaded to server successfully.');

          // Configure Nginx
          console.log('⚙️ 6. Configuring Nginx web server...');
          let nginxConf = fs.readFileSync(path.join(rootDir, 'nginx.conf'), 'utf-8');
          if (SERVER_DOMAIN) {
            nginxConf = nginxConf.replace('server_name _;', `server_name ${SERVER_DOMAIN};`);
          }

          const tempNginxPath = '/tmp/wordy_nginx.conf';
          await new Promise((res, rej) => {
            const stream = sftp.createWriteStream(tempNginxPath);
            stream.on('close', res);
            stream.on('error', rej);
            stream.end(nginxConf);
          });

          await executeRemote(
            conn,
            `cp ${tempNginxPath} /etc/nginx/sites-available/wordy
ln -sf /etc/nginx/sites-available/wordy /etc/nginx/sites-enabled/wordy
rm -f /etc/nginx/sites-enabled/default
chown -R www-data:www-data ${remoteWebRoot}
chmod -R 755 ${remoteWebRoot}
nginx -t
systemctl restart nginx`
          );
          console.log('✅ Nginx configuration applied and service restarted successfully.');

          // Open firewall port 80/443 if ufw is installed
          await executeRemote(
            conn,
            `if command -v ufw > /dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' || ufw allow 80/tcp
fi`
          ).catch(() => {});

          console.log('\n==============================================');
          console.log('🎉 Deployment completed successfully!');
          console.log(`🌐 Application URL:`);
          console.log(`   http://${SERVER_IP}`);
          if (SERVER_DOMAIN) {
            console.log(`   http://${SERVER_DOMAIN}`);
          }
          console.log('==============================================\n');

          conn.end();
          process.exit(0);
        } catch (uploadErr) {
          console.error('❌ Error during file upload or configuration:', uploadErr);
          conn.end();
          process.exit(1);
        }
      });
    } catch (remoteErr) {
      console.error('❌ Error executing commands on server:', remoteErr);
      conn.end();
      process.exit(1);
    }
  });

  conn.on('error', (err) => {
    exitWithError(`Server connection failed: ${err.message}`);
  });

  const sshConfig = {
    host: SERVER_IP,
    port: SERVER_PORT,
    username: SERVER_USER,
    readyTimeout: 30000,
  };

  if (SERVER_SSH_KEY) {
    try {
      sshConfig.privateKey = fs.readFileSync(SERVER_SSH_KEY);
    } catch (keyErr) {
      exitWithError(`Unable to read SSH key file: ${SERVER_SSH_KEY}`);
    }
  } else if (activePassword) {
    sshConfig.password = activePassword;
  }

  console.log(`🔌 Connecting to ${SERVER_USER}@${SERVER_IP}:${SERVER_PORT}...`);
  conn.connect(sshConfig);
}

function testAuth(password) {
  return new Promise((resolve) => {
    const c = new Client();
    c.on('ready', () => {
      c.exec('echo OK', (err, stream) => {
        if (err) {
          c.end();
          return resolve({ ok: false, expired: true });
        }
        let out = '';
        stream.on('data', (d) => {
          out += d.toString();
        });
        stream.stderr.on('data', (d) => {
          out += d.toString();
        });
        stream.on('close', (code) => {
          c.end();
          resolve({ ok: code === 0, expired: out.includes('password has expired') });
        });
      });
    });
    c.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });
    c.connect({
      host: SERVER_IP,
      port: SERVER_PORT,
      username: SERVER_USER,
      password: password,
      readyTimeout: 10000,
    });
  });
}

// Main execution flow
async function main() {
  if (SERVER_PASSWORD) {
    console.log('🔍 Checking initial server status and authentication...');
    const test = await testAuth(SERVER_PASSWORD);
    if (!test.ok) {
      if (test.expired) {
        try {
          const result = await checkAndChangeExpiredPassword(SERVER_PASSWORD, SERVER_NEW_PASSWORD);
          if (result.changed) {
            console.log('🔑 New password successfully configured on the server.');
            const envPath = path.join(rootDir, '.env');
            let envContent = fs.readFileSync(envPath, 'utf-8');
            envContent = envContent.replace(
              /SERVER_PASSWORD=.*/,
              `SERVER_PASSWORD="${SERVER_NEW_PASSWORD}"`
            );
            fs.writeFileSync(envPath, envContent, 'utf-8');
            SERVER_PASSWORD = SERVER_NEW_PASSWORD;
          }
        } catch (err) {
          if (err.message === 'EXPIRED_PASSWORD_REQUIRED') {
            console.log('\n⚠️ Server warning: Default server password has expired (First Login).');
            console.log('The server operating system requires setting a new password.');
            console.log(
              'Please set SERVER_NEW_PASSWORD in the .env file with a strong new password to automatically update it and proceed with deployment.\n'
            );
            process.exit(1);
          }
        }
      } else if (test.error) {
        exitWithError(`Server authentication failed: ${test.error}`);
      }
    }
  }

  await runDeployment(SERVER_PASSWORD);
}

main();
