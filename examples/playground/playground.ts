// manim-web playground: a type-code-see-it-instantly editor.
//
// The user edits a manim-web scene in the CodeMirror editor and runs it. The
// code runs with every manim-web export in scope and a ready DOM element named
// `container`. The editor contents are shareable through the URL hash.
//
// This file is the thin DOM/eval harness. The pure, tested logic lives in
// ./examples.ts, ./prepare.ts and ./share.ts.
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';

import * as manimNamespace from '../../src/index.ts';
import { examples, getExampleById, defaultCode } from './examples';
import { prepareCode } from './prepare';
import { codeFromHash, codeToHash } from './share';

// manim-web exports, injected into the user's code as named parameters.
const manim = manimNamespace as unknown as Record<string, unknown>;
const manimNames = Object.keys(manim).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
const manimValues = manimNames.map((name) => manim[name]);

type AsyncSceneFn = (...args: unknown[]) => Promise<unknown>;
const AsyncFunctionCtor = Object.getPrototypeOf(async () => {}).constructor as new (
  ...args: string[]
) => AsyncSceneFn;

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Playground markup is missing #${id}`);
  return node as T;
}

const editorMount = el<HTMLDivElement>('editor');
const canvasHost = el<HTMLDivElement>('container');
const errorPanel = el<HTMLPreElement>('error');
const runButton = el<HTMLButtonElement>('run');
const shareButton = el<HTMLButtonElement>('share');
const exampleSelect = el<HTMLSelectElement>('examples');

const darkTheme = EditorView.theme(
  {
    '&': { height: '100%', fontSize: '13px', backgroundColor: '#0d1117', color: '#e6edf3' },
    '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
    '.cm-gutters': { backgroundColor: '#0d1117', color: '#6e7681', border: 'none' },
    '.cm-activeLine': { backgroundColor: '#161b22' },
    '.cm-activeLineGutter': { backgroundColor: '#161b22' },
    '&.cm-focused .cm-cursor': { borderLeftColor: '#e6edf3' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: '#264f78',
    },
  },
  { dark: true },
);

function clearError(): void {
  errorPanel.textContent = '';
  errorPanel.hidden = true;
}

function showError(title: string, error: unknown): void {
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  errorPanel.textContent = `${title}\n\n${detail}`;
  errorPanel.hidden = false;
}

async function runCode(): Promise<void> {
  clearError();
  canvasHost.innerHTML = '';

  const source = editor.state.doc.toString();

  let body: string;
  try {
    body = prepareCode(source);
  } catch (error) {
    showError('Could not parse your code', error);
    return;
  }

  try {
    const sceneFn = new AsyncFunctionCtor(...manimNames, 'container', body);
    await sceneFn(...manimValues, canvasHost);
  } catch (error) {
    showError('Error while running your scene', error);
  }
}

function setEditorCode(code: string): void {
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: code } });
}

function flashButton(button: HTMLButtonElement, text: string): void {
  const original = button.dataset.label ?? button.textContent ?? '';
  button.dataset.label = original;
  button.textContent = text;
  window.setTimeout(() => {
    button.textContent = original;
  }, 1500);
}

const runShortcut = keymap.of([
  {
    key: 'Mod-Enter',
    preventDefault: true,
    run: () => {
      void runCode();
      return true;
    },
  },
]);

const initialCode = codeFromHash(window.location.hash) ?? defaultCode();

const editor = new EditorView({
  state: EditorState.create({
    doc: initialCode,
    extensions: [
      basicSetup,
      javascript({ typescript: true }),
      runShortcut,
      darkTheme,
      EditorView.lineWrapping,
    ],
  }),
  parent: editorMount,
});

for (const example of examples) {
  const option = document.createElement('option');
  option.value = example.id;
  option.textContent = example.title;
  exampleSelect.append(option);
}

exampleSelect.addEventListener('change', () => {
  const example = getExampleById(exampleSelect.value);
  if (!example) return;
  setEditorCode(example.code);
  void runCode();
});

runButton.addEventListener('click', () => {
  void runCode();
});

shareButton.addEventListener('click', () => {
  const hash = codeToHash(editor.state.doc.toString());
  window.history.replaceState(null, '', hash);
  const url = `${window.location.origin}${window.location.pathname}${hash}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(
      () => flashButton(shareButton, 'Link copied!'),
      () => flashButton(shareButton, 'URL updated'),
    );
  } else {
    flashButton(shareButton, 'URL updated');
  }
});

// Run the initial scene so the user sees output immediately.
void runCode();
