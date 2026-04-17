/**
 * Repository info header component
 */

import { useRepoStore } from '../../stores';

export function RepoHeader() {
  const repository = useRepoStore((state) => state.repository);

  if (!repository) {
    return null;
  }

  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm truncate">{repository.name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{repository.path}</p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          jj {repository.jjVersion}
        </div>
      </div>
    </div>
  );
}
