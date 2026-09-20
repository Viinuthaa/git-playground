import { useState } from "react"
import "./App.css"

import { challenges } from "./challenges"
import { createRepo, runCommand } from "./git"

import type { Challenge } from "./challenges"
import type { Repo } from "./git"

import GitGraph from "./gitgraph"
import Terminal from "./terminal"

function App() {
  const [repo, setRepo] = useState<Repo>(createRepo)
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<
    { command: string; output: string }[]
  >([])
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [challengeStep, setChallengeStep] = useState(0)

  const challenge: Challenge = challenges[challengeIndex]

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = command.trim()

    if (!value) return

    if (value === "clear") {
      setHistory([])
      setCommand("")
      return
    }

    const result = runCommand(repo, value)

    setRepo(result.repo)

    setHistory(prev => [
      ...prev,
      {
        command: value,
        output: result.output
      }
    ])

    const expected = challenge.commands[challengeStep]

    if (value === expected) {
      if (challengeStep + 1 === challenge.commands.length) {
        setHistory(prev => [
          ...prev,
          {
            command: "",
            output: "✓ Challenge complete!"
          }
        ])

        if (challengeIndex + 1 < challenges.length) {
          setChallengeIndex(prev => prev + 1)
          setChallengeStep(0)
        }
      } else {
        setChallengeStep(prev => prev + 1)
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

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Git Playground</h1>
          <p>See what your Git commands actually do.</p>
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

      <section className="workspace">
        <div className="graph-panel">
          <div className="panel-header">
            <span>commit graph</span>

            {repo.initialized && (
              <span>HEAD → {repo.currentBranch}</span>
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