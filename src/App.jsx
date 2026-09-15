import { useState } from "react";
import "./App.css";

function App() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);

  const [repo, setRepo] = useState({
    initialized: false,
    commits: [],
    branches: {
      main: null
    },
    currentBranch: "main"
  });

  function createCommit(message) {
    const id = Math.random().toString(16).slice(2, 8);

    const commit = {
      id,
      message,
      parent: repo.branches[repo.currentBranch],
      parents: repo.branches[repo.currentBranch]
        ? [repo.branches[repo.currentBranch]]
        : [],
      branch: repo.currentBranch
    };

    setRepo((current) => ({
      ...current,
      commits: [...current.commits, commit],
      branches: {
        ...current.branches,
        [current.currentBranch]: id
      }
    }));

    return id;
  }

  function mergeBranch(branchName) {
    const target = repo.branches[repo.currentBranch];
    const source = repo.branches[branchName];

    if (branchName === repo.currentBranch) {
      return {
        output: "Already up to date."
      };
    }

    if (source === undefined) {
      return {
        output: `merge: ${branchName} - branch not found`
      };
    }

    if (source === target) {
      return {
        output: "Already up to date."
      };
    }

    const id = Math.random().toString(16).slice(2, 8);

    const commit = {
      id,
      message: `Merge branch '${branchName}'`,
      parent: target,
      parents: [target, source],
      branch: repo.currentBranch
    };

    setRepo((current) => ({
      ...current,
      commits: [...current.commits, commit],
      branches: {
        ...current.branches,
        [current.currentBranch]: id
      }
    }));

    return {
      output: `Merge made by simulated Git.\n[${repo.currentBranch} ${id}] ${commit.message}`
    };
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
    }

    else if (value.startsWith("git commit -m ")) {
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
    }

    else if (value === "git branch") {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        output = Object.keys(repo.branches)
          .map((branch) =>
            branch === repo.currentBranch
              ? `* ${branch}`
              : `  ${branch}`
          )
          .join("\n");
      }
    }

    else if (value.startsWith("git branch ")) {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const branchName = value.replace("git branch ", "").trim();

        if (!branchName) {
          output = "error: branch name required";
        } else if (repo.branches[branchName] !== undefined) {
          output = `fatal: branch '${branchName}' already exists`;
        } else {
          setRepo((current) => ({
            ...current,
            branches: {
              ...current.branches,
              [branchName]: current.branches[current.currentBranch]
            }
          }));

          output = `Created branch '${branchName}'.`;
        }
      }
    }

    else if (value.startsWith("git checkout -b ")) {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const branchName = value.replace("git checkout -b ", "").trim();

        if (!branchName) {
          output = "error: branch name required";
        } else if (repo.branches[branchName] !== undefined) {
          output = `fatal: branch '${branchName}' already exists`;
        } else {
          setRepo((current) => ({
            ...current,
            currentBranch: branchName,
            branches: {
              ...current.branches,
              [branchName]: current.branches[current.currentBranch]
            }
          }));

          output = `Switched to a new branch '${branchName}'`;
        }
      }
    }

    else if (value.startsWith("git checkout ")) {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const branchName = value.replace("git checkout ", "").trim();

        if (repo.branches[branchName] === undefined) {
          output = `error: pathspec '${branchName}' did not match any branch`;
        } else if (branchName === repo.currentBranch) {
          output = `Already on '${branchName}'`;
        } else {
          setRepo((current) => ({
            ...current,
            currentBranch: branchName
          }));

          output = `Switched to branch '${branchName}'`;
        }
      }
    }

    else if (value.startsWith("git merge ")) {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const branchName = value.replace("git merge ", "").trim();
        const result = mergeBranch(branchName);
        output = result.output;
      }
    }

    else {
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

  const branchNames = Object.keys(repo.branches);

  const branchRows = branchNames.reduce((rows, branch, index) => {
    rows[branch] = 90 + index * 90;
    return rows;
  }, {});

  const commitPositions = {};

  repo.commits.forEach((commit, index) => {
    commitPositions[commit.id] = {
      x: 90 + index * 120,
      y: branchRows[commit.branch] || 90
    };
  });

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
              HEAD {repo.branches[repo.currentBranch] || "—"}
            </div>
          </div>

          <div className="graph">
            {repo.commits.length === 0 ? (
              <div className="empty-graph">
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
              </div>
            ) : (
              <svg
                className="commit-graph"
                viewBox={`0 0 ${Math.max(
                  700,
                  repo.commits.length * 120 + 150
                )} 300`}
                preserveAspectRatio="xMinYMid meet"
              >
                {repo.commits.map((commit) => {
                  const current = commitPositions[commit.id];

                  return commit.parents.map((parentId, parentIndex) => {
                    const parent = commitPositions[parentId];

                    if (!parent) return null;

                    return (
                      <line
                        key={`${commit.id}-${parentId}`}
                        x1={parent.x}
                        y1={parent.y}
                        x2={current.x}
                        y2={current.y}
                        className={
                          parentIndex === 0
                            ? "graph-line"
                            : "branch-line"
                        }
                      />
                    );
                  });
                })}

                {repo.commits.map((commit) => {
                  const position = commitPositions[commit.id];

                  const isHead =
                    repo.branches[repo.currentBranch] === commit.id;

                  return (
                    <g key={commit.id}>
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r="8"
                        className={
                          isHead
                            ? "commit-node current"
                            : "commit-node"
                        }
                      />

                      <text
                        x={position.x}
                        y={position.y - 18}
                        className="commit-id"
                        textAnchor="middle"
                      >
                        {commit.id}
                      </text>

                      {isHead && (
                        <text
                          x={position.x}
                          y={position.y + 28}
                          className="head-label"
                          textAnchor="middle"
                        >
                          HEAD
                        </text>
                      )}
                    </g>
                  );
                })}

                {branchNames.map((branch) => {
                  const commitId = repo.branches[branch];
                  const position = commitPositions[commitId];

                  if (!position) return null;

                  return (
                    <text
                      key={branch}
                      x={position.x + 16}
                      y={position.y + 4}
                      className={
                        branch === repo.currentBranch
                          ? "branch-label active"
                          : "branch-label"
                      }
                    >
                      {branch}
                    </text>
                  );
                })}
              </svg>
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