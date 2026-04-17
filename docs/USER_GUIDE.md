# User Guide

This guide covers the basic operations in Jujutsu GUI.

## Getting Started

### Opening a Repository

1. On the welcome screen, you'll see three options: **Open**, **Init**, and **Clone**
2. Choose **Open** to open an existing jj repository
3. Enter the path to your repository
4. Click "Open Repository"

### Initializing a New Repository

1. Select **Init** tab on the welcome screen
2. Enter the path where you want to create the repository
3. Optionally enable "Git backend" if you want Git compatibility
4. Click "Initialize"

### Cloning a Repository

1. Select **Clone** tab on the welcome screen
2. Enter the repository URL (supports GitHub, GitLab, etc.)
3. Enter the local destination path
4. Click "Clone"

## Understanding the Interface

### Main Layout

The interface is divided into three main panels:

- **Left Sidebar**: File explorer and working copy status
- **Center**: Commit graph visualization
- **Right Panel**: Commit details and diff viewer

### Commit Graph

The commit graph shows your repository history as a visual DAG (Directed Acyclic Graph):

- **Nodes** represent commits
- **Lines** show parent-child relationships
- **Labels** indicate bookmarks and tags
- **Working Copy** is shown as a special highlighted node

**Navigation:**
- Click a commit to select it
- Use arrow keys for keyboard navigation
- Scroll to view more history
- Use the search bar to find commits

### File Explorer

The file explorer shows files in the working copy:

- **Status indicators**: Added (A), Modified (M), Deleted (D), Untracked (?)
- **Click** a file to view its diff
- **Right-click** for context menu with file operations

## Basic Operations

### Creating a New Change

In jj, a "change" is like a work-in-progress commit. To create one:

1. Press `N` or use Command Palette (`Cmd/Ctrl+K`) → "Create new change"
2. Enter a description for your change
3. The change will be created after your current working copy

### Editing Files

In jj, all file changes are automatically tracked. There's no staging area:

1. Edit files in your favorite editor
2. Changes appear automatically in the file explorer
3. Use the diff viewer to review changes

### Committing Changes

jj automatically creates commits as you work:

1. Edit files in the working copy
2. The changes are automatically part of the current "change"
3. Edit the description using `D` or Command Palette → "Edit description"
4. Use `jj new` to create a new change

### Moving Between Changes

Use the graph to navigate:
- Click on a commit/change to select it
- Use `jj edit` to make a change editable
- The working copy indicator shows which change you're editing

## Working with Bookmarks

Bookmarks in jj are similar to branches in Git.

### Creating a Bookmark

1. Right-click on a commit in the graph
2. Select "Create bookmark"
3. Enter a name for the bookmark

### Moving a Bookmark

1. Drag a bookmark label to a different commit
2. Or use the Command Palette → "Move bookmark"

### Deleting a Bookmark

1. Right-click on the bookmark label
2. Select "Delete bookmark"

## Operations and Undo/Redo

jj keeps track of all operations, allowing full undo/redo:

### Viewing Operations

1. Open the Operations panel from the sidebar
2. See a list of all operations with timestamps
3. Click an operation to see details

### Undoing an Operation

1. Find the operation in the Operations panel
2. Click "Undo"
3. Or use `Cmd/Ctrl+Z` to undo the last operation

### Redoing an Operation

1. Use `Cmd/Ctrl+Shift+Z` or `Cmd/Ctrl+Y`
2. Or find the undone operation and click "Redo"

## Resolving Conflicts

When conflicts occur, jj marks them in the working copy:

### Viewing Conflicts

1. Conflicts are highlighted in the file explorer
2. Click on a conflicted file to open the conflict editor
3. The three-way diff shows base, ours, and theirs

### Resolving Conflicts

1. Use the conflict editor to choose resolution:
   - **Accept Ours**: Keep your changes
   - **Accept Theirs**: Keep their changes
   - **Accept Base**: Revert to original
   - **Manual Edit**: Edit the content directly
2. After resolving, click "Mark as Resolved"

## Advanced Operations

### Squashing Changes

Combine a change with its parent:

1. Select the change to squash
2. Use Command Palette → "Squash into parent"
3. Optionally provide a new description

### Splitting a Change

Divide a change into multiple changes:

1. Select the change to split
2. Use Command Palette → "Split change"
3. Select which files go into the new change

### Reordering Changes

Drag and drop changes in the graph to reorder them:

1. Click and hold on a commit node
2. Drag to the new position
3. Release to complete the rebase

## Keyboard Shortcuts

Press `?` or `Cmd/Ctrl+Shift+/` to see all keyboard shortcuts.

See the [Keyboard Shortcuts Reference](KEYBOARD_SHORTCUTS.md) for a complete list.

## Tips and Tricks

### Fast Navigation

- Use `Cmd/Ctrl+K` to open the Command Palette
- Type to fuzzy search for commands
- Use arrow keys and Enter to execute

### Quick File Actions

- Right-click on files for quick actions
- Use keyboard shortcuts in the file explorer
- Drag files to external editor

### Working with Large Repositories

- The graph uses virtual scrolling for performance
- Use the search function to find commits
- Filter by author, date, or description

## Troubleshooting

### Repository Not Found

- Make sure the path is correct
- Verify it's a valid jj repository (contains `.jj` directory)
- Check that jj is installed and accessible

### Changes Not Showing

- Try refreshing the repository
- Check if file watching is enabled
- Verify the file system supports watching

### Performance Issues

- Reduce the number of commits shown
- Close unused browser tabs
- Check available memory

## Getting Help

- Press `?` for keyboard shortcuts
- Use Command Palette to discover features
- Check the [jj documentation](https://jj-vcs.github.io/jj/)
