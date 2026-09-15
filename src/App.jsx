import { useState } from "react";
import "./App.css";

function App() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);

  const [repo, setRepo] = useState({
    initialized: false,
    commits: [],
    currentBranch: "main",
    head: null
  });

  function createCommit(message) {
    const id = Math.random().toString(16).slice(2, 8);

    const commit = {
      id,
      message,
      parent: repo.head
    };

    setRepo((current) => ({
      ...current,
      commits: [...current.commits, commit],
      head: id
    }));

    return id;
  }

  function handleCommand(event) {
    event.preventDefault();

    const value = command.trim();

    if (!value) return;

    let output = "";

    if (value === "git init") {
      if (repo.initialized) {
        output = "Reinitialized existing Git repository.";
      } else {
        setRepo((current) => ({
          ...current,
          initialized: true
        }));

        output = "Initialized empty Git repository.";
      }
    } else if (value.startsWith("git commit -m ")) {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const match = value.match(/^git commit -m ["'](.+)["']$/);

        if (!match) {
          output = 'error: use git commit -m "message"';
        } else {
          const message = match[1];
          const id = createCommit(message);

          output = `[${repo.currentBranch} ${id}] ${message}`;
        }
      }
    } else {
      output = `git: '${value.replace("git ", "")}' is not available yet`;
    }

    setHistory((current) => [
      ...current,
      {
        input: value,
        output
      }
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
          {repo.initialized ? "repository active" : "no repository"}
        </div>
      </header>

      <main className="workspace">
        <section className="graph-panel">
          <div className="panel-heading">
            <div>
              <span className="label">REPOSITORY</span>
              <h2>{repo.currentBranch}</h2>
            </div>

            <div className="head">
              HEAD {repo.head ? repo.head : "—"}
            </div>
          </div>

          <div className="empty-graph">
            {repo.commits.length === 0 ? (
              <>
                <div className="empty-dot"></div>

                <p>
                  {repo.initialized
                    ? "No commits yet"
                    : "No repository"}
                </p>

                <small>
                  {repo.initialized
                    ? 'Run git commit -m "message".'
                    : "Run git init to get started."}
                </small>
              </>
            ) : (
              <div className="commit-list">
                {repo.commits.map((commit) => (
                  <div className="commit" key={commit.id}>
                    <div className="commit-dot"></div>

                    <div>
                      <strong>{commit.message}</strong>
                      <small>{commit.id}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

                  <div className="command-output">
                    {item.output}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCommand} className="command-form">
              <span className="prompt">$</span>

              <input
                value={command}
                onChange={(event) =>
                  setCommand(event.target.value)
                }
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