export function createRepo() {
  return {
    initialized: false,
    commits: [],
    branches: { main: null },
    currentBranch: "main"
  }
}

function makeId() {
  return Math.random().toString(16).slice(2, 9)
}

export function runCommand(repo, value) {
  const parts = value.trim().split(" ")
  const command = parts[0]

  if (value === "git init") {
    if (repo.initialized) {
      return { repo, output: "Reinitialized existing repository." }
    }

    return {
      repo: { ...repo, initialized: true },
      output: "Initialized empty Git repository."
    }
  }

  if (!repo.initialized) {
    return {
      repo,
      output: "Not a git repository. Run 'git init' first."
    }
  }

  if (value === "git status") {
    return {
      repo,
      output: `On branch ${repo.currentBranch}\nNothing to commit, working tree clean.`
    }
  }

  if (value === "git branch") {
    const branches = Object.keys(repo.branches)
      .map(branch =>
        branch === repo.currentBranch ? `* ${branch}` : `  ${branch}`
      )
      .join("\n")

    return { repo, output: branches }
  }

  if (value.startsWith("git branch ")) {
    const name = value.replace("git branch ", "").trim()

    if (!name) {
      return { repo, output: "Branch name required." }
    }

    if (repo.branches[name]) {
      return { repo, output: `Branch '${name}' already exists.` }
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

  if (value.startsWith("git checkout -b ")) {
    const name = value.replace("git checkout -b ", "").trim()

    if (!name) {
      return { repo, output: "Branch name required." }
    }

    if (repo.branches[name]) {
      return { repo, output: `Branch '${name}' already exists.` }
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

  if (value.startsWith("git checkout ")) {
    const name = value.replace("git checkout ", "").trim()

    if (!repo.branches[name]) {
      return { repo, output: `Branch '${name}' not found.` }
    }

    return {
      repo: {
        ...repo,
        currentBranch: name
      },
      output: `Switched to branch '${name}'.`
    }
  }

  if (value.startsWith("git commit -m ")) {
    const match = value.match(/git commit -m ["'](.+)["']/)

    if (!match) {
      return {
        repo,
        output: 'Use: git commit -m "message"'
      }
    }

    const message = match[1]
    const id = makeId()
    const parent = repo.branches[repo.currentBranch]

    const commit = {
      id,
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
          [repo.currentBranch]: id
        }
      },
      output: `[${repo.currentBranch} ${id}] ${message}`
    }
  }

  if (value === "git log") {
    if (repo.commits.length === 0) {
      return { repo, output: "No commits yet." }
    }

    const commits = [...repo.commits].reverse()
      .map(commit => `commit ${commit.id}\n    ${commit.message}`)
      .join("\n\n")

    return { repo, output: commits }
  }

  if (value === "git show") {
    const head = repo.branches[repo.currentBranch]
    const commit = repo.commits.find(item => item.id === head)

    if (!commit) {
      return { repo, output: "No commits to show." }
    }

    return {
      repo,
      output: `commit ${commit.id}\n\n    ${commit.message}`
    }
  }

  if (value.startsWith("git merge ")) {
    const branchName = value.replace("git merge ", "").trim()

    if (!repo.branches[branchName]) {
      return {
        repo,
        output: `Branch '${branchName}' not found.`
      }
    }

    if (branchName === repo.currentBranch) {
      return {
        repo,
        output: "Already up to date."
      }
    }

    const id = makeId()
    const currentHead = repo.branches[repo.currentBranch]
    const targetHead = repo.branches[branchName]

    const commit = {
      id,
      message: `Merge branch '${branchName}'`,
      branch: repo.currentBranch,
      parents: [currentHead, targetHead].filter(Boolean)
    }

    return {
      repo: {
        ...repo,
        commits: [...repo.commits, commit],
        branches: {
          ...repo.branches,
          [repo.currentBranch]: id
        }
      },
      output: `Merge made by simulated Git.\n[${repo.currentBranch} ${id}] Merge branch '${branchName}'`
    }
  }

  if (value === "help") {
    return {
      repo,
      output:
        "Available commands:\n" +
        "git init\n" +
        "git status\n" +
        "git branch\n" +
        "git branch <name>\n" +
        "git checkout <branch>\n" +
        "git checkout -b <name>\n" +
        'git commit -m "message"\n' +
        "git log\n" +
        "git show\n" +
        "git merge <branch>"
    }
  }

  return {
    repo,
    output: `git: '${command}' is not a simulated command.`
  }
}