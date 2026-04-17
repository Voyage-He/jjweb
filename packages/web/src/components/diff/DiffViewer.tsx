/**
 * Diff Viewer component using Monaco Editor
 * Supports side-by-side and unified diff views
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface DiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  originalPath?: string;
  modifiedPath?: string;
  viewType?: 'side-by-side' | 'unified';
  language?: string;
  readOnly?: boolean;
  onModifiedChange?: (value: string) => void;
  ignoreWhitespace?: boolean;
}

export function DiffViewer({
  originalContent,
  modifiedContent,
  originalPath = 'original',
  modifiedPath = 'modified',
  viewType = 'side-by-side',
  language = 'plaintext',
  readOnly = true,
  onModifiedChange,
  ignoreWhitespace = false,
}: DiffViewerProps) {
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [currentViewType, setCurrentViewType] = useState(viewType);
  const [hunkIndex, setHunkIndex] = useState(0);
  const [hunks, setHunks] = useState<HunkInfo[]>([]);

  // Handle editor mount
  const handleEditorDidMount: OnMount = (diffEditor, monaco) => {
    diffEditorRef.current = diffEditor;
    monacoRef.current = monaco;

    // Configure editor options
    diffEditor.updateOptions({
      enableSplitViewResizing: true,
      renderSideBySide: currentViewType === 'side-by-side',
      readOnly: readOnly,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      folding: true,
      lineNumbers: 'on',
      glyphMargin: true,
      renderOverviewRulerLane: 3,
      diffWordWrap: 'on',
    });

    // Extract hunks for navigation
    extractHunks(diffEditor);

    // Focus editor
    diffEditor.focus();
  };

  // Extract hunks from diff editor
  const extractHunks = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    const diff = diffEditor.getDiffComputationResult();
    if (!diff || !diff.changes) return;

    const hunkInfos: HunkInfo[] = diff.changes.map((change, index) => ({
      index,
      originalStart: change.originalStartLineNumber,
      originalEnd: change.originalEndLineNumber,
      modifiedStart: change.modifiedStartLineNumber,
      modifiedEnd: change.modifiedEndLineNumber,
    }));

    setHunks(hunkInfos);
  }, []);

  // Navigate to next hunk
  const goToNextHunk = useCallback(() => {
    if (!diffEditorRef.current || hunks.length === 0) return;

    const nextIndex = (hunkIndex + 1) % hunks.length;
    setHunkIndex(nextIndex);

    const hunk = hunks[nextIndex];
    const modifiedEditor = diffEditorRef.current.getModifiedEditor();
    modifiedEditor.revealLineInCenter(hunk.modifiedStart);
    modifiedEditor.setPosition({ lineNumber: hunk.modifiedStart, column: 1 });
  }, [hunks, hunkIndex]);

  // Navigate to previous hunk
  const goToPrevHunk = useCallback(() => {
    if (!diffEditorRef.current || hunks.length === 0) return;

    const prevIndex = (hunkIndex - 1 + hunks.length) % hunks.length;
    setHunkIndex(prevIndex);

    const hunk = hunks[prevIndex];
    const modifiedEditor = diffEditorRef.current.getModifiedEditor();
    modifiedEditor.revealLineInCenter(hunk.modifiedStart);
    modifiedEditor.setPosition({ lineNumber: hunk.modifiedStart, column: 1 });
  }, [hunks, hunkIndex]);

  // Toggle view type
  const toggleViewType = useCallback(() => {
    const newType = currentViewType === 'side-by-side' ? 'unified' : 'side-by-side';
    setCurrentViewType(newType);

    if (diffEditorRef.current) {
      diffEditorRef.current.updateOptions({
        renderSideBySide: newType === 'side-by-side',
      });
    }
  }, [currentViewType]);

  // Handle content change
  const handleContentChange = useCallback((value: string | undefined) => {
    if (value !== undefined && onModifiedChange) {
      onModifiedChange(value);
    }
  }, [onModifiedChange]);

  // Copy line content
  const copyLineContent = useCallback(async (lineNumber: number, isOriginal: boolean) => {
    if (!diffEditorRef.current) return;

    const editor = isOriginal
      ? diffEditorRef.current.getOriginalEditor()
      : diffEditorRef.current.getModifiedEditor();

    const model = editor.getModel();
    if (!model) return;

    const lineContent = model.getLineContent(lineNumber);
    await navigator.clipboard.writeText(lineContent);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          {/* View type toggle */}
          <button
            onClick={toggleViewType}
            className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1"
            title={`Switch to ${currentViewType === 'side-by-side' ? 'unified' : 'side-by-side'} view`}
          >
            {currentViewType === 'side-by-side' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Unified</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                <span>Split</span>
              </>
            )}
          </button>

          {/* Ignore whitespace toggle */}
          <button
            className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
              ignoreWhitespace
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Ignore whitespace changes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            <span>Ignore WS</span>
          </button>
        </div>

        {/* Hunk navigation */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {hunks.length > 0 ? `${hunkIndex + 1}/${hunks.length} changes` : 'No changes'}
          </span>
          <button
            onClick={goToPrevHunk}
            disabled={hunks.length === 0}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Previous change"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={goToNextHunk}
            disabled={hunks.length === 0}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            title="Next change"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          original={originalContent}
          modified={modifiedContent}
          originalModelPath={`file:///${originalPath}`}
          modifiedModelPath={`file:///${modifiedPath}`}
          onMount={handleEditorDidMount}
          onChange={handleContentChange}
          theme="vs-dark"
          options={{
            renderSideBySide: currentViewType === 'side-by-side',
            readOnly: readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            folding: true,
            lineNumbers: 'on',
            glyphMargin: true,
            wordWrap: 'on',
            diffWordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}

interface HunkInfo {
  index: number;
  originalStart: number;
  originalEnd: number;
  modifiedStart: number;
  modifiedEnd: number;
}

/**
 * Detect language from file extension
 */
export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescriptreact',
    js: 'javascript',
    jsx: 'javascriptreact',
    json: 'json',
    md: 'markdown',
    mdx: 'markdown',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    swift: 'swift',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    sql: 'sql',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    vue: 'vue',
    svelte: 'svelte',
  };

  return languageMap[ext] || 'plaintext';
}

export default DiffViewer;
