export type Challenge = {
  title: string
  commands: string[]
}

export const challenges: Challenge[] = [
  {
    title: "Create a feature branch",
    commands: [
      "git init",
      "git add .",
      'git commit -m "first commit"',
      "git checkout -b feature"
    ]
  },
  {
    title: "Modify and commit a file",
    commands: [
      "git edit app.js",
      "git add app.js",
      'git commit -m "update app"'
    ]
  },
  {
    title: "Merge a feature",
    commands: [
      "git checkout main",
      "git merge feature"
    ]
  }
]