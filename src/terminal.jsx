export default function Terminal({
  challenge,
  challengeStep,
  history,
  command,
  setCommand,
  onSubmit
}) {
  return (
    <div className="terminal">
      <div className="terminal-top">
        <span>terminal</span>

        {challenge && (
          <span className="challenge">
            {challenge.title} · {challengeStep + 1}/{challenge.commands.length}
          </span>
        )}
      </div>

      <div className="terminal-output">
        {history.map((item, index) => (
          <div className="history-item" key={index}>
            {item.command && (
              <div className="command-line">
                <span className="prompt">$</span>
                <span>{item.command}</span>
              </div>
            )}

            {item.output && <pre>{item.output}</pre>}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="terminal-input">
        <span className="prompt">$</span>

        <input
          value={command}
          onChange={event => setCommand(event.target.value)}
          placeholder="type a git command..."
          autoFocus
        />
      </form>
    </div>
  )
}