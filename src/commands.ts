import {
  createCommit,
  type CommandResult,
  type Repo
} from "./git"

type ParsedCommand = {
  command: string
  args: string[]
}

function parseCommand(value: string): ParsedCommand {
  const parts = value.trim().split(/\s+/)

  return {
    command: parts.slice(0, 2).join(" "),
    args: parts.slice(2)
  }
}

function notRepository(repo: Repo): CommandResult {
  return {
    repo,
    output: "Not a git repository."
  }
}

function runInit(repo: Repo): CommandResult {
  return {
    repo: {
      ...repo,
      initialized: true
    },
    output: "Initialized empty Git repository."
  }
}

function runStatus(repo: Repo): CommandResult {
  if (!repo.initialized) {
    return notRepository(repo)
  }

  return {
    repo,
    output: `On branch ${repo.currentBranch}`
  }
}

function runBranch(
  repo: Repo,
  name?: string
): CommandResult {
  if (!repo.initialized) {
    return notRepository(repo)
  }

  if (!name) {
    return {
      repo,
      output: Object.keys(repo.branches).join("\n")
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      repo.branches,
      name
    )
  ) {
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

function runCheckout(
  repo: Repo,
  name?: string,
  createBranch = false
): CommandResult {
  if (!repo.initialized) {
    return notRepository(repo)
  }

  if (!name) {
    return {
      repo,
      output: "Branch name required."
    }
  }

  if (createBranch) {
    if (
      Object.prototype.hasOwnProperty.call(
        repo.branches,
        name
      )
    ) {
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

  if (
    !Object.prototype.hasOwnProperty.call(
      repo.branches,
      name
    )
  ) {
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

function runCommit(
  repo: Repo,
  value: string
): CommandResult {
  if (!repo.initialized) {
    return notRepository(repo)
  }

  const messageMatch = value.match(
    /git commit -m ["'](.+)["']/
  )

  if (!messageMatch) {
    return {
      repo,
      output: "Commit message required."
    }
  }

  const message = messageMatch[1]
  const parent = repo.branches[repo.currentBranch]

  const commit = createCommit(
    repo,
    message,
    parent ? [parent] : []
  )

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

function runLog(repo: Repo): CommandResult {
  if (!repo.initialized) {
    return notRepository(repo)
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
      .map(
        commit =>
          `${commit.id} ${commit.message}`
      )
      .join("\n")
  }
}

function runShow(repo: Repo): CommandResult {
  const latest =
    repo.commits[repo.commits.length - 1]

  if (!latest) {
    return {
      repo,
      output: "No commits yet."
    }
  }

  return {
    repo,
    output:
      `commit ${latest.id}\n` +
      `${latest.message}`
  }
}

function runMerge(
  repo: Repo,
  branchName?: string
): CommandResult {
  if (!repo.initialized) {
    return notRepository(repo)
  }

  if (!branchName) {
    return {
      repo,
      output: "Branch name required."
    }
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      repo.branches,
      branchName
    )
  ) {
    return {
      repo,
      output: `Branch '${branchName}' not found.`
    }
  }

  const currentCommit =
    repo.branches[repo.currentBranch]

  const targetCommit =
    repo.branches[branchName]

  if (!currentCommit || !targetCommit) {
    return {
      repo,
      output: "Nothing to merge."
    }
  }

  const mergeCommit = createCommit(
    repo,
    `Merge branch '${branchName}'`,
    [currentCommit, targetCommit]
  )

  return {
    repo: {
      ...repo,
      commits: [
        ...repo.commits,
        mergeCommit
      ],
      branches: {
        ...repo.branches,
        [repo.currentBranch]:
          mergeCommit.id
      }
    },
    output:
      `Merged '${branchName}' into ` +
      `'${repo.currentBranch}'.`
  }
}

function runReset(repo: Repo): CommandResult {
  if (!repo.initialized) {
    return notRepository(repo)
  }

  const currentCommitId =
    repo.branches[repo.currentBranch]

  if (!currentCommitId) {
    return {
      repo,
      output: "Nothing to reset."
    }
  }

  const currentCommit = repo.commits.find(
    commit => commit.id === currentCommitId
  )

  if (!currentCommit || currentCommit.parents.length === 0) {
    return {
      repo,
      output: "Nothing to reset."
    }
  }

  const previousCommit =
    currentCommit.parents[0]

  return {
    repo: {
      ...repo,
      branches: {
        ...repo.branches,
        [repo.currentBranch]: previousCommit
      }
    },
    output:
      `Reset '${repo.currentBranch}' to ` +
      `${previousCommit}.`
  }
}

function runHelp(repo: Repo): CommandResult {
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
      "git merge <branch>",
      "git reset"
    ].join("\n")
  }
}

export function runCommand(
  repo: Repo,
  value: string
): CommandResult {
  const parsed = parseCommand(value)

  if (
    parsed.command === "git checkout" &&
    parsed.args[0] === "-b"
  ) {
    return runCheckout(
      repo,
      parsed.args[1],
      true
    )
  }

  switch (parsed.command) {
    case "git init":
      return runInit(repo)

    case "git status":
      return runStatus(repo)

    case "git branch":
      return runBranch(
        repo,
        parsed.args[0]
      )

    case "git checkout":
      return runCheckout(
        repo,
        parsed.args[0]
      )

    case "git commit":
      return runCommit(repo, value)

    case "git log":
      return runLog(repo)

    case "git show":
      return runShow(repo)

    case "git merge":
      return runMerge(
        repo,
        parsed.args[0]
      )

    case "git reset":
      return runReset(repo)

    case "help":
      return runHelp(repo)

    default:
      return {
        repo,
        output: `Unknown command: ${value}`
      }
  }
}