# Git Playground

An interactive Git command trainer that turns common Git operations into a visual commit graph.

Type Git commands into the terminal and watch branches, commits, and `HEAD` change.

## What it does

- Initializes a repository
- Creates commits
- Creates and switches branches
- Deletes branches
- Simulates merges
- Simulates `git reset HEAD~1`
- Visualizes commit relationships with SVG
- Shows branch positions and `HEAD`
- Provides command feedback
- Includes guided Git challenges
- Supports commands such as:
  - `git init`
  - `git status`
  - `git branch`
  - `git branch <name>`
  - `git branch -d <name>`
  - `git checkout <branch>`
  - `git checkout -b <name>`
  - `git commit -m "message"`
  - `git log`
  - `git show`
  - `git merge <branch>`
  - `git reset HEAD~1`

## Built with

- React
- TypeScript
- CSS
- SVG
- Vite

## Why I built this

Git is easy to use once you know the commands, but understanding what is actually happening to branches, commits, and `HEAD` can be confusing.

Git Playground is my attempt to make those relationships easier to see and experiment with.

## What's next

Future versions can explore:

- More Git commands
- More realistic Git behavior
- Better graph interactions
- More challenges
- Persistent learning progress
- Backend support