export type Challenge = {
  title: string
  description: string
  commands: string[]
  hints: string[]
}

export const challenges: Challenge[] = [
  {
    title: "Create a feature branch",
    description:
      "Create a repository, make your first commit, and create a feature branch.",
    commands: [
      "git init",
      "git add .",
      'git commit -m "first commit"',
      "git checkout -b feature"
    ],
    hints: [
      "Start by creating a Git repository.",
      "Stage all the files with git add .",
      "Create your first commit.",
      "Use git checkout -b to create and switch to a branch."
    ]
  },
  {
    title: "Modify and commit a file",
    description:
      "Change a file, stage the change, and save it in a new commit.",
    commands: [
      "git edit app.js",
      "git add app.js",
      'git commit -m "update app"'
    ],
    hints: [
      "Modify app.js first.",
      "Stage the modified file.",
      "Commit the staged change."
    ]
  },
  {
    title: "Merge a feature",
    description:
      "Switch back to main and merge your feature branch.",
    commands: [
      "git checkout main",
      "git merge feature"
    ],
    hints: [
      "First switch back to the main branch.",
      "Merge the feature branch into main."
    ]
  }
]