'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './realtime-editor.module.css';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

type RealtimeEditorProps = {
  roomId: string;
  userId: string;
  userName: string;
};

type Language = 'javascript' | 'python' | 'c' | 'java';

const DEFAULT_LANGUAGE: Language = 'javascript';

const CODE_TEMPLATES: Record<Language, string> = {
  javascript: `function hello(name) {
  return "Hello, " + name + "!";
}

console.log(hello("DevSphere"));
`,
  python: `def hello(name):
    return f"Hello, {name}!"

print(hello("DevSphere"))
`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, DevSphere!\\n");
    return 0;
}
`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, DevSphere!");
    }
}
`,
};

function colorFromId(id: string) {
  const palette = ['#1d4ed8', '#0d9488', '#7c3aed', '#c2410c', '#be123c', '#0f766e'];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function RealtimeEditor({ roomId, userId, userName }: RealtimeEditorProps) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [code, setCode] = useState(CODE_TEMPLATES[DEFAULT_LANGUAGE]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [output, setOutput] = useState('Run your code to see output here.');
  const [isRunning, setIsRunning] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const sharedTextRef = useRef<Y.Text | null>(null);

  const userColor = useMemo(() => colorFromId(userId), [userId]);

  useEffect(() => {
    const doc = new Y.Doc();
    const yText = doc.getText('source');
    sharedTextRef.current = yText;

    const provider = new WebrtcProvider(roomId, doc, {
      signaling: ['wss://signaling.yjs.dev'],
    });

    provider.awareness.setLocalStateField('user', {
      id: userId,
      name: userName,
      color: userColor,
    });

    const syncEditorFromDoc = () => {
      const nextValue = yText.toString();
      setCode(nextValue.length > 0 ? nextValue : CODE_TEMPLATES[DEFAULT_LANGUAGE]);
    };

    const handleTextChange = () => {
      syncEditorFromDoc();
    };

    const handleStatus = ({ connected }: { connected: boolean }) => {
      setConnectionStatus(connected ? 'connected' : 'connecting');
    };

    const refreshAwareness = () => {
      const states = Array.from(provider.awareness.getStates().values())
        .map((state) => state.user?.name)
        .filter((name): name is string => Boolean(name));
      setActiveUsers(states);
    };

    if (yText.length === 0) {
      yText.insert(0, CODE_TEMPLATES[DEFAULT_LANGUAGE]);
    } else {
      syncEditorFromDoc();
    }

    yText.observe(handleTextChange);
    provider.on('status', handleStatus);
    provider.awareness.on('change', refreshAwareness);
    refreshAwareness();

    return () => {
      sharedTextRef.current = null;
      yText.unobserve(handleTextChange);
      provider.off('status', handleStatus);
      provider.awareness.off('change', refreshAwareness);
      provider.destroy();
      doc.destroy();
    };
  }, [roomId, userColor, userId, userName]);

  const handleCodeChange = (nextValue: string) => {
    setCode(nextValue);

    const yText = sharedTextRef.current;

    if (!yText) {
      return;
    }

    const currentValue = yText.toString();
    if (currentValue === nextValue) {
      return;
    }

    yText.delete(0, yText.length);
    yText.insert(0, nextValue);
  };

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);

    const template = CODE_TEMPLATES[nextLanguage];
    setCode(template);
    setOutput(`Language switched to ${nextLanguage}. Click Run to see output.`);

    const yText = sharedTextRef.current;
    if (!yText) {
      return;
    }

    yText.delete(0, yText.length);
    yText.insert(0, template);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Running...');

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          code,
        }),
      });

      const result = (await response.json()) as { output?: string; error?: string; exitCode?: number };

      if (!response.ok) {
        setOutput(result.error || 'Execution failed.');
        return;
      }

      const baseOutput = result.output && result.output.trim().length > 0
        ? result.output
        : 'Program finished with no output.';
      setOutput(`${baseOutput}\n\nExit code: ${result.exitCode ?? 0}`);
    } catch {
      setOutput('Execution failed due to a network or server error.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className={styles.container}>
      <div className={styles.metaRow}>
        <p className={styles.badge} data-status={connectionStatus}>
          {connectionStatus === 'connected' ? 'Connected live' : 'Connecting...'}
        </p>
        <p className={styles.roomInfo}>Room ID: {roomId}</p>
      </div>

      <div className={styles.participantsBlock}>
        <h3 className={styles.participantsTitle}>Active participants ({activeUsers.length})</h3>
        <div className={styles.participantChips}>
          {activeUsers.length > 0 ? (
            activeUsers.map((name, index) => (
              <span key={`${name}-${index}`} className={styles.participantChip}>
                {name}
              </span>
            ))
          ) : (
            <span className={styles.emptyParticipant}>Only you in this room right now</span>
          )}
        </div>
      </div>

      <label className={styles.editorLabel} htmlFor="realtime-code-editor">
        Shared code
      </label>

      <div className={styles.controlsRow}>
        <label className={styles.selectLabel} htmlFor="language-selector">
          Language
        </label>
        <select
          id="language-selector"
          className={styles.languageSelect}
          value={language}
          onChange={(event) => handleLanguageChange(event.target.value as Language)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="java">Java</option>
        </select>
        <button
          type="button"
          className={styles.runButton}
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>

      <textarea
        id="realtime-code-editor"
        value={code}
        onChange={(event) => handleCodeChange(event.target.value)}
        className={styles.editor}
        spellCheck={false}
      />

      <section className={styles.outputBlock}>
        <h4 className={styles.outputTitle}>Output</h4>
        <pre className={styles.outputText}>{output}</pre>
      </section>
    </section>
  );
}
