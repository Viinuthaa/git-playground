import type { Repo } from "./git"

export function initFiles(repo: Repo) {
  repo.files = [
    {
      name: "index.html",
      content: "<html></html>",
      status: "untracked"
    },
    {
      name: "app.js",
      content: "console.log('hello')",
      status: "untracked"
    },
    {
      name: "README.md",
      content: "# Git Playground",
      status: "untracked"
    }
  ]
}

export function getFile(
  repo: Repo,
  name: string
) {
  return repo.files.find(file => file.name === name)
}

export function addFile(
  repo: Repo,
  name: string
) {
  const file = getFile(repo, name)

  if (!file) return false

  file.status = "staged"

  if (!repo.staging.includes(name)) {
    repo.staging.push(name)
  }

  return true
}

export function addAll(repo: Repo) {
  repo.files.forEach(file => {
    if (
      file.status === "untracked" ||
      file.status === "modified"
    ) {
      addFile(repo, file.name)
    }
  })
}

export function editFile(
  repo: Repo,
  name: string
) {
  const file = getFile(repo, name)

  if (!file) return false

  file.content += "\n// change"
  file.status = "modified"

  repo.staging = repo.staging.filter(
    item => item !== name
  )

  return true
}

export function cleanFiles(repo: Repo) {
  repo.files.forEach(file => {
    if (repo.staging.includes(file.name)) {
      file.status = "clean"
    }
  })

  repo.staging = []
}

export function resolveFile(
  repo: Repo,
  name: string
) {
  if (!repo.conflicts.includes(name)) {
    return false
  }

  repo.conflicts = repo.conflicts.filter(
    item => item !== name
  )

  addFile(repo, name)

  return true
}