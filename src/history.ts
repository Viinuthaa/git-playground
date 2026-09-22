import {
  createCommit,
  type Repo
} from "./git"

export function getHead(repo: Repo) {
  return repo.head.type === "detached"
    ? repo.head.name
    : repo.branches[repo.head.name]
}

export function findCommit(
  repo: Repo,
  id: string
) {
  return repo.commits.find(
    commit => commit.id === id
  )
}

export function record(
  repo: Repo,
  message: string
) {
  repo.reflog.unshift(message)
}

export function commit(
  repo: Repo,
  message: string,
  parents?: string[]
) {
  const parent = getHead(repo)

  const newCommit = createCommit(
    repo,
    message,
    parents ?? (parent ? [parent] : [])
  )

  repo.commits.push(newCommit)

  if (repo.head.type === "branch") {
    repo.branches[repo.head.name] = newCommit.id
  } else {
    repo.head.name = newCommit.id
  }

  record(
    repo,
    `${newCommit.id} ${message}`
  )

  return newCommit
}

export function reset(repo: Repo) {
  const current = getHead(repo)

  if (!current) return null

  const currentCommit = findCommit(
    repo,
    current
  )

  if (!currentCommit?.parents[0]) {
    return null
  }

  const previous = currentCommit.parents[0]

  if (repo.head.type === "branch") {
    repo.branches[repo.head.name] = previous
  } else {
    repo.head.name = previous
  }

  record(
    repo,
    `${previous} reset HEAD~1`
  )

  return previous
}

export function revert(
  repo: Repo,
  id: string
) {
  const target = findCommit(repo, id)
  const parent = getHead(repo)

  if (!target || !parent) {
    return null
  }

  return commit(
    repo,
    `Revert "${target.message}"`,
    [parent]
  )
}

export function logHistory(repo: Repo) {
  const result: string[] = []
  let current = getHead(repo)

  while (current) {
    const item = findCommit(repo, current)

    if (!item) break

    result.push(
      `commit ${item.id}\n${item.message}`
    )

    current = item.parents[0]
  }

  return result.length
    ? result.join("\n\n")
    : "No commits yet."
}

export function ancestors(
  repo: Repo,
  id: string
) {
  const result = new Set<string>()
  const stack = [id]

  while (stack.length) {
    const current = stack.pop()

    if (!current || result.has(current)) {
      continue
    }

    result.add(current)

    const commit = findCommit(
      repo,
      current
    )

    commit?.parents.forEach(parent =>
      stack.push(parent)
    )
  }

  return result
}