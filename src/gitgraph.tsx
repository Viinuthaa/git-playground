import type { Repo } from "./git"

type GitGraphProps = {
  repo: Repo
}

function GitGraph({ repo }: GitGraphProps) {
  const branchNames = Object.keys(repo.branches)

  function getBranchIndex(branch: string): number {
    const index = branchNames.indexOf(branch)

    return index === -1 ? 0 : index
  }

  function getX(index: number): number {
    return 100 + index * 120
  }

  function getY(branch: string): number {
    return 100 + getBranchIndex(branch) * 120
  }

  const headCommitId =
    repo.branches[repo.currentBranch]

  const headCommitIndex = repo.commits.findIndex(
    commit => commit.id === headCommitId
  )

  const headCommit =
    headCommitIndex >= 0
      ? repo.commits[headCommitIndex]
      : null

  return (
    <svg
      className="git-graph"
      viewBox="0 0 900 500"
      role="img"
      aria-label="Git commit graph"
    >
      {branchNames.map((branch, index) => (
        <text
          key={branch}
          x="20"
          y={104 + index * 120}
          className="branch-label"
        >
          {branch}
        </text>
      ))}

      {repo.commits.map((commit, index) => {
        const x = getX(index)
        const y = getY(commit.branch)

        return (
          <g key={commit.id}>
            {commit.parents.map(parentId => {
              const parentIndex =
                repo.commits.findIndex(
                  parent => parent.id === parentId
                )

              if (parentIndex === -1) {
                return null
              }

              const parent =
                repo.commits[parentIndex]

              return (
                <line
                  key={`${commit.id}-${parentId}`}
                  x1={getX(parentIndex)}
                  y1={getY(parent.branch)}
                  x2={x}
                  y2={y}
                  className="commit-line"
                />
              )
            })}

            <circle
              cx={x}
              cy={y}
              r="12"
              className="commit-node"
            />

            <text
              x={x}
              y={y - 22}
              className="commit-label"
            >
              {commit.message}
            </text>
          </g>
        )
      })}

      {headCommit && (
        <text
          x={getX(headCommitIndex)}
          y={getY(headCommit.branch) + 35}
          className="head-label"
        >
          HEAD → {repo.currentBranch}
        </text>
      )}
    </svg>
  )
}

export default GitGraph