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
import {
  clearProgress,
  loadProgress,
  saveProgress
} from "./progress"

import GitGraph from "./gitgraph"
import Terminal from "./terminal"

type HistoryItem = {
  command: string
  output: string
}

function App() {
  const savedProgress = loadProgress()

  const [repo, setRepo] =
    useState<Repo>(createRepo)

  const [command, setCommand] =
    useState("")

  const [history, setHistory] =
    useState<HistoryItem[]>([])

  const [challengeIndex, setChallengeIndex] =
    useState(
      savedProgress.currentChallenge
    )

  const [challengeStep, setChallengeStep] =
    useState(0)

  const [completed, setCompleted] =
    useState<number[]>(
      savedProgress.completed
    )

  const [showHint, setShowHint] =
    useState(false)

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
        const nextCompleted =
          completed.includes(challengeIndex)
            ? completed
            : [
                ...completed,
                challengeIndex
              ]

        setCompleted(nextCompleted)

        const nextChallenge =
          challengeIndex + 1

        setHistory(previous => [
          ...previous,
          {
            command: "",
            output:
              "✓ Challenge complete!"
          }
        ])

        if (
          nextChallenge <
          challenges.length
        ) {
          setChallengeIndex(
            nextChallenge
          )

          setChallengeStep(0)

          saveProgress({
            completed: nextCompleted,
            currentChallenge:
              nextChallenge
          })
        } else {
          saveProgress({
            completed: nextCompleted,
            currentChallenge:
              challengeIndex
          })
        }

        setShowHint(false)
      } else {
        setChallengeStep(
          step => step + 1
        )

        setShowHint(false)
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
    setCompleted([])
    setShowHint(false)

    clearProgress()
  }

  const stagedCount =
    repo.files.filter(
      file => file.status === "staged"
    ).length

  const changedCount =
    repo.files.filter(
      file => file.status !== "staged"
    ).length

  const progressPercent =
    Math.round(
      (completed.length /
        challenges.length) *
        100
    )

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

      <div className="learning-bar">
        <div className="learning-info">
          <span>
            Learning progress
          </span>

          <span>
            {completed.length}/
            {challenges.length} completed
          </span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${progressPercent}%`
            }}
          />
        </div>
      </div>

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

        <div className="learning-side">
          <Terminal
            challenge={challenge}
            challengeStep={challengeStep}
            history={history}
            command={command}
            setCommand={setCommand}
            onSubmit={handleSubmit}
          />

          <div className="learning-panel">
            <span className="learning-label">
              CHALLENGE
            </span>

            <h2>{challenge.title}</h2>

            <p>
              {challenge.description}
            </p>

            <div className="step-info">
              Step {challengeStep + 1} of{" "}
              {challenge.commands.length}
            </div>

            <div className="hint-box">
              <button
                className="hint-button"
                onClick={() =>
                  setShowHint(
                    value => !value
                  )
                }
              >
                {showHint
                  ? "Hide hint"
                  : "Show hint"}
              </button>

              {showHint && (
                <p>
                  {
                    challenge.hints[
                      challengeStep
                    ]
                  }
                </p>
              )}
            </div>

            <div className="completed-list">
              {challenges.map(
                (item, index) => (
                  <div
                    key={item.title}
                    className={
                      completed.includes(index)
                        ? "completed-item done"
                        : "completed-item"
                    }
                  >
                    <span>
                      {completed.includes(index)
                        ? "✓"
                        : "○"}
                    </span>

                    {item.title}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="bottom-actions">
        <button
          className="reset-button"
          onClick={resetPlayground}
        >
          Reset
        </button>

        <span>
          Progress is saved in this browser.
        </span>
      </div>
    </main>
  )
}

export default App