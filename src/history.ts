import {
  createCommit,
  type Repo
} from "./git"

export function getHead(repo: Repo) {
  return repo.head.type === "detached"
    ? repo.head.name
    : repo.branches[repo.head.name]
}

export function addReflog(
  repo: Repo,
  message: string
) {
  repo.reflog.unshift(message)
}

export function makeCommit(
  repo: Repo,
  message: string
) {
  const parent = getHead(repo)

  const commit = createCommit(
    repo,
    message,
    parent ? [parent] : []
  )

  repo.commits.push(commit)

  if (repo.head.type === "branch") {
    repo.branches[repo.head.name] = commit.id
  } else {
    repo.head.name = commit.id
  }

  addReflog(
    repo,
    `${commit.id} ${message}`
  )

  return commit
}

export function findCommit(
  repo: Repo,
  id: string
) {
  return repo.commits.find(
    commit => commit.id === id
  )
}

export function resetHead(repo: Repo) {
  const current = getHead(repo)
  const commit = current
    ? findCommit(repo, current)
    : undefined

  if (!commit?.parents[0]) {
    return null
  }

  const previous = commit.parents[0]

  if (repo.head.type === "branch") {
    repo.branches[repo.head.name] = previous
  } else {
    repo.head.name = previous
  }

  addReflog(
    repo,
    `${previous} reset HEAD~1`
  )

  return previous
}

export function revertCommit(
  repo: Repo,
  id: string
) {
  const target = findCommit(repo, id)
  const parent = getHead(repo)

  if (!target || !parent) {
    return null
  }

  const commit = {
    id: Math.random().toString(16).slice(2, 9),
    message: `Revert "${target.message}"`,
    branch:
      repo.head.type === "branch"
        ? repo.head.name
        : "HEAD",
    parents: [parent],
    files: [...target.files]
  }

  repo.commits.push(commit)

  if (repo.head.type === "branch") {
    repo.branches[repo.head.name] = commit.id
  } else {
    repo.head.name = commit.id
  }

  addReflog(
    repo,
    `${commit.id} ${commit.message}`
  )

  return commit
}

export function getLog(repo: Repo) {
  const result: string[] = []
  let current = getHead(repo)

  while (current) {
    const commit = findCommit(repo, current)

    if (!commit) break

    result.push(
      `commit ${commit.id}\n${commit.message}`
    )

    current = commit.parents[0]
  }

  return result.length
    ? result.join("\n\n")
    : "No commits yet."
}