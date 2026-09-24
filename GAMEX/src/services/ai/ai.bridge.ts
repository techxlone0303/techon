import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export function getPythonPath(): string {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  const possiblePaths = [
    path.join(process.cwd(), '.venv', 'Scripts', 'python.exe'),
    path.join(process.cwd(), '.venv', 'bin', 'python3'),
    path.join(process.cwd(), '.venv', 'bin', 'python'),
    path.join(process.cwd(), 'ai', 'venv', 'Scripts', 'python.exe'),
    path.join(process.cwd(), 'ai', 'venv', 'bin', 'python3'),
    path.join(process.cwd(), 'venv', 'Scripts', 'python.exe'),
    path.join(process.cwd(), 'venv', 'bin', 'python3'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

const PYTHON = getPythonPath();

function runScript(script: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'ai', script);
    
    const proc = spawn(PYTHON, [scriptPath], {
      cwd: path.join(process.cwd(), 'ai'),
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch (e) {
          resolve({ error: 'Parse error' });
        }
      } else {
        reject(new Error(stderr));
      }
    });

    proc.on('error', reject);

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

export async function runFeatures(matches: any[]) {
  return runScript('feature_engineering.py', { matches });
}

export async function runRAG(query: string) {
  return runScript('rag_store.py', { query });
}

export async function runSimulation(features: any) {
  return runScript('strategy_simulator.py', features);
}

export async function runValorantIntelligence(payload: any) {
  return runScript('valorant_intelligence.py', payload);
}

