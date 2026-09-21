import {
  createCommit,
  type CommandResult,
  type Repo
} from "./git"

function getHead(repo: Repo) {
  return repo.branches[repo.head.name]
}

function findFile(repo: Repo, name: string) {
  return repo.files.find(file => file.name === name)
}

function createFiles(repo: Repo) {
  if (repo.files.length > 0) return

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

export function runCommand(
  repo: Repo,
  input: string
): CommandResult {
  const value = input.trim()

  if (value === "git init") {
    if (repo.initialized) {
      return {
        repo,
        output: "Reinitialized existing repository."
      }
    }

    const next = structuredClone(repo)
    next.initialized = true
    createFiles(next)

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
    const lines = [
      `On branch ${repo.head.name}`,
      ""
    ]

    if (repo.staging.length > 0) {
      lines.push("Changes to be committed:")

      repo.files
        .filter(file => repo.staging.includes(file.name))
        .forEach(file => {
          lines.push(`  staged: ${file.name}`)
        })

      lines.push("")
    }

    const changed = repo.files.filter(
      file =>
        file.status === "modified" &&
        !repo.staging.includes(file.name)
    )

    const untracked = repo.files.filter(
      file => file.status === "untracked"
    )

    if (changed.length > 0) {
      lines.push("Changes not staged for commit:")

      changed.forEach(file => {
        lines.push(`  modified: ${file.name}`)
      })

      lines.push("")
    }

    if (untracked.length > 0) {
      lines.push("Untracked files:")

      untracked.forEach(file => {
        lines.push(`  ${file.name}`)
      })
    }

    if (
      repo.staging.length === 0 &&
      changed.length === 0 &&
      untracked.length === 0
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

    next.files.forEach(file => {
      if (
        file.status === "untracked" ||
        file.status === "modified"
      ) {
        file.status = "staged"

        if (!next.staging.includes(file.name)) {
          next.staging.push(file.name)
        }
      }
    })

    return {
      repo: next,
      output: "All changes staged."
    }
  }

  if (value.startsWith("git add ")) {
    const name = value.slice(8).trim()
    const next = structuredClone(repo)
    const file = findFile(next, name)

    if (!file) {
      return {
        repo,
        output: `fatal: pathspec '${name}' did not match any files`
      }
    }

    file.status = "staged"

    if (!next.staging.includes(name)) {
      next.staging.push(name)
    }

    return {
      repo: next,
      output: `Changes to '${name}' staged.`
    }
  }

  if (value.startsWith("git edit ")) {
    const name = value.slice(9).trim()
    const next = structuredClone(repo)
    const file = findFile(next, name)

    if (!file) {
      return {
        repo,
        output: `File '${name}' not found.`
      }
    }

    file.content += "\n// change"
    file.status = "modified"

    next.staging = next.staging.filter(
      fileName => fileName !== name
    )

    return {
      repo: next,
      output: `Modified '${name}'.`
    }
  }

  if (value.startsWith("git commit -m ")) {
    if (repo.staging.length === 0) {
      return {
        repo,
        output: "Nothing to commit. Stage your changes first."
      }
    }

    const match = value.match(
      /^git commit -m ["'](.+)["']$/
    )

    if (!match) {
      return {
        repo,
        output: 'Use: git commit -m "message"'
      }
    }

    const next = structuredClone(repo)
    const parent = getHead(next)

    const commit = createCommit(
      next,
      match[1],
      parent ? [parent] : []
    )

    next.commits.push(commit)
    next.branches[next.head.name] = commit.id

    next.files.forEach(file => {
      if (next.staging.includes(file.name)) {
        file.status = "clean"
      }
    })

    next.staging = []

    return {
      repo: next,
      output: `[${next.head.name} ${commit.id}] ${commit.message}`
    }
  }

  if (value === "git branch") {
    const names = Object.keys(repo.branches)

    return {
      repo,
      output: names
        .map(name =>
          name === repo.head.name
            ? `* ${name}`
            : `  ${name}`
        )
        .join("\n")
    }
  }

  if (value.startsWith("git branch -d ")) {
    const name = value.slice(14).trim()

    if (!repo.branches[name]) {
      return {
        repo,
        output: `error: branch '${name}' not found`
      }
    }

    if (name === repo.head.name) {
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
    const name = value.slice(11).trim()

    if (!name) {
      return {
        repo,
        output: "Please provide a branch name."
      }
    }

    if (repo.branches[name] !== undefined) {
      return {
        repo,
        output: `fatal: branch '${name}' already exists`
      }
    }

    const next = structuredClone(repo)
    next.branches[name] = getHead(next)

    return {
      repo: next,
      output: `Created branch ${name}.`
    }
  }

  if (value.startsWith("git checkout -b ")) {
    const name = value.slice(16).trim()

    if (!name) {
      return {
        repo,
        output: "Please provide a branch name."
      }
    }

    if (repo.branches[name] !== undefined) {
      return {
        repo,
        output: `fatal: branch '${name}' already exists`
      }
    }

    const next = structuredClone(repo)
    next.branches[name] = getHead(next)
    next.head.name = name

    return {
      repo: next,
      output: `Switched to a new branch '${name}'.`
    }
  }

  if (value.startsWith("git checkout ")) {
    const name = value.slice(13).trim()

    if (repo.branches[name] === undefined) {
      return {
        repo,
        output: `error: pathspec '${name}' did not match any branch`
      }
    }

    const next = structuredClone(repo)
    next.head.name = name

    return {
      repo: next,
      output: `Switched to branch '${name}'.`
    }
  }

  if (value === "git log") {
    const commits = []
    let current = getHead(repo)

    while (current) {
      const commit = repo.commits.find(
        item => item.id === current
      )

      if (!commit) break

      commits.push(
        `commit ${commit.id}\n${commit.message}`
      )

      current = commit.parents[0]
    }

    return {
      repo,
      output:
        commits.length > 0
          ? commits.join("\n\n")
          : "No commits yet."
    }
  }

  if (value === "git show") {
    const head = getHead(repo)

    if (!head) {
      return {
        repo,
        output: "No commits yet."
      }
    }

    const commit = repo.commits.find(
      item => item.id === head
    )

    if (!commit) {
      return {
        repo,
        output: "Commit not found."
      }
    }

    return {
      repo,
      output: [
        `commit ${commit.id}`,
        `message: ${commit.message}`,
        `files: ${commit.files.join(", ")}`
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
        "git branch",
        "git branch <name>",
        "git branch -d <name>",
        "git checkout <branch>",
        "git checkout -b <name>",
        "git log",
        "git show",
        "help"
      ].join("\n")
    }
  }

  return {
    repo,
    output: `git: '${value}' is not a recognized command`
  }
}