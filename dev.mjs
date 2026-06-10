
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

const uvicorn = resolve(root, '.venv', 'Scripts', 'uvicorn.exe');
const backendDir = resolve(root, 'backend');
const frontendDir = resolve(root, 'frontend');

function color(code, text) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

function prefix(tag, line) {
  const tags = { backend: color('33', '[backend]'), frontend: color('36', '[frontend]') };
  return `${tags[tag] ?? tag} ${line}`;
}

function run(label, cmd, args, cwd, shell = false) {
  const proc = spawn(cmd, args, { cwd, shell, stdio: 'pipe' });

  proc.stdout.on('data', (d) =>
    d.toString().split('\n').filter(Boolean).forEach((l) => console.log(prefix(label, l)))
  );
  proc.stderr.on('data', (d) =>
    d.toString().split('\n').filter(Boolean).forEach((l) => console.error(prefix(label, l)))
  );
  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(prefix(label, `exited with code ${code}`));
    }
  });

  return proc;
}

console.log(color('33', '\n  DAAI Fellowship — dev server'));
console.log(color('90', '  Backend  → http://localhost:8001'));
console.log(color('90', '  Frontend → http://localhost:5173'));
console.log(color('90', '  Admin    → http://localhost:5173/admin.html'));
console.log(color('90', '  Press Ctrl+C to stop.\n'));

const backend = run('backend', uvicorn, ['app.main:app', '--port', '8001', '--reload'], backendDir);
const frontend = run('frontend', 'npm', ['run', 'dev'], frontendDir, true);

function shutdown() {
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
