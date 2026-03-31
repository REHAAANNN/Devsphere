import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type ExecuteRequestBody = {
  language?: 'javascript' | 'python' | 'c' | 'java';
  code?: string;
};

type PistonExecutionResponse = {
  run?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
    signal?: string;
  };
  compile?: {
    stdout?: string;
    stderr?: string;
    output?: string;
    code?: number;
    signal?: string;
  };
  message?: string;
};

const PISTON_ENDPOINT = 'https://emkc.org/api/v2/piston/execute';

const languageMap = {
  javascript: { language: 'javascript', version: '*' },
  python: { language: 'python', version: '*' },
  c: { language: 'c', version: '*' },
  java: { language: 'java', version: '*' },
} as const;

type LocalExecutionResult = {
  ok: boolean;
  output: string;
  exitCode: number;
  unavailable?: boolean;
};

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

function normalizeOutput(stdout: string, stderr: string) {
  const output = [stdout, stderr]
    .filter((value) => value.trim().length > 0)
    .join('\n')
    .trim();

  return output.length > 0 ? output : 'Program finished with no output.';
}

async function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {}
) {
  const timeoutMs = options.timeoutMs ?? 10_000;

  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (timedOut) {
        resolve({
          code: 124,
          stdout,
          stderr: `${stderr}\nExecution timed out after ${timeoutMs}ms.`.trim(),
        });
        return;
      }

      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function runFirstAvailable(
  commands: Array<{ command: string; args: string[] }>,
  options: { cwd?: string; timeoutMs?: number } = {}
) {
  let lastError = '';

  for (const entry of commands) {
    try {
      return await runCommand(entry.command, entry.args, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('ENOENT')) {
        continue;
      }
      lastError = message;
    }
  }

  if (lastError.length > 0) {
    throw new Error(lastError);
  }

  throw new Error('No compatible local runtime found.');
}

async function executeLocally(language: ExecuteRequestBody['language'], code: string): Promise<LocalExecutionResult> {
  const tempRoot = await mkdtemp(join(tmpdir(), 'devsphere-exec-'));

  try {
    if (language === 'javascript') {
      const filePath = join(tempRoot, 'main.js');
      await writeFile(filePath, code, 'utf8');

      const result = await runFirstAvailable([
        { command: 'node', args: [filePath] },
      ]);

      return {
        ok: result.code === 0,
        output: normalizeOutput(result.stdout, result.stderr),
        exitCode: result.code,
      };
    }

    if (language === 'python') {
      const filePath = join(tempRoot, 'main.py');
      await writeFile(filePath, code, 'utf8');

      const result = await runFirstAvailable([
        { command: 'python3', args: [filePath] },
        { command: 'python', args: [filePath] },
        { command: 'py', args: ['-3', filePath] },
      ]);

      return {
        ok: result.code === 0,
        output: normalizeOutput(result.stdout, result.stderr),
        exitCode: result.code,
      };
    }

    if (language === 'c') {
      const sourcePath = join(tempRoot, 'main.c');
      const binaryName = process.platform === 'win32' ? 'main.exe' : 'main';
      const binaryPath = join(tempRoot, binaryName);

      await writeFile(sourcePath, code, 'utf8');

      const compile = await runFirstAvailable(
        [
          { command: 'gcc', args: [sourcePath, '-o', binaryPath] },
          { command: 'clang', args: [sourcePath, '-o', binaryPath] },
        ],
        { cwd: tempRoot }
      );

      if (compile.code !== 0) {
        return {
          ok: false,
          output: normalizeOutput(compile.stdout, compile.stderr),
          exitCode: compile.code,
        };
      }

      const run = await runCommand(binaryPath, [], { cwd: tempRoot });

      return {
        ok: run.code === 0,
        output: normalizeOutput(run.stdout, run.stderr),
        exitCode: run.code,
      };
    }

    if (language === 'java') {
      const sourcePath = join(tempRoot, 'Main.java');
      await writeFile(sourcePath, code, 'utf8');

      const compile = await runFirstAvailable(
        [{ command: 'javac', args: [sourcePath] }],
        { cwd: tempRoot }
      );

      if (compile.code !== 0) {
        return {
          ok: false,
          output: normalizeOutput(compile.stdout, compile.stderr),
          exitCode: compile.code,
        };
      }

      const run = await runFirstAvailable(
        [{ command: 'java', args: ['-cp', tempRoot, 'Main'] }],
        { cwd: tempRoot }
      );

      return {
        ok: run.code === 0,
        output: normalizeOutput(run.stdout, run.stderr),
        exitCode: run.code,
      };
    }

    return {
      ok: false,
      output: 'Unsupported language for local execution.',
      exitCode: 1,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('No compatible local runtime found')) {
      return {
        ok: false,
        output: message,
        exitCode: 127,
        unavailable: true,
      };
    }

    return {
      ok: false,
      output: `Local execution failed: ${message}`,
      exitCode: 1,
    };
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

function composeOutput(result: PistonExecutionResponse) {
  const parts = [
    result.compile?.stdout,
    result.compile?.stderr,
    result.run?.stdout,
    result.run?.stderr,
    result.run?.output,
  ].filter((value): value is string => Boolean(value && value.trim()));

  if (parts.length > 0) {
    return parts.join('\n');
  }

  if (typeof result.message === 'string' && result.message.trim().length > 0) {
    return result.message;
  }

  return 'Program finished with no output.';
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ExecuteRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  if (!body.language || !(body.language in languageMap)) {
    return NextResponse.json({ error: 'Unsupported language.' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code : '';
  if (code.trim().length === 0) {
    return NextResponse.json({ error: 'Code cannot be empty.' }, { status: 400 });
  }

  if (code.length > 25_000) {
    return NextResponse.json({ error: 'Code is too large. Limit is 25,000 characters.' }, { status: 413 });
  }

  const runtime = languageMap[body.language];
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 12_000);

  try {
    const upstreamResponse = await fetch(PISTON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ content: code }],
      }),
      cache: 'no-store',
      signal: abortController.signal,
    });

    if (!upstreamResponse.ok) {
      const localResult = await executeLocally(body.language, code);

      if (localResult.unavailable) {
        return NextResponse.json(
          {
            error:
              'Execution service is unavailable and no local runtime was found. Install local runtimes (node/python/gcc/javac) or retry later.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json({ output: localResult.output, exitCode: localResult.exitCode });
    }

    const result = (await upstreamResponse.json()) as PistonExecutionResponse;
    const output = composeOutput(result);

    return NextResponse.json({ output, exitCode: result.run?.code ?? 0 });
  } catch {
    const localResult = await executeLocally(body.language, code);

    if (localResult.unavailable) {
      return NextResponse.json(
        {
          error:
            'Execution request failed and no local runtime was found. Install local runtimes (node/python/gcc/javac) or retry later.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ output: localResult.output, exitCode: localResult.exitCode });
  } finally {
    clearTimeout(timeout);
  }
}
