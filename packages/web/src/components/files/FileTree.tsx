/**
 * File tree component with collapse/expand functionality
 */

import React, { useState, useMemo } from 'react';
import type { FileChange, FileStatus } from '@jujutsu-gui/shared';

interface FileTreeProps {
  files: FileChange[];
  selectedFiles: string[];
  onFileSelect: (path: string, isMulti?: boolean) => void;
  onFileDoubleClick?: (path: string) => void;
  onOpenInEditor?: (path: string) => void;
  searchQuery?: string;
  statusFilter?: FileStatus[];
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  status?: FileStatus;
  children: TreeNode[];
  expanded: boolean;
}

export function FileTree({
  files,
  selectedFiles,
  onFileSelect,
  onFileDoubleClick,
  onOpenInEditor,
  searchQuery = '',
  statusFilter = [],
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build tree structure from flat file list
  const tree = useMemo(() => {
    const root: TreeNode = {
      name: '',
      path: '',
      isFolder: true,
      children: [],
      expanded: true,
    };

    // Filter files by status and search query
    const filteredFiles = files.filter((file) => {
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(file.status)) {
        return false;
      }
      // Search filter
      if (searchQuery && !file.path.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });

    // Build tree
    filteredFiles.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const childPath = parts.slice(0, index + 1).join('/');

        let child = current.children.find((c) => c.name === part);

        if (!child) {
          child = {
            name: part,
            path: childPath,
            isFolder: !isLast,
            status: isLast ? file.status : undefined,
            children: [],
            expanded: expandedFolders.has(childPath),
          };
          current.children.push(child);
        }

        current = child;
      });
    });

    // Sort children: folders first, then alphabetically
    const sortChildren = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.isFolder !== b.isFolder) {
          return a.isFolder ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    };

    sortChildren(root);

    return root;
  }, [files, statusFilter, searchQuery, expandedFolders]);

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    // Context menu would be implemented here
  };

  return (
    <div className="h-full overflow-auto">
      <div className="py-1">
        {tree.children.length === 0 ? (
          <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
            No files match the current filters
          </div>
        ) : (
          tree.children.map((child) => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              depth={0}
              expandedFolders={expandedFolders}
              selectedFiles={selectedFiles}
              onToggleFolder={toggleFolder}
              onFileSelect={onFileSelect}
              onFileDoubleClick={onFileDoubleClick}
              onOpenInEditor={onOpenInEditor}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  expandedFolders: Set<string>;
  selectedFiles: string[];
  onToggleFolder: (path: string) => void;
  onFileSelect: (path: string, isMulti?: boolean) => void;
  onFileDoubleClick?: (path: string) => void;
  onOpenInEditor?: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
}

function TreeNodeComponent({
  node,
  depth,
  expandedFolders,
  selectedFiles,
  onToggleFolder,
  onFileSelect,
  onFileDoubleClick,
  onOpenInEditor,
  onContextMenu,
}: TreeNodeComponentProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFiles.includes(node.path);
  const paddingLeft = depth * 16 + 8;

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          onContextMenu={(e) => onContextMenu(e, node)}
          className="w-full flex items-center gap-1 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
          style={{ paddingLeft }}
        >
          {/* Expand/collapse arrow */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          {/* Folder icon */}
          <svg
            className={`w-4 h-4 ${isExpanded ? 'text-amber-500' : 'text-amber-400'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            {isExpanded ? (
              <path
                fillRule="evenodd"
                d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
                clipRule="evenodd"
              />
            ) : (
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            )}
          </svg>

          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {node.name}
          </span>
        </button>

        {/* Render children if expanded */}
        {isExpanded && (
          <div>
            {node.children.map((child) => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedFolders={expandedFolders}
                selectedFiles={selectedFiles}
                onToggleFolder={onToggleFolder}
                onFileSelect={onFileSelect}
                onFileDoubleClick={onFileDoubleClick}
                onOpenInEditor={onOpenInEditor}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  return (
    <div
      onClick={(e) => onFileSelect(node.path, e.ctrlKey || e.metaKey)}
      onDoubleClick={() => onFileDoubleClick?.(node.path)}
      onContextMenu={(e) => onContextMenu(e, node)}
      className={`flex items-center gap-1 py-1 px-2 cursor-pointer ${
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/50'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      style={{ paddingLeft: paddingLeft + 20 }}
    >
      {/* Status indicator */}
      <FileStatusIndicator status={node.status} />

      {/* File icon */}
      <FileIcon filename={node.name} />

      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
        {node.name}
      </span>

      {/* Open in editor button */}
      {onOpenInEditor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenInEditor(node.path);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          title="Open in editor"
        >
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Status indicator dot
 */
function FileStatusIndicator({ status }: { status?: FileStatus }) {
  if (!status) return null;

  const colors: Record<FileStatus, string> = {
    added: 'bg-green-500',
    modified: 'bg-blue-500',
    deleted: 'bg-red-500',
    renamed: 'bg-amber-500',
    conflict: 'bg-orange-500',
    untracked: 'bg-gray-400',
  };

  const labels: Record<FileStatus, string> = {
    added: 'A',
    modified: 'M',
    deleted: 'D',
    renamed: 'R',
    conflict: 'C',
    untracked: '?',
  };

  return (
    <span
      className={`w-4 h-4 rounded-full ${colors[status]} flex items-center justify-center text-white text-xs font-bold`}
      title={status}
    >
      {labels[status]}
    </span>
  );
}

/**
 * File icon based on extension
 */
function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // TypeScript/JavaScript
  if (['ts', 'tsx'].includes(ext)) {
    return (
      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm10.71 14.86c.5.98 1.51 1.73 3.09 1.73 1.6 0 2.8-.83 2.8-2.36 0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02 0-.41.31-.73.81-.73.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33-1.51 0-2.48.96-2.48 2.23 0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13 0 .48-.45.83-1.15.83-.83 0-1.31-.43-1.67-1.03l-1.38.8z" />
      </svg>
    );
  }

  if (['js', 'jsx'].includes(ext)) {
    return (
      <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm4.17 15.24c.37.79 1.12 1.44 2.43 1.44 1.44 0 2.41-.77 2.41-2.45v-5.56h-1.62v5.5c0 .86-.34 1.08-.87 1.08-.56 0-.79-.38-1.05-.82l-1.3.81zm5.64-.11c.46.9 1.39 1.55 2.83 1.55 1.47 0 2.57-.77 2.57-2.18 0-1.3-.74-1.88-2.06-2.45l-.39-.17c-.67-.29-.96-.48-.96-.94 0-.38.29-.67.76-.67.46 0 .76.2 1.03.67l1.23-.8c-.52-.9-1.24-1.25-2.26-1.25-1.42 0-2.33.9-2.33 2.09 0 1.29.76 1.9 1.9 2.38l.39.17c.72.31 1.14.51 1.14 1.03 0 .44-.41.76-1.05.76-.76 0-1.2-.4-1.53-.94l-1.27.79z" />
      </svg>
    );
  }

  // JSON
  if (ext === 'json') {
    return (
      <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm3.5 12.5a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2zM8 7v1h8V7H8zm0 3v1h8v-1H8z" />
      </svg>
    );
  }

  // Markdown
  if (['md', 'mdx'].includes(ext)) {
    return (
      <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41M6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92M19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z" />
      </svg>
    );
  }

  // CSS
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return (
      <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 3l-.65 3.34h13.59L17.5 8.5H4.84l-.66 3.33h13.59l-.76 3.81-5.48 1.81-4.75-1.81.33-1.64H4.22l-.79 4 7.85 3 9.05-3 1.2-6.03.24-1.21L22 3H5z" />
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export default FileTree;
