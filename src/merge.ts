import type { Repo } from "./git"
import {
  ancestors,
  commit,
  findCommit,
  getHead,
  record
} from "./history"

export function merge(
  repo: Repo,
  branchName: string
) {
  if (repo.head.type !== "branch") {
    return "Cannot merge while HEAD is detached."
  }

  const target = repo.branches[branchName]
  const current = getHead(repo)

  if (target === undefined) {
    return `merge: '${branchName}' not found`
  }

  if (!target) {
    return "Nothing to merge."
  }

  if (!current) {
    return "Current branch has no commits."
  }

  if (target === current) {
    return "Already up to date."
  }

  if (ancestors(repo, target).has(current)) {
    repo.branches[repo.head.name] = target

    record(
      repo,
      `merge ${branchName}: fast-forward`
    )

    return `Fast-forward merge of ${branchName}.`
  }

  const source = findCommit(repo, target)
  const currentCommit = findCommit(
    repo,
    current
  )

  const sourceFiles = source?.files ?? []
  const currentFiles =
    currentCommit?.files ?? []

  const conflicts = sourceFiles.filter(
    name => currentFiles.includes(name)
  )

  if (conflicts.length) {
    repo.conflicts = conflicts

    return [
      `CONFLICT: ${conflicts.join(", ")}`,
      "Automatic merge failed.",
      "Resolve the conflicts and commit the result."
    ].join("\n")
  }

  const mergeCommit = commit(
    repo,
    `Merge branch '${branchName}'`,
    [current, target]
  )

  return `Merge made commit ${mergeCommit.id}.`
}