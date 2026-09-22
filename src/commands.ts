import type {
  CommandResult,
  Repo
} from "./git"

import {
  initFiles,
  getFile,
  addFile,
  addAll,
  editFile,
  cleanFiles,
  resolveFile
} from "./files"

import {
  createBranch,
  deleteBranch,
  checkoutBranch
} from "./branches"

import {
  getHead,
  findCommit,
  commit,
  reset,
  revert,
  logHistory,
  record
} from "./history"

import { merge } from "./merge"

const output = (
  repo: Repo,
  text: string
): CommandResult => ({
  repo,
  output: text
})

function status(repo: Repo) {
  const staged = repo.files.filter(
    file => repo.staging.includes(file.name)
  )

  const modified = repo.files.filter(
    file =>
      file.status === "modified" &&
      !repo.staging.includes(file.name)
  )

  const untracked = repo.files.filter(
    file => file.status === "untracked"
  )

  const branch =
    repo.head.type === "branch"
      ? repo.head.name
      : "detached HEAD"

  const lines = [`On ${branch}`, ""]

  if (repo.conflicts.length) {
    lines.push("Unmerged paths:")

    repo.conflicts.forEach(file =>
      lines.push(`  both modified: ${file}`)
    )

    lines.push("")
  }

  if (staged.length) {
    lines.push("Changes to be committed:")

    staged.forEach(file =>
      lines.push(`  staged: ${file.name}`)
    )

    lines.push("")
  }

  if (modified.length) {
    lines.push(
      "Changes not staged for commit:"
    )

    modified.forEach(file =>
      lines.push(`  modified: ${file.name}`)
    )

    lines.push("")
  }

  if (untracked.length) {
    lines.push("Untracked files:")

    untracked.forEach(file =>
      lines.push(`  ${file.name}`)
    )

    lines.push("")
  }

  if (
    !repo.conflicts.length &&
    !staged.length &&
    !modified.length &&
    !untracked.length
  ) {
    lines.push(
      "nothing to commit, working tree clean"
    )
  }

  return lines.join("\n")
}

export function runCommand(
  repo: Repo,
  input: string
): CommandResult {
  const value = input.trim()

  if (value === "git init") {
    const next = structuredClone(repo)

    if (next.initialized) {
      return output(
        repo,
        "Reinitialized existing repository."
      )
    }

    next.initialized = true
    initFiles(next)

    return output(
      next,
      "Initialized empty Git repository."
    )
  }

  if (!repo.initialized) {
    return output(
      repo,
      "Not a git repository. Run git init first."
    )
  }

  if (value === "git status") {
    return output(repo, status(repo))
  }

  if (value === "git add .") {
    const next = structuredClone(repo)

    addAll(next)

    return output(
      next,
      "All changes staged."
    )
  }

  if (value.startsWith("git add ")) {
    const name = value.slice(8)
    const next = structuredClone(repo)

    if (!addFile(next, name)) {
      return output(
        repo,
        `fatal: pathspec '${name}' did not match any files`
      )
    }

    return output(
      next,
      `Changes to '${name}' staged.`
    )
  }

  if (value.startsWith("git edit ")) {
    const name = value.slice(9)
    const next = structuredClone(repo)

    if (!editFile(next, name)) {
      return output(
        repo,
        `File '${name}' not found.`
      )
    }

    return output(
      next,
      `Modified '${name}'.`
    )
  }

  if (value.startsWith("git resolve ")) {
    const name = value.slice(12)
    const next = structuredClone(repo)

    if (!resolveFile(next, name)) {
      return output(
        repo,
        `No conflict found in '${name}'.`
      )
    }

    return output(
      next,
      `Resolved '${name}'.`
    )
  }

  if (value.startsWith("git commit -m ")) {
    const match = value.match(
      /^git commit -m ["'](.+)["']$/
    )

    if (!match) {
      return output(
        repo,
        'Use: git commit -m "message"'
      )
    }

    if (repo.conflicts.length) {
      return output(
        repo,
        "Resolve all conflicts before committing."
      )
    }

    if (!repo.staging.length) {
      return output(
        repo,
        "Nothing to commit. Stage your changes first."
      )
    }

    const next = structuredClone(repo)
    const newCommit = commit(
      next,
      match[1]
    )

    cleanFiles(next)

    return output(
      next,
      `[${newCommit.branch} ${newCommit.id}] ${newCommit.message}`
    )
  }

  if (value.startsWith("git merge ")) {
    const next = structuredClone(repo)

    return output(
      next,
      merge(next, value.slice(10))
    )
  }

  if (value === "git reset HEAD~1") {
    const next = structuredClone(repo)
    const previous = reset(next)

    return output(
      previous ? next : repo,
      previous
        ? `HEAD is now at ${previous}`
        : "HEAD has no parent."
    )
  }

  if (value.startsWith("git revert ")) {
    const next = structuredClone(repo)
    const newCommit = revert(
      next,
      value.slice(11)
    )

    if (!newCommit) {
      return output(
        repo,
        "Commit not found."
      )
    }

    return output(
      next,
      `[${newCommit.branch} ${newCommit.id}] ${newCommit.message}`
    )
  }

  if (value === "git reflog") {
    return output(
      repo,
      repo.reflog.length
        ? repo.reflog.join("\n")
        : "No reflog entries yet."
    )
  }

  if (value === "git branch") {
    return output(
      repo,
      Object.keys(repo.branches)
        .map(name =>
          repo.head.type === "branch" &&
          name === repo.head.name
            ? `* ${name}`
            : `  ${name}`
        )
        .join("\n")
    )
  }

  if (value.startsWith("git branch -d ")) {
    const name = value.slice(14)
    const next = structuredClone(repo)

    if (!deleteBranch(next, name)) {
      return output(
        repo,
        `error: cannot delete branch '${name}'`
      )
    }

    return output(
      next,
      `Deleted branch ${name}.`
    )
  }

  if (value.startsWith("git branch ")) {
    const name = value.slice(11)
    const next = structuredClone(repo)

    if (!createBranch(next, name)) {
      return output(
        repo,
        `fatal: branch '${name}' already exists`
      )
    }

    return output(
      next,
      `Created branch ${name}.`
    )
  }

  if (value.startsWith("git checkout -b ")) {
    const name = value.slice(16)
    const next = structuredClone(repo)

    if (!createBranch(next, name)) {
      return output(
        repo,
        `fatal: branch '${name}' already exists`
      )
    }

    checkoutBranch(next, name)

    record(
      next,
      `checkout: moving to ${name}`
    )

    return output(
      next,
      `Switched to a new branch '${name}'.`
    )
  }

  if (value.startsWith("git checkout ")) {
    const name = value.slice(13)
    const next = structuredClone(repo)

    if (checkoutBranch(next, name)) {
      record(
        next,
        `checkout: moving to ${name}`
      )

      return output(
        next,
        `Switched to branch '${name}'.`
      )
    }

    const commitToCheckout =
      findCommit(repo, name)

    if (commitToCheckout) {
      next.head = {
        type: "detached",
        name: commitToCheckout.id
      }

      record(
        next,
        `checkout: detached HEAD at ${name}`
      )

      return output(
        next,
        `HEAD is now at ${name} ${commitToCheckout.message}`
      )
    }

    return output(
      repo,
      `'${name}' is not a branch or commit`
    )
  }

  if (value === "git log") {
    return output(
      repo,
      logHistory(repo)
    )
  }

  if (value === "git show") {
    const current = getHead(repo)

    const commitToShow = current
      ? findCommit(repo, current)
      : undefined

    if (!commitToShow) {
      return output(
        repo,
        "No commits yet."
      )
    }

    return output(
      repo,
      [
        `commit ${commitToShow.id}`,
        `message: ${commitToShow.message}`,
        `files: ${commitToShow.files.join(", ")}`
      ].join("\n")
    )
  }

  if (value === "help") {
    return output(
      repo,
      [
        "git init",
        "git status",
        "git edit <file>",
        "git add <file>",
        "git add .",
        "git resolve <file>",
        'git commit -m "message"',
        "git merge <branch>",
        "git reset HEAD~1",
        "git revert <commit>",
        "git reflog",
        "git branch",
        "git branch <name>",
        "git branch -d <name>",
        "git checkout <branch>",
        "git checkout -b <name>",
        "git checkout <commit>",
        "git log",
        "git show",
        "help"
      ].join("\n")
    )
  }

  return output(
    repo,
    `git: '${value}' is not a recognized command`
  )
}