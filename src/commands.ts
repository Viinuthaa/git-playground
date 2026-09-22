import {
  type CommandResult,
  type Repo
} from "./git"

import {
  createFiles,
  findFile,
  addFile,
  addAll,
  editFile,
  cleanStagedFiles
} from "./files"

import {
  createBranch,
  deleteBranch,
  checkoutBranch
} from "./branches"

import {
  getHead,
  addReflog,
  makeCommit,
  findCommit,
  resetHead,
  revertCommit,
  getLog
} from "./history"

function result(
  repo: Repo,
  output: string
): CommandResult {
  return { repo, output }
}

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

  if (staged.length) {
    lines.push("Changes to be committed:")
    staged.forEach(file =>
      lines.push(`  staged: ${file.name}`)
    )
    lines.push("")
  }

  if (modified.length) {
    lines.push("Changes not staged for commit:")
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
      return result(
        repo,
        "Reinitialized existing repository."
      )
    }

    next.initialized = true
    createFiles(next)

    return result(
      next,
      "Initialized empty Git repository."
    )
  }

  if (!repo.initialized) {
    return result(
      repo,
      "Not a git repository. Run git init first."
    )
  }

  if (value === "git status") {
    return result(repo, status(repo))
  }

  if (value === "git add .") {
    const next = structuredClone(repo)
    addAll(next)

    return result(next, "All changes staged.")
  }

  if (value.startsWith("git add ")) {
    const name = value.slice(8)
    const next = structuredClone(repo)

    if (!addFile(next, name)) {
      return result(
        repo,
        `fatal: pathspec '${name}' did not match any files`
      )
    }

    return result(
      next,
      `Changes to '${name}' staged.`
    )
  }

  if (value.startsWith("git edit ")) {
    const name = value.slice(9)
    const next = structuredClone(repo)

    if (!editFile(next, name)) {
      return result(
        repo,
        `File '${name}' not found.`
      )
    }

    return result(
      next,
      `Modified '${name}'.`
    )
  }

  if (value.startsWith("git commit -m ")) {
    const match = value.match(
      /^git commit -m ["'](.+)["']$/
    )

    if (!match) {
      return result(
        repo,
        'Use: git commit -m "message"'
      )
    }

    if (!repo.staging.length) {
      return result(
        repo,
        "Nothing to commit. Stage your changes first."
      )
    }

    const next = structuredClone(repo)
    const commit = makeCommit(next, match[1])

    cleanStagedFiles(next)

    return result(
      next,
      `[${commit.branch} ${commit.id}] ${commit.message}`
    )
  }

  if (value === "git reset HEAD~1") {
    const next = structuredClone(repo)
    const previous = resetHead(next)

    return result(
      previous ? next : repo,
      previous
        ? `HEAD is now at ${previous}`
        : "HEAD has no parent."
    )
  }

  if (value.startsWith("git revert ")) {
    const id = value.slice(11)
    const next = structuredClone(repo)
    const commit = revertCommit(next, id)

    if (!commit) {
      return result(
        repo,
        `fatal: commit '${id}' not found`
      )
    }

    return result(
      next,
      `[${commit.branch} ${commit.id}] ${commit.message}`
    )
  }

  if (value === "git reflog") {
    return result(
      repo,
      repo.reflog.length
        ? repo.reflog.join("\n")
        : "No reflog entries yet."
    )
  }

  if (value === "git branch") {
    return result(
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
      return result(
        repo,
        `error: cannot delete branch '${name}'`
      )
    }

    return result(
      next,
      `Deleted branch ${name}.`
    )
  }

  if (value.startsWith("git branch ")) {
    const name = value.slice(11)
    const next = structuredClone(repo)

    if (!createBranch(next, name)) {
      return result(
        repo,
        `fatal: branch '${name}' already exists`
      )
    }

    return result(
      next,
      `Created branch ${name}.`
    )
  }

  if (value.startsWith("git checkout -b ")) {
    const name = value.slice(16)
    const next = structuredClone(repo)

    if (!createBranch(next, name)) {
      return result(
        repo,
        `fatal: branch '${name}' already exists`
      )
    }

    checkoutBranch(next, name)
    addReflog(
      next,
      `checkout: moving to ${name}`
    )

    return result(
      next,
      `Switched to a new branch '${name}'.`
    )
  }

  if (value.startsWith("git checkout ")) {
    const name = value.slice(13)
    const next = structuredClone(repo)

    if (checkoutBranch(next, name)) {
      addReflog(
        next,
        `checkout: moving to ${name}`
      )

      return result(
        next,
        `Switched to branch '${name}'.`
      )
    }

    const commit = findCommit(repo, name)

    if (commit) {
      next.head = {
        type: "detached",
        name: commit.id
      }

      addReflog(
        next,
        `checkout: detached HEAD at ${commit.id}`
      )

      return result(
        next,
        `HEAD is now at ${commit.id} ${commit.message}`
      )
    }

    return result(
      repo,
      `'${name}' is not a branch or commit`
    )
  }

  if (value === "git log") {
    return result(repo, getLog(repo))
  }

  if (value === "git show") {
    const current = getHead(repo)
    const commit = current
      ? findCommit(repo, current)
      : undefined

    if (!commit) {
      return result(repo, "No commits yet.")
    }

    return result(
      repo,
      [
        `commit ${commit.id}`,
        `message: ${commit.message}`,
        `files: ${commit.files.join(", ")}`
      ].join("\n")
    )
  }

  if (value === "help") {
    return result(
      repo,
      [
        "git init",
        "git status",
        "git edit <file>",
        "git add <file>",
        "git add .",
        'git commit -m "message"',
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

  return result(
    repo,
    `git: '${value}' is not a recognized command`
  )
}