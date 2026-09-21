import {
  createCommit,
  type CommandResult,
  type Repo
} from "./git"

const result = (
  repo: Repo,
  output: string
): CommandResult => ({ repo, output })

const hasBranch = (repo: Repo, name: string) =>
  Object.hasOwn(repo.branches, name)

function requireRepo(repo: Repo) {
  return repo.initialized
    ? null
    : result(repo, "Not a git repository.")
}

function init(repo: Repo) {
  return result(
    { ...repo, initialized: true },
    "Initialized empty Git repository."
  )
}

function status(repo: Repo) {
  const error = requireRepo(repo)
  if (error) return error

  return result(
    repo,
    `On branch ${repo.currentBranch}`
  )
}

function branch(repo: Repo, name?: string) {
  const error = requireRepo(repo)
  if (error) return error

  if (!name) {
    return result(
      repo,
      Object.keys(repo.branches).join("\n")
    )
  }

  if (hasBranch(repo, name)) {
    return result(
      repo,
      `Branch '${name}' already exists.`
    )
  }

  return result(
    {
      ...repo,
      branches: {
        ...repo.branches,
        [name]: repo.branches[repo.currentBranch]
      }
    },
    `Created branch '${name}'.`
  )
}

function deleteBranch(
  repo: Repo,
  name?: string
) {
  const error = requireRepo(repo)
  if (error) return error

  if (!name) {
    return result(repo, "Branch name required.")
  }

  if (!hasBranch(repo, name)) {
    return result(
      repo,
      `Branch '${name}' not found.`
    )
  }

  if (name === repo.currentBranch) {
    return result(
      repo,
      `Cannot delete the current branch '${name}'.`
    )
  }

  const branches = { ...repo.branches }
  delete branches[name]

  return result(
    { ...repo, branches },
    `Deleted branch '${name}'.`
  )
}

function checkout(
  repo: Repo,
  name?: string,
  create = false
) {
  const error = requireRepo(repo)
  if (error) return error

  if (!name) {
    return result(repo, "Branch name required.")
  }

  if (create) {
    if (hasBranch(repo, name)) {
      return result(
        repo,
        `Branch '${name}' already exists.`
      )
    }

    return result(
      {
        ...repo,
        branches: {
          ...repo.branches,
          [name]: repo.branches[repo.currentBranch]
        },
        currentBranch: name
      },
      `Switched to a new branch '${name}'.`
    )
  }

  if (!hasBranch(repo, name)) {
    return result(
      repo,
      `Branch '${name}' not found.`
    )
  }

  return result(
    { ...repo, currentBranch: name },
    `Switched to branch '${name}'.`
  )
}

function commit(repo: Repo, value: string) {
  const error = requireRepo(repo)
  if (error) return error

  const match = value.match(
    /git commit -m ["'](.+)["']/
  )

  if (!match) {
    return result(repo, "Commit message required.")
  }

  const message = match[1]
  const parent = repo.branches[repo.currentBranch]

  const newCommit = createCommit(
    repo,
    message,
    parent ? [parent] : []
  )

  return result(
    {
      ...repo,
      commits: [...repo.commits, newCommit],
      branches: {
        ...repo.branches,
        [repo.currentBranch]: newCommit.id
      }
    },
    `[${repo.currentBranch}] ${message}`
  )
}

function reachable(repo: Repo) {
  const found = new Set<string>()

  function visit(id: string | null) {
    if (!id || found.has(id)) return

    const commit = repo.commits.find(
      item => item.id === id
    )

    if (!commit) return

    found.add(id)
    commit.parents.forEach(visit)
  }

  visit(repo.branches[repo.currentBranch])
  return found
}

function log(repo: Repo) {
  const error = requireRepo(repo)
  if (error) return error

  const commits = reachable(repo)

  if (!commits.size) {
    return result(repo, "No commits yet.")
  }

  return result(
    repo,
    repo.commits
      .slice()
      .reverse()
      .filter(commit => commits.has(commit.id))
      .map(commit => `${commit.id} ${commit.message}`)
      .join("\n")
  )
}

function show(repo: Repo) {
  const error = requireRepo(repo)
  if (error) return error

  const head = repo.branches[repo.currentBranch]

  const commit = repo.commits.find(
    item => item.id === head
  )

  if (!commit) {
    return result(repo, "No commits yet.")
  }

  return result(
    repo,
    `commit ${commit.id}\n${commit.message}`
  )
}

function merge(repo: Repo, name?: string) {
  const error = requireRepo(repo)
  if (error) return error

  if (!name) {
    return result(repo, "Branch name required.")
  }

  if (!hasBranch(repo, name)) {
    return result(
      repo,
      `Branch '${name}' not found.`
    )
  }

  if (name === repo.currentBranch) {
    return result(
      repo,
      "Cannot merge a branch into itself."
    )
  }

  const current =
    repo.branches[repo.currentBranch]

  const target = repo.branches[name]

  if (!current || !target) {
    return result(repo, "Nothing to merge.")
  }

  const mergeCommit = createCommit(
    repo,
    `Merge branch '${name}'`,
    [current, target]
  )

  return result(
    {
      ...repo,
      commits: [...repo.commits, mergeCommit],
      branches: {
        ...repo.branches,
        [repo.currentBranch]: mergeCommit.id
      }
    },
    `Merged '${name}' into '${repo.currentBranch}'.`
  )
}

function reset(repo: Repo, target?: string) {
  const error = requireRepo(repo)
  if (error) return error

  if (target !== "HEAD~1") {
    return result(repo, "Usage: git reset HEAD~1")
  }

  const head = repo.branches[repo.currentBranch]

  const commit = repo.commits.find(
    item => item.id === head
  )

  if (!commit?.parents.length) {
    return result(repo, "Nothing to reset.")
  }

  const previous = commit.parents[0]

  return result(
    {
      ...repo,
      branches: {
        ...repo.branches,
        [repo.currentBranch]: previous
      }
    },
    `Reset '${repo.currentBranch}' to ${previous}.`
  )
}

function help(repo: Repo) {
  return result(
    repo,
    [
      "git init",
      "git status",
      "git branch",
      "git branch <name>",
      "git branch -d <name>",
      "git checkout <branch>",
      "git checkout -b <name>",
      'git commit -m "message"',
      "git log",
      "git show",
      "git merge <branch>",
      "git reset HEAD~1"
    ].join("\n")
  )
}

export function runCommand(
  repo: Repo,
  value: string
): CommandResult {
  const parts = value.trim().split(/\s+/)
  const command = parts.slice(0, 2).join(" ")
  const args = parts.slice(2)

  if (
    command === "git checkout" &&
    args[0] === "-b"
  ) {
    return checkout(repo, args[1], true)
  }

  if (
    command === "git branch" &&
    args[0] === "-d"
  ) {
    return deleteBranch(repo, args[1])
  }

  switch (command) {
    case "git init":
      return init(repo)

    case "git status":
      return status(repo)

    case "git branch":
      return branch(repo, args[0])

    case "git checkout":
      return checkout(repo, args[0])

    case "git commit":
      return commit(repo, value)

    case "git log":
      return log(repo)

    case "git show":
      return show(repo)

    case "git merge":
      return merge(repo, args[0])

    case "git reset":
      return reset(repo, args[0])

    case "help":
      return help(repo)

    default:
      return result(
        repo,
        `Unknown command: ${value}`
      )
  }
}