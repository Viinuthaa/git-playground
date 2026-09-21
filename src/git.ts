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

export function makeId(): string {
  return Math.random()
    .toString(16)
    .slice(2, 9)
}

export function createCommit(
  repo: Repo,
  message: string,
  parents: string[]
): Commit {
  return {
    id: makeId(),
    message,
    branch: repo.currentBranch,
    parents
  }
}