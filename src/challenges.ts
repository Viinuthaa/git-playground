export type Challenge = {
  title: string
  commands: string[]
}

export const challenges: Challenge[] = [
  {
    title: "Create a feature branch",
    commands: [
      "git init",
      'git commit -m "first commit"',
      "git checkout -b feature"
    ]
  },
  {
    title: "Merge a feature",
    commands: [
      'git commit -m "feature work"',
      "git checkout main",
      "git merge feature"
    ]
  }
]