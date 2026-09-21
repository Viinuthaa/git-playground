import {
  createCommit,
  type CommandResult,
  type Repo
} from "./git"

const head = (repo: Repo) =>
  repo.head.type === "branch"
    ? repo.branches[repo.head.name]
    : repo.head.commit

const file = (repo: Repo, name: string) =>
  repo.files.find(item => item.name === name)

const log = (repo: Repo, message: string) =>
  repo.reflog.unshift(message)

function initialFiles(repo: Repo) {
  repo.files = [
    {
      name: "index.html",
      content: "<html></html>",
      status: "untracked"
    },
    {
      name: "app.js",
      content: "console.log('hello')",
      status: "untracked"
    },
    {
      name: "README.md",
      content: "# Git Playground",
      status: "untracked"
    }
  ]
}

function commit(
  repo: Repo,
  message: string
): CommandResult {
  if (!repo.staging.length) {
    return {
      repo,
      output: "Nothing to commit. Stage your changes first."
    }
  }

  const next = structuredClone(repo)
  const current = head(next)

  const newCommit = createCommit(
    next,
    message,
    current ? [current] : []
  )

  next.commits.push(newCommit)

  if (next.head.type === "branch") {
    next.branches[next.head.name] = newCommit.id
  } else {
    next.head.commit = newCommit.id
  }

  next.files.forEach(item => {
    if (next.staging.includes(item.name)) {
      item.status = "clean"
    }
  })

  next.staging = []
  log(next, `${newCommit.id} ${message}`)

  return {
    repo: next,
    output:
      `[${newCommit.branch} ${newCommit.id}] ${message}`
  }
}

export function runCommand(
  repo: Repo,
  input: string
): CommandResult {
  const value = input.trim()

  if (value === "git init") {
    const next = structuredClone(repo)

    if (next.initialized) {
      return {
        repo,
        output: "Reinitialized existing repository."
      }
    }

    next.initialized = true
    initialFiles(next)

    return {
      repo: next,
      output: "Initialized empty Git repository."
    }
  }

  if (!repo.initialized) {
    return {
      repo,
      output: "Not a git repository. Run git init first."
    }
  }

  if (value === "git status") {
    const staged = repo.files.filter(
      item => repo.staging.includes(item.name)
    )

    const modified = repo.files.filter(
      item =>
        item.status === "modified" &&
        !repo.staging.includes(item.name)
    )

    const untracked = repo.files.filter(
      item => item.status === "untracked"
    )

    const branch =
      repo.head.type === "branch"
        ? repo.head.name
        : "detached HEAD"

    const lines = [`On ${branch}`, ""]

    if (staged.length) {
      lines.push("Changes to be committed:")
      staged.forEach(item =>
        lines.push(`  staged: ${item.name}`)
      )
      lines.push("")
    }

    if (modified.length) {
      lines.push("Changes not staged for commit:")
      modified.forEach(item =>
        lines.push(`  modified: ${item.name}`)
      )
      lines.push("")
    }

    if (untracked.length) {
      lines.push("Untracked files:")
      untracked.forEach(item =>
        lines.push(`  ${item.name}`)
      )
      lines.push("")
    }

    if (
      !staged.length &&
      !modified.length &&
      !untracked.length
    ) {
      lines.push("nothing to commit, working tree clean")
    }

    return {
      repo,
      output: lines.join("\n")
    }
  }

  if (value === "git add .") {
    const next = structuredClone(repo)

    next.files.forEach(item => {
      if (
        item.status === "untracked" ||
        item.status === "modified"
      ) {
        item.status = "staged"

        if (!next.staging.includes(item.name)) {
          next.staging.push(item.name)
        }
      }
    })

    return {
      repo: next,
      output: "All changes staged."
    }
  }

  if (value.startsWith("git add ")) {
    const name = value.slice(8)
    const next = structuredClone(repo)
    const item = file(next, name)

    if (!item) {
      return {
        repo,
        output: `fatal: pathspec '${name}' did not match any files`
      }
    }

    item.status = "staged"

    if (!next.staging.includes(name)) {
      next.staging.push(name)
    }

    return {
      repo: next,
      output: `Changes to '${name}' staged.`
    }
  }

  if (value.startsWith("git edit ")) {
    const name = value.slice(9)
    const next = structuredClone(repo)
    const item = file(next, name)

    if (!item) {
      return {
        repo,
        output: `File '${name}' not found.`
      }
    }

    item.content += "\n// change"
    item.status = "modified"
    next.staging = next.staging.filter(
      name => name !== item.name
    )

    return {
      repo: next,
      output: `Modified '${name}'.`
    }
  }

  if (value.startsWith("git commit -m ")) {
    const match = value.match(
      /^git commit -m ["'](.+)["']$/
    )

    if (!match) {
      return {
        repo,
        output: 'Use: git commit -m "message"'
      }
    }

    return commit(repo, match[1])
  }

  if (value === "git reset HEAD~1") {
    const current = head(repo)
    const commit = repo.commits.find(
      item => item.id === current
    )

    if (!commit?.parents[0]) {
      return {
        repo,
        output: "HEAD has no parent."
      }
    }

    const next = structuredClone(repo)
    const previous = commit.parents[0]

    if (next.head.type === "branch") {
      next.branches[next.head.name] = previous
    } else {
      next.head.commit = previous
    }

    log(next, `${previous} reset HEAD~1`)

    return {
      repo: next,
      output: `HEAD is now at ${previous}`
    }
  }

  if (value.startsWith("git revert ")) {
    const id = value.slice(11)
    const target = repo.commits.find(
      item => item.id === id
    )

    if (!target) {
      return {
        repo,
        output: `fatal: commit '${id}' not found`
      }
    }

    const current = head(repo)

    if (!current) {
      return {
        repo,
        output: "Nothing to revert."
      }
    }

    const next = structuredClone(repo)

    const newCommit = {
      id: Math.random().toString(16).slice(2, 9),
      message: `Revert "${target.message}"`,
      branch:
        next.head.type === "branch"
          ? next.head.name
          : "HEAD",
      parents: [current],
      files: [...target.files]
    }

    next.commits.push(newCommit)

    if (next.head.type === "branch") {
      next.branches[next.head.name] = newCommit.id
    } else {
      next.head.commit = newCommit.id
    }

    log(next, `${newCommit.id} ${newCommit.message}`)

    return {
      repo: next,
      output:
        `[${newCommit.branch} ${newCommit.id}] ${newCommit.message}`
    }
  }

  if (value === "git reflog") {
    return {
      repo,
      output:
        repo.reflog.length
          ? repo.reflog.join("\n")
          : "No reflog entries yet."
    }
  }

  if (value === "git branch") {
    return {
      repo,
      output: Object.keys(repo.branches)
        .map(name =>
          repo.head.type === "branch" &&
          name === repo.head.name
            ? `* ${name}`
            : `  ${name}`
        )
        .join("\n")
    }
  }

  if (value.startsWith("git branch -d ")) {
    const name = value.slice(14)

    if (repo.branches[name] === undefined) {
      return {
        repo,
        output: `error: branch '${name}' not found`
      }
    }

    if (
      repo.head.type === "branch" &&
      name === repo.head.name
    ) {
      return {
        repo,
        output: "error: cannot delete the current branch"
      }
    }

    const next = structuredClone(repo)
    delete next.branches[name]

    return {
      repo: next,
      output: `Deleted branch ${name}.`
    }
  }

  if (value.startsWith("git branch ")) {
    const name = value.slice(11)

    if (repo.branches[name] !== undefined) {
      return {
        repo,
        output: `fatal: branch '${name}' already exists`
      }
    }

    const next = structuredClone(repo)
    next.branches[name] = head(next)

    return {
      repo: next,
      output: `Created branch ${name}.`
    }
  }

  if (value.startsWith("git checkout -b ")) {
    const name = value.slice(16)

    if (repo.branches[name] !== undefined) {
      return {
        repo,
        output: `fatal: branch '${name}' already exists`
      }
    }

    const next = structuredClone(repo)

    next.branches[name] = head(next)
    next.head = {
      type: "branch",
      name
    }

    log(next, `checkout: moving to ${name}`)

    return {
      repo: next,
      output:
        `Switched to a new branch '${name}'.`
    }
  }

  if (value.startsWith("git checkout ")) {
    const name = value.slice(13)

    if (repo.branches[name] !== undefined) {
      const next = structuredClone(repo)

      next.head = {
        type: "branch",
        name
      }

      log(next, `checkout: moving to ${name}`)

      return {
        repo: next,
        output:
          `Switched to branch '${name}'.`
      }
    }

    const target = repo.commits.find(
      item => item.id === name
    )

    if (target) {
      const next = structuredClone(repo)

      next.head = {
        type: "detached",
        commit: target.id
      }

      log(next, `checkout: detached HEAD at ${name}`)

      return {
        repo: next,
        output:
          `HEAD is now at ${target.id} ${target.message}`
      }
    }

    return {
      repo,
      output:
        `error: '${name}' is not a branch or commit`
    }
  }

  if (value === "git log") {
    const result: string[] = []
    let current = head(repo)

    while (current) {
      const item = repo.commits.find(
        commit => commit.id === current
      )

      if (!item) break

      result.push(
        `commit ${item.id}\n${item.message}`
      )

      current = item.parents[0]
    }

    return {
      repo,
      output:
        result.length
          ? result.join("\n\n")
          : "No commits yet."
    }
  }

  if (value === "git show") {
    const current = head(repo)
    const item = repo.commits.find(
      commit => commit.id === current
    )

    if (!item) {
      return {
        repo,
        output: "No commits yet."
      }
    }

    return {
      repo,
      output: [
        `commit ${item.id}`,
        `message: ${item.message}`,
        `files: ${item.files.join(", ")}`
      ].join("\n")
    }
  }

  if (value === "help") {
    return {
      repo,
      output: [
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
    }
  }

  return {
    repo,
    output:
      `git: '${value}' is not a recognized command`
  }
}