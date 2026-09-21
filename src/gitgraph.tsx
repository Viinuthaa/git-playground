import type { Repo } from "./git"

type Props = {
  repo: Repo
}

function GitGraph({ repo }: Props) {
  const branches = Object.keys(repo.branches)

  const branchIndex = (branch: string) => {
    const index = branches.indexOf(branch)
    return index === -1 ? 0 : index
  }

  const x = (index: number) => 100 + index * 120
  const y = (branch: string) =>
    100 + branchIndex(branch) * 120

  const head = repo.branches[repo.currentBranch]

  const headIndex = repo.commits.findIndex(
    commit => commit.id === head
  )

  const headCommit =
    headIndex >= 0
      ? repo.commits[headIndex]
      : null

  return (
    <svg
      className="git-graph"
      viewBox="0 0 900 500"
      role="img"
      aria-label="Git commit graph"
    >
      {branches.map((branch, index) => (
        <text
          key={branch}
          x="20"
          y={104 + index * 120}
          className="branch-label"
        >
          {branch}
        </text>
      ))}

      {repo.commits.map((commit, index) => (
        <g key={commit.id}>
          {commit.parents.map(parentId => {
            const parentIndex =
              repo.commits.findIndex(
                item => item.id === parentId
              )

            if (parentIndex < 0) return null

            const parent = repo.commits[parentIndex]

            return (
              <line
                key={`${commit.id}-${parentId}`}
                x1={x(parentIndex)}
                y1={y(parent.branch)}
                x2={x(index)}
                y2={y(commit.branch)}
                className="commit-line"
              />
            )
          })}

          <circle
            cx={x(index)}
            cy={y(commit.branch)}
            r="12"
            className="commit-node"
          />

          <text
            x={x(index)}
            y={y(commit.branch) - 22}
            className="commit-label"
          >
            {commit.message}
          </text>
        </g>
      ))}

      {headCommit && (
        <text
          x={x(headIndex)}
          y={y(headCommit.branch) + 35}
          className="head-label"
        >
          HEAD → {repo.currentBranch}
        </text>
      )}
    </svg>
  )
}

export default GitGraph