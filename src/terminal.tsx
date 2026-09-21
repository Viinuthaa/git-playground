import type { FormEvent } from "react"
import type { Challenge } from "./challenges"

type HistoryItem = {
  command: string
  output: string
}

type TerminalProps = {
  challenge: Challenge
  challengeStep: number
  history: HistoryItem[]
  command: string
  setCommand: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function Terminal({
  challenge,
  challengeStep,
  history,
  command,
  setCommand,
  onSubmit
}: TerminalProps) {
  return (
    <div className="terminal-panel">
      <div className="panel-header">
        <span>terminal</span>
      </div>

      <div className="challenge">
        <strong>{challenge.title}</strong>

        <p>
          Step {challengeStep + 1} of{" "}
          {challenge.commands.length}
        </p>
      </div>

      <div className="terminal-output">
        {history.map((item, index) => (
          <div key={index} className="terminal-entry">
            {item.command && (
              <div className="terminal-command">
                $ {item.command}
              </div>
            )}

            <pre>{item.output}</pre>
          </div>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="terminal-form"
      >
        <span>$</span>

        <input
          value={command}
          onChange={event =>
            setCommand(event.target.value)
          }
          placeholder="type a git command..."
          aria-label="Git command"
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}

export default Terminal