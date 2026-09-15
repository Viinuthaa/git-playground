export default function GitGraph({ repo }) {
  if (repo.commits.length === 0) {
    return (
      <div className="empty-graph">
        Run <code>git init</code> and make a commit to see the graph.
      </div>
    )
  }

  const branches = Object.keys(repo.branches)

  const branchY = {}
  branches.forEach((branch, index) => {
    branchY[branch] = 70 + index * 70
  })

  const positions = {}

  repo.commits.forEach((commit, index) => {
    positions[commit.id] = {
      x: 80 + index * 90,
      y: branchY[commit.branch] || 70
    }
  })

  return (
    <svg
      className="git-graph"
      viewBox={`0 0 ${Math.max(700, repo.commits.length * 90 + 120)} 240`}
    >
      {repo.commits.map(commit =>
        commit.parents.map(parent => {
          const from = positions[parent]
          const to = positions[commit.id]

          if (!from || !to) return null

          return (
            <line
              key={`${parent}-${commit.id}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="graph-line"
            />
          )
        })
      )}

      {repo.commits.map(commit => {
        const position = positions[commit.id]

        return (
          <g key={commit.id}>
            <circle
              cx={position.x}
              cy={position.y}
              r="8"
              className="commit-dot"
            />

            <text
              x={position.x}
              y={position.y - 18}
              className="commit-id"
            >
              {commit.id}
            </text>
          </g>
        )
      })}

      {branches.map(branch => (
        <text
          key={branch}
          x="15"
          y={branchY[branch] + 5}
          className="branch-label"
        >
          {branch}
        </text>
      ))}

      <text
        x="15"
        y={branchY[repo.currentBranch] + 25}
        className="head-label"
      >
        HEAD
      </text>
    </svg>
  )
}