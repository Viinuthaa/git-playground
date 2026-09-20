export type Commit = {
  id: string
  message: string
  branch: string
  parents: string[]
}

export type Branches = Record<string, string | null>

export type Repo = {
  initialized: boolean
  commits: Commit[]
  branches: Branches
  currentBranch: string
}

export type CommandResult = {
  repo: Repo
  output: string
}

function makeId(): string {
  return Math.random().toString(16).slice(2, 9)
}

export function createRepo(): Repo {
  return {
    initialized: false,
    commits: [],
    branches: {
      main: null
    },
    currentBranch: "main"
  }
}

export function runCommand(repo: Repo, value: string): CommandResult {
  const parts = value.trim().split(" ")
  const command = parts[0]

  if (command === "git" && parts[1] === "init") {
    return {
      repo: {
        ...repo,
        initialized: true
      },
      output: "Initialized empty Git repository."
    }
  }

  if (command === "git" && parts[1] === "status") {
    if (!repo.initialized) {
      return {
        repo,
        output: "Not a git repository."
      }
    }

    return {
      repo,
      output: `On branch ${repo.currentBranch}`
    }
  }

  if (command === "git" && parts[1] === "branch") {
    if (!repo.initialized) {
      return {
        repo,
        output: "Not a git repository."
      }
    }

    if (!parts[2]) {
      return {
        repo,
        output: Object.keys(repo.branches).join("\n")
      }
    }

    const name = parts[2]

    if (repo.branches[name]) {
      return {
        repo,
        output: `Branch '${name}' already exists.`
      }
    }

    return {
      repo: {
        ...repo,
        branches: {
          ...repo.branches,
          [name]: repo.branches[repo.currentBranch]
        }
      },
      output: `Created branch '${name}'.`
    }
  }

  if (command === "git" && parts[1] === "checkout") {
    if (!repo.initialized) {
      return {
        repo,
        output: "Not a git repository."
      }
    }

    if (parts[2] === "-b") {
      const name = parts[3]

      if (!name) {
        return {
          repo,
          output: "Branch name required."
        }
      }

      if (repo.branches[name]) {
        return {
          repo,
          output: `Branch '${name}' already exists.`
        }
      }

      return {
        repo: {
          ...repo,
          branches: {
            ...repo.branches,
            [name]: repo.branches[repo.currentBranch]
          },
          currentBranch: name
        },
        output: `Switched to a new branch '${name}'.`
      }
    }

    const name = parts[2]

    if (!name || !repo.branches[name]) {
      return {
        repo,
        output: `Branch '${name}' not found.`
      }
    }

    return {
      repo: {
        ...repo,
        currentBranch: name
      },
      output: `Switched to branch '${name}'.`
    }
  }

  if (command === "git" && parts[1] === "commit") {
    if (!repo.initialized) {
      return {
        repo,
        output: "Not a git repository."
      }
    }

    const messageMatch = value.match(/git commit -m ["'](.+)["']/)

    if (!messageMatch) {
      return {
        repo,
        output: "Commit message required."
      }
    }

    const message = messageMatch[1]

    const parent = repo.branches[repo.currentBranch]

    const commit: Commit = {
      id: makeId(),
      message,
      branch: repo.currentBranch,
      parents: parent ? [parent] : []
    }

    return {
      repo: {
        ...repo,
        commits: [...repo.commits, commit],
        branches: {
          ...repo.branches,
          [repo.currentBranch]: commit.id
        }
      },
      output: `[${repo.currentBranch}] ${message}`
    }
  }

  if (command === "git" && parts[1] === "log") {
    if (!repo.initialized) {
      return {
        repo,
        output: "Not a git repository."
      }
    }

    if (repo.commits.length === 0) {
      return {
        repo,
        output: "No commits yet."
      }
    }

    return {
      repo,
      output: repo.commits
        .slice()
        .reverse()
        .map(commit => `${commit.id} ${commit.message}`)
        .join("\n")
    }
  }

  if (command === "git" && parts[1] === "show") {
    const latest = repo.commits[repo.commits.length - 1]

    if (!latest) {
      return {
        repo,
        output: "No commits yet."
      }
    }

    return {
      repo,
      output: `commit ${latest.id}\n${latest.message}`
    }
  }

  if (command === "git" && parts[1] === "merge") {
    const branchName = parts[2]

    if (!branchName || !repo.branches[branchName]) {
      return {
        repo,
        output: `Branch '${branchName}' not found.`
      }
    }

    const currentCommit = repo.branches[repo.currentBranch]
    const targetCommit = repo.branches[branchName]

    if (!currentCommit) {
      return {
        repo,
        output: "Nothing to merge."
      }
    }

    if (!targetCommit) {
      return {
        repo,
        output: "Nothing to merge."
      }
    }

    const mergeCommit: Commit = {
      id: makeId(),
      message: `Merge branch '${branchName}'`,
      branch: repo.currentBranch,
      parents: [currentCommit, targetCommit]
    }

    return {
      repo: {
        ...repo,
        commits: [...repo.commits, mergeCommit],
        branches: {
          ...repo.branches,
          [repo.currentBranch]: mergeCommit.id
        }
      },
      output: `Merged '${branchName}' into '${repo.currentBranch}'.`
    }
  }

  if (value === "help") {
    return {
      repo,
      output: [
        "git init",
        "git status",
        "git branch",
        "git branch <name>",
        "git checkout <branch>",
        "git checkout -b <name>",
        'git commit -m "message"',
        "git log",
        "git show",
        "git merge <branch>"
      ].join("\n")
    }
  }

  return {
    repo,
    output: `Unknown command: ${value}`
  }
}