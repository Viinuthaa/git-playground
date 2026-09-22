import type { Repo } from "./git"

export function createFiles(repo: Repo) {
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

export function findFile(
  repo: Repo,
  name: string
) {
  return repo.files.find(file => file.name === name)
}

export function addFile(
  repo: Repo,
  name: string
) {
  const file = findFile(repo, name)

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
  const file = findFile(repo, name)

  if (!file) return false

  file.content += "\n// change"
  file.status = "modified"

  repo.staging = repo.staging.filter(
    item => item !== name
  )

  return true
}

export function cleanStagedFiles(repo: Repo) {
  repo.files.forEach(file => {
    if (repo.staging.includes(file.name)) {
      file.status = "clean"
    }
  })

  repo.staging = []
}