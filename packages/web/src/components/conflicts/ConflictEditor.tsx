/**
 * Conflict Resolution Editor
 * Three-way merge editor for resolving conflicts
 */

import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { Conflict, ConflictSide, ConflictContent } from '@jujutsu-gui/shared';

interface ConflictEditorProps {
  conflict: Conflict;
  onResolve: (path: string, resolution: string) => void;
  onAcceptOurs?: (path: string) => void;
  onAcceptTheirs?: (path: string) => void;
  onAcceptBase?: (path: string) => void;
}

interface ConflictSection {
  id: string;
  oursContent: string;
  theirsContent: string;
  baseContent?: string;
  startLine: number;
  endLine: number;
}

export function ConflictEditor({
  conflict,
  onResolve,
  onAcceptOurs,
  onAcceptTheirs,
  onAcceptBase,
}: ConflictEditorProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [resolvedContent, setResolvedContent] = useState<string | null>(null);

  // Parse conflict markers to extract sections
  const sections = parseConflictSections(conflict);

  const handleAcceptOurs = useCallback(() => {
    const content = conflict.sides.find((s) => s.name === 'ours')?.content.content || '';
    setResolvedContent(content);
    onResolve(conflict.path, content);
    onAcceptOurs?.(conflict.path);
  }, [conflict, onResolve, onAcceptOurs]);

  const handleAcceptTheirs = useCallback(() => {
    const content = conflict.sides.find((s) => s.name === 'theirs')?.content.content || '';
    setResolvedContent(content);
    onResolve(conflict.path, content);
    onAcceptTheirs?.(conflict.path);
  }, [conflict, onResolve, onAcceptTheirs]);

  const handleAcceptBase = useCallback(() => {
    const content = conflict.base?.content || '';
    setResolvedContent(content);
    onResolve(conflict.path, content);
    onAcceptBase?.(conflict.path);
  }, [conflict, onResolve, onAcceptBase]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setResolvedContent(value);
    }
  }, []);

  const handleResolve = useCallback(() => {
    if (resolvedContent) {
      onResolve(conflict.path, resolvedContent);
    }
  }, [conflict.path, resolvedContent, onResolve]);

  // Navigate between conflict sections
  const goToNextSection = useCallback(() => {
    setActiveSection((prev) => Math.min(prev + 1, sections.length - 1));
  }, [sections.length]);

  const goToPrevSection = useCallback(() => {
    setActiveSection((prev) => Math.max(prev - 1, 0));
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium text-sm truncate" title={conflict.path}>
            {conflict.path}
          </span>
        </div>

        {/* Section navigation */}
        {sections.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Section {activeSection + 1} of {sections.length}
            </span>
            <button
              onClick={goToPrevSection}
              disabled={activeSection === 0}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={goToNextSection}
              disabled={activeSection === sections.length - 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Three-way view */}
      <div className="flex-1 grid grid-cols-3 gap-0.5 bg-gray-200 dark:bg-gray-700">
        {/* Ours */}
        <div className="flex flex-col bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between px-3 py-1.5 bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800">
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Ours</span>
            <button
              onClick={handleAcceptOurs}
              className="px-2 py-0.5 text-xs rounded bg-green-600 text-white hover:bg-green-700"
            >
              Accept
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language="plaintext"
              value={getSideContent(conflict, 'ours')}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'off',
                folding: false,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Base (if available) */}
        <div className="flex flex-col bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Base</span>
            {conflict.base && (
              <button
                onClick={handleAcceptBase}
                className="px-2 py-0.5 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
              >
                Accept
              </button>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language="plaintext"
              value={conflict.base?.content || '(no base)'}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'off',
                folding: false,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

        {/* Theirs */}
        <div className="flex flex-col bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Theirs</span>
            <button
              onClick={handleAcceptTheirs}
              className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Accept
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language="plaintext"
              value={getSideContent(conflict, 'theirs')}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'off',
                folding: false,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      </div>

      {/* Merged/Resolved editor */}
      <div className="flex-1 flex flex-col border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800">
          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Resolved</span>
          <button
            onClick={handleResolve}
            disabled={!resolvedContent}
            className="px-3 py-0.5 text-xs rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            Mark Resolved
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language="plaintext"
            value={resolvedContent || mergeContents(conflict)}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              folding: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={handleAcceptOurs}
          className="px-3 py-1.5 text-xs rounded border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
        >
          Accept All Ours
        </button>
        <button
          onClick={handleAcceptTheirs}
          className="px-3 py-1.5 text-xs rounded border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        >
          Accept All Theirs
        </button>
        {conflict.base && (
          <button
            onClick={handleAcceptBase}
            className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Accept Base
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Get content for a specific side of the conflict
 */
function getSideContent(conflict: Conflict, side: 'ours' | 'theirs'): string {
  const sideData = conflict.sides.find((s) => s.name === side);
  return sideData?.content.content || '';
}

/**
 * Merge contents with conflict markers for manual resolution
 */
function mergeContents(conflict: Conflict): string {
  const ours = getSideContent(conflict, 'ours');
  const theirs = getSideContent(conflict, 'theirs');
  const base = conflict.base?.content;

  // Create merged content with conflict markers
  let merged = '';
  if (base) {
    merged = `<<<<<<< ours\n${ours}\n||||||| base\n${base}\n=======\n${theirs}\n>>>>>>> theirs`;
  } else {
    merged = `<<<<<<< ours\n${ours}\n=======\n${theirs}\n>>>>>>> theirs`;
  }

  return merged;
}

/**
 * Parse conflict sections from content
 */
function parseConflictSections(conflict: Conflict): ConflictSection[] {
  // For now, return a single section
  // In a real implementation, this would parse multiple conflict markers
  return [
    {
      id: '1',
      oursContent: getSideContent(conflict, 'ours'),
      theirsContent: getSideContent(conflict, 'theirs'),
      baseContent: conflict.base?.content,
      startLine: 1,
      endLine: 100,
    },
  ];
}

export default ConflictEditor;
