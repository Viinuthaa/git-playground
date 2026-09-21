export type FileStatus =
  | "untracked"
  | "modified"
  | "staged"

export type WorkingFile = {
  name: string
  content: string
  status: FileStatus
}

export type Commit = {
  id: string
  message: string
  branch: string
  parents: string[]
}

export type Head =
  | {
      type: "branch"
      name: string
    }

export type Repo = {
  initialized: boolean
  files: WorkingFile[]
  staging: string[]
  commits: Commit[]
  branches: Record<string, string | null>
  head: Head
}

export type CommandResult = {
  repo: Repo
  output: string
}

export function createRepo(): Repo {
  return {
    initialized: false,
    files: [],
    staging: [],
    commits: [],
    branches: {
      main: null
    },
    head: {
      type: "branch",
      name: "main"
    }
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
    branch: repo.head.name,
    parents
  }
}