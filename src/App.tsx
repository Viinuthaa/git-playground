import {
  useState,
  type FormEvent
} from "react"

import "./App.css"

import { challenges } from "./challenges"
import { runCommand } from "./commands"
import {
  createRepo,
  type Repo
} from "./git"

import GitGraph from "./gitgraph"
import Terminal from "./terminal"

type HistoryItem = {
  command: string
  output: string
}

function App() {
  const [repo, setRepo] =
    useState<Repo>(createRepo)

  const [command, setCommand] =
    useState("")

  const [history, setHistory] =
    useState<HistoryItem[]>([])

  const [challengeIndex, setChallengeIndex] =
    useState(0)

  const [challengeStep, setChallengeStep] =
    useState(0)

  const challenge =
    challenges[challengeIndex]

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const value = command.trim()

    if (!value) return

    if (value === "clear") {
      setHistory([])
      setCommand("")
      return
    }

    const result =
      runCommand(repo, value)

    setRepo(result.repo)

    setHistory(previous => [
      ...previous,
      {
        command: value,
        output: result.output
      }
    ])

    if (
      value ===
      challenge.commands[challengeStep]
    ) {
      const complete =
        challengeStep + 1 ===
        challenge.commands.length

      if (complete) {
        setHistory(previous => [
          ...previous,
          {
            command: "",
            output:
              "✓ Challenge complete!"
          }
        ])

        if (
          challengeIndex + 1 <
          challenges.length
        ) {
          setChallengeIndex(
            index => index + 1
          )

          setChallengeStep(0)
        }
      } else {
        setChallengeStep(
          step => step + 1
        )
      }
    }

    setCommand("")
  }

  function resetPlayground() {
    setRepo(createRepo())
    setHistory([])
    setCommand("")
    setChallengeIndex(0)
    setChallengeStep(0)
  }

  const stagedCount =
    repo.files.filter(
      file => file.status === "staged"
    ).length

  const changedCount =
    repo.files.filter(
      file => file.status !== "staged"
    ).length

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Git Playground</h1>

          <p>
            See what your Git commands
            actually do.
          </p>
        </div>

        <div className="status">
          <span
            className={
              repo.initialized
                ? "status-dot active"
                : "status-dot"
            }
          />

          {repo.initialized
            ? "repository active"
            : "no repository"}
        </div>
      </header>

      {repo.initialized && (
        <div className="repo-state">
          <span>
            HEAD → {repo.head.name}
          </span>

          <span>
            {stagedCount} staged
          </span>

          <span>
            {changedCount} changed
          </span>
        </div>
      )}

      <section className="workspace">
        <div className="graph-panel">
          <div className="panel-header">
            <span>
              commit graph
            </span>

            {repo.initialized && (
              <span>
                HEAD → {repo.head.name}
              </span>
            )}
          </div>

          <GitGraph repo={repo} />
        </div>

        <Terminal
          challenge={challenge}
          challengeStep={challengeStep}
          history={history}
          command={command}
          setCommand={setCommand}
          onSubmit={handleSubmit}
        />
      </section>

      <button
        className="reset-button"
        onClick={resetPlayground}
      >
        Reset
      </button>
    </main>
  )
}

export default App