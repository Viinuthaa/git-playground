import { useState } from "react";
import "./App.css";

function App() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);

  function handleCommand(event) {
    event.preventDefault();

    const value = command.trim();

    if (!value) return;

    setHistory((current) => [
      ...current,
      { input: value, output: "" }
    ]);

    setCommand("");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Git Playground</h1>
          <p>See what your Git commands actually do.</p>
        </div>

        <div className="status">
          <span></span>
          local repository
        </div>
      </header>

      <main className="workspace">
        <section className="graph-panel">
          <div className="panel-heading">
            <div>
              <span className="label">REPOSITORY</span>
              <h2>main</h2>
            </div>

            <div className="head">HEAD</div>
          </div>

          <div className="empty-graph">
            <div className="empty-dot"></div>
            <p>No commits yet</p>
            <small>Run git init to get started.</small>
          </div>
        </section>

        <section className="terminal-panel">
          <div className="terminal-heading">
            <span className="label">TERMINAL</span>
            <span>bash</span>
          </div>

          <div className="terminal">
            <div className="terminal-output">
              <div className="welcome">
                <strong>Git Playground</strong>
                <span>Type a Git command to begin.</span>
              </div>

              {history.map((item, index) => (
                <div className="command-block" key={index}>
                  <div>
                    <span className="prompt">$</span>
                    {item.input}
                  </div>

                  {item.output && (
                    <div className="command-output">
                      {item.output}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommand} className="command-form">
              <span className="prompt">$</span>

              <input
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="try a git command..."
                spellCheck="false"
                autoComplete="off"
              />
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;