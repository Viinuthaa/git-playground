import { useState } from "react";
import "./App.css";

const challenges = [
  {
    title: "Create a feature branch",
    steps: [
      "git init",
      'git commit -m "first commit"',
      "git checkout -b feature"
    ]
  },
  {
    title: "Merge a feature",
    steps: [
      "git init",
      'git commit -m "first commit"',
      "git checkout -b feature",
      'git commit -m "feature work"',
      "git checkout main",
      "git merge feature"
    ]
  }
];

function App() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeStep, setChallengeStep] = useState(0);

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
    const currentHead = repo.branches[repo.currentBranch];

    const commit = {
      id,
      message,
      parent: currentHead,
      parents: currentHead ? [currentHead] : [],
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
      return "Already up to date.";
    }

    if (source === undefined) {
      return `merge: ${branchName} - branch not found`;
    }

    if (source === target) {
      return "Already up to date.";
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

    return `Merge made by simulated Git.\n[${repo.currentBranch} ${id}] ${commit.message}`;
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

    else if (value === "git status") {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        output = `On branch ${repo.currentBranch}\nworking tree clean`;
      }
    }

    else if (value === "git log") {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else if (!repo.commits.length) {
        output = "No commits yet.";
      } else {
        const currentHead = repo.branches[repo.currentBranch];
        const commits = [];

        let current = repo.commits.find(
          (commit) => commit.id === currentHead
        );

        while (current) {
          commits.push(
            `commit ${current.id}\n    ${current.message}`
          );

          current = repo.commits.find(
            (commit) => commit.id === current.parents[0]
          );
        }

        output = commits.join("\n\n");
      }
    }

    else if (value === "git show") {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const head = repo.branches[repo.currentBranch];

        if (!head) {
          output = "No commits yet.";
        } else {
          const commit = repo.commits.find(
            (item) => item.id === head
          );

          output = `commit ${commit.id}\n\n${commit.message}`;
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
        const branchName = value
          .replace("git checkout -b ", "")
          .trim();

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
        const branchName = value
          .replace("git checkout ", "")
          .trim();

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

    else if (value.startsWith("git commit -m ")) {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const match = value.match(
          /^git commit -m ["'](.+)["']$/
        );

        if (!match) {
          output = 'error: use git commit -m "message"';
        } else {
          const id = createCommit(match[1]);
          output = `[${repo.currentBranch} ${id}] ${match[1]}`;
        }
      }
    }

    else if (value.startsWith("git merge ")) {
      if (!repo.initialized) {
        output = "fatal: not a git repository";
      } else {
        const branchName = value
          .replace("git merge ", "")
          .trim();

        output = mergeBranch(branchName);
      }
    }

    else if (value === "clear") {
      setHistory([]);
      setCommand("");
      return;
    }

    else if (value === "help") {
      output =
        "Available commands:\n" +
        "git init\n" +
        "git status\n" +
        "git commit -m \"message\"\n" +
        "git branch\n" +
        "git checkout <branch>\n" +
        "git checkout -b <branch>\n" +
        "git merge <branch>\n" +
        "git log\n" +
        "git show\n" +
        "clear";
    }

    else {
      output = `git: '${value.replace("git ", "")}' is not available yet`;
    }

    const challenge = challenges[challengeIndex];
    const expectedCommand = challenge.steps[challengeStep];

    let challengeMessage = null;

    if (value === expectedCommand) {
      if (challengeStep === challenge.steps.length - 1) {
        challengeMessage = `✓ Challenge complete: ${challenge.title}`;

        if (challengeIndex < challenges.length - 1) {
          setChallengeIndex((current) => current + 1);
          setChallengeStep(0);
        }
      } else {
        setChallengeStep((current) => current + 1);
      }
    }

    setHistory((current) => [
      ...current,
      {
        input: value,
        output
      },
      ...(challengeMessage
        ? [
            {
              input: "",
              output: challengeMessage
            }
          ]
        : [])
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

  const challenge = challenges[challengeIndex];

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Git Playground</h1>
          <p>See what your Git commands actually do.</p>
        </div>

        <div className="status">
          <span></span>
          {repo.initialized
            ? "repository active"
            : "no repository"}
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

                  return commit.parents.map((parentId, index) => {
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
                          index === 0
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
                <strong>{challenge.title}</strong>

                <span>
                  Step {Math.min(
                    challengeStep + 1,
                    challenge.steps.length
                  )}{" "}
                  of {challenge.steps.length}
                </span>
              </div>

              {history.map((item, index) => (
                <div className="command-block" key={index}>
                  {item.input && (
                    <div>
                      <span className="prompt">$</span>
                      {item.input}
                    </div>
                  )}

                  <div className="command-output">
                    {item.output}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleCommand}
              className="command-form"
            >
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