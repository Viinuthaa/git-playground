import type { Repo } from "./git"

type GitGraphProps = {
  repo: Repo
}

function GitGraph({ repo }: GitGraphProps) {
  const branchNames = Object.keys(repo.branches)

  return (
    <svg
      className="git-graph"
      viewBox="0 0 900 500"
      role="img"
      aria-label="Git commit graph"
    >
      {repo.commits.map((commit, index) => {
        const x = 80 + index * 90
        const branchIndex = branchNames.indexOf(commit.branch)
        const y = 100 + branchIndex * 100

        return (
          <g key={commit.id}>
            {commit.parents.map(parentId => {
              const parentIndex = repo.commits.findIndex(
                parent => parent.id === parentId
              )

              if (parentIndex === -1) return null

              const parent = repo.commits[parentIndex]
              const parentBranchIndex =
                branchNames.indexOf(parent.branch)

              const parentX = 80 + parentIndex * 90
              const parentY = 100 + parentBranchIndex * 100

              return (
                <line
                  key={`${commit.id}-${parentId}`}
                  x1={parentX}
                  y1={parentY}
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
    </svg>
  )
}

export default GitGraph