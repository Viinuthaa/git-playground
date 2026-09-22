import type { Repo } from "./git"

function currentCommit(repo: Repo) {
  return repo.head.type === "detached"
    ? repo.head.name
    : repo.branches[repo.head.name]
}

export function createBranch(
  repo: Repo,
  name: string
) {
  if (repo.branches[name] !== undefined) {
    return false
  }

  repo.branches[name] =
    currentCommit(repo) ?? null

  return true
}

export function deleteBranch(
  repo: Repo,
  name: string
) {
  if (repo.branches[name] === undefined) {
    return false
  }

  if (
    repo.head.type === "branch" &&
    repo.head.name === name
  ) {
    return false
  }

  delete repo.branches[name]
  return true
}

export function checkoutBranch(
  repo: Repo,
  name: string
) {
  if (repo.branches[name] === undefined) {
    return false
  }

  repo.head = {
    type: "branch",
    name
  }

  return true
}