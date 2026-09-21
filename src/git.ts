export type Commit = {
  id: string
  message: string
  branch: string
  parents: string[]
}

export type Repo = {
  initialized: boolean
  commits: Commit[]
  branches: Record<string, string | null>
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
    branches: { main: null },
    currentBranch: "main"
  }
}

export function createCommit(
  repo: Repo,
  message: string,
  parents: string[]
): Commit {
  return {
    id: Math.random().toString(16).slice(2, 9),
    message,
    branch: repo.currentBranch,
    parents
  }
}