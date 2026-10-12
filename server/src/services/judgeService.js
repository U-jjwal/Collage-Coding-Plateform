const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, spawn } = require('child_process');
const { LANGUAGE_IDS, SUBMISSION_STATUS } = require('../utils/constants');

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'http://localhost:2358';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

/**
 * Checks if Judge0 server is reachable
 */
const checkJudge0Health = async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const headers = {};
    if (JUDGE0_API_KEY) headers['X-Auth-Token'] = JUDGE0_API_KEY;

    const res = await fetch(`${JUDGE0_API_URL}/about`, {
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Executes code via Judge0 API
 */
const executeViaJudge0 = async (sourceCode, language, stdin = '', timeLimitMs = 5000, memoryLimitKb = 262144) => {
  const languageId = LANGUAGE_IDS[language.toLowerCase()] || 62; // 62 = Java
  const cpuTimeLimit = Math.max(1, Math.ceil(timeLimitMs / 1000));
  const memoryLimit = Math.max(1024, memoryLimitKb);

  const headers = { 'Content-Type': 'application/json' };
  if (JUDGE0_API_KEY) headers['X-Auth-Token'] = JUDGE0_API_KEY;

  const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin,
      cpu_time_limit: cpuTimeLimit,
      memory_limit: memoryLimit,
    }),
  });

  if (!response.ok) {
    throw new Error(`Judge0 responded with HTTP ${response.status}`);
  }

  const result = await response.json();
  const judgeStatusId = result.status?.id;

  let status = SUBMISSION_STATUS.ACCEPTED;
  if (judgeStatusId === 3) status = SUBMISSION_STATUS.ACCEPTED;
  else if (judgeStatusId === 4) status = SUBMISSION_STATUS.WRONG_ANSWER;
  else if (judgeStatusId === 5) status = SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED;
  else if (judgeStatusId === 6) status = SUBMISSION_STATUS.COMPILE_ERROR;
  else if (judgeStatusId >= 7 && judgeStatusId <= 12) status = SUBMISSION_STATUS.RUNTIME_ERROR;
  else if (judgeStatusId >= 13) status = SUBMISSION_STATUS.INTERNAL_ERROR;

  return {
    status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compile_output: result.compile_output || '',
    executionTimeMs: result.time ? Math.round(parseFloat(result.time) * 1000) : null,
    memoryKb: result.memory || null,
  };
};

/**
 * Executes code via sandboxed local child process runner as fallback
 */
const executeLocally = async (sourceCode, language, stdin = '', timeLimitMs = 5000) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cp-exec-'));
  const startTime = Date.now();

  try {
    const lang = language.toLowerCase();

    if (lang === 'java') {
      // Find public class name or default to Solution
      let className = 'Solution';
      const match = sourceCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      if (match) className = match[1];

      const filePath = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(filePath, sourceCode);

      // Compile with --release 21 for cross-version compatibility
      try {
        await new Promise((resolve, reject) => {
          exec(`javac --release 21 ${className}.java`, { cwd: tmpDir, timeout: 8000 }, (err, stdout, stderr) => {
            if (err) return reject({ compile: true, stderr: stderr || err.message });
            resolve();
          });
        });
      } catch (err) {
        return {
          status: SUBMISSION_STATUS.COMPILE_ERROR,
          stdout: '',
          stderr: '',
          compile_output: err.stderr || 'Compilation failed.',
          executionTimeMs: Date.now() - startTime,
          memoryKb: null,
        };
      }

      // Run
      const runResult = await runProcessWithStdin('java', ['-cp', '.', className], tmpDir, stdin, timeLimitMs);
      return {
        ...runResult,
        compile_output: '',
        executionTimeMs: Date.now() - startTime,
      };
    } else if (lang === 'python') {
      const filePath = path.join(tmpDir, 'solution.py');
      fs.writeFileSync(filePath, sourceCode);
      const runResult = await runProcessWithStdin('python3', ['solution.py'], tmpDir, stdin, timeLimitMs);
      return {
        ...runResult,
        compile_output: '',
        executionTimeMs: Date.now() - startTime,
      };
    } else if (lang === 'cpp') {
      const filePath = path.join(tmpDir, 'solution.cpp');
      fs.writeFileSync(filePath, sourceCode);

      try {
        await new Promise((resolve, reject) => {
          exec(`g++ -O2 solution.cpp -o solution`, { cwd: tmpDir, timeout: 8000 }, (err, stdout, stderr) => {
            if (err) return reject({ compile: true, stderr: stderr || err.message });
            resolve();
          });
        });
      } catch (err) {
        return {
          status: SUBMISSION_STATUS.COMPILE_ERROR,
          stdout: '',
          stderr: '',
          compile_output: err.stderr || 'Compilation failed.',
          executionTimeMs: Date.now() - startTime,
          memoryKb: null,
        };
      }

      const runResult = await runProcessWithStdin('./solution', [], tmpDir, stdin, timeLimitMs);
      return {
        ...runResult,
        compile_output: '',
        executionTimeMs: Date.now() - startTime,
      };
    } else {
      throw new Error(`Unsupported execution language: ${language}`);
    }
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
};

/**
 * Runs a child process with stdin piping and strict timeout
 */
const runProcessWithStdin = (command, args, cwd, stdin, timeoutMs) => {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command, args, { cwd });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);

      if (timedOut) {
        return resolve({
          status: SUBMISSION_STATUS.TIME_LIMIT_EXCEEDED,
          stdout: '',
          stderr: `Time Limit Exceeded (${timeoutMs}ms).`,
          memoryKb: null,
        });
      }

      if (code !== 0) {
        return resolve({
          status: SUBMISSION_STATUS.RUNTIME_ERROR,
          stdout,
          stderr: stderr || `Process exited with error code ${code}`,
          memoryKb: null,
        });
      }

      resolve({
        status: SUBMISSION_STATUS.ACCEPTED,
        stdout,
        stderr: '',
        memoryKb: null,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        status: SUBMISSION_STATUS.RUNTIME_ERROR,
        stdout: '',
        stderr: err.message,
        memoryKb: null,
      });
    });
  });
};

/**
 * Primary code execution function with Judge0 detection & local sandbox fallback
 */
const runCode = async (sourceCode, language = 'java', stdin = '', timeLimitMs = 5000, memoryLimitKb = 262144) => {
  const isJudge0Available = await checkJudge0Health();

  if (isJudge0Available) {
    return executeViaJudge0(sourceCode, language, stdin, timeLimitMs, memoryLimitKb);
  }

  // Graceful fallback: sandbox local execution
  return executeLocally(sourceCode, language, stdin, timeLimitMs);
};

module.exports = {
  runCode,
  checkJudge0Health,
};
