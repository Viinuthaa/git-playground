import { useState } from "react"
import type { Commit, Repo } from "./git"

type Props = {
  repo: Repo
}

function GitGraph({ repo }: Props) {
  const [selectedCommit, setSelectedCommit] =
    useState<string | null>(null)

  const branches = Object.keys(repo.branches)

  const laneForCommit = (commit: Commit) => {
    if (commit.branch === "HEAD") {
      return repo.head.type === "branch"
        ? repo.head.name
        : "detached"
    }

    return commit.branch
  }

  const lanes = [
    ...branches,
    ...(repo.head.type === "detached"
      ? ["detached"]
      : [])
  ]

  const laneIndex = (lane: string) => {
    const index = lanes.indexOf(lane)
    return index === -1 ? 0 : index
  }

  const x = (index: number) =>
    100 + index * 120

  const y = (lane: string) =>
    90 + laneIndex(lane) * 90

  const positions = new Map<
    string,
    { x: number; y: number }
  >()

  repo.commits.forEach((commit, index) => {
    const lane = laneForCommit(commit)

    positions.set(commit.id, {
      x: x(index),
      y: y(lane)
    })
  })

  const currentHead =
    repo.head.type === "branch"
      ? repo.branches[repo.head.name]
      : repo.head.name

  const selected = repo.commits.find(
    commit => commit.id === selectedCommit
  )

  return (
    <div className="graph-wrapper">
      <svg
        className="git-graph"
        viewBox="0 0 1000 500"
        role="img"
        aria-label="Git commit graph"
      >
        {lanes.map((lane, index) => (
          <text
            key={lane}
            x="18"
            y={94 + index * 90}
            className={
              lane === "detached"
                ? "branch-label detached-label"
                : "branch-label"
            }
          >
            {lane === "detached"
              ? "detached"
              : lane}
          </text>
        ))}

        {repo.commits.map(commit => {
          const position =
            positions.get(commit.id)

          if (!position) return null

          return (
            <g key={commit.id}>
              {commit.parents.map(parentId => {
                const parentPosition =
                  positions.get(parentId)

                if (!parentPosition) {
                  return null
                }

                return (
                  <line
                    key={`${commit.id}-${parentId}`}
                    x1={position.x}
                    y1={position.y}
                    x2={parentPosition.x}
                    y2={parentPosition.y}
                    className="commit-line"
                  />
                )
              })}
            </g>
          )
        })}

        {repo.commits.map(commit => {
          const position =
            positions.get(commit.id)

          if (!position) return null

          const isHead =
            commit.id === currentHead

          const isSelected =
            commit.id === selectedCommit

          return (
            <g
              key={commit.id}
              className="commit-group"
              onClick={() =>
                setSelectedCommit(commit.id)
              }
              role="button"
              tabIndex={0}
              onKeyDown={event => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  setSelectedCommit(commit.id)
                }
              }}
            >
              <circle
                cx={position.x}
                cy={position.y}
                r={isSelected ? 15 : 12}
                className={
                  isSelected
                    ? "commit-node selected"
                    : "commit-node"
                }
              />

              {isHead && (
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="19"
                  className="head-ring"
                />
              )}

              <text
                x={position.x}
                y={position.y - 23}
                className="commit-label"
              >
                {commit.message}
              </text>

              <text
                x={position.x}
                y={position.y + 30}
                className="commit-id"
              >
                {commit.id}
              </text>

              {isHead && (
                <text
                  x={position.x}
                  y={position.y + 48}
                  className="head-label"
                >
                  HEAD
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {selected && (
        <div className="commit-details">
          <div className="commit-details-header">
            <span>commit</span>

            <button
              onClick={() =>
                setSelectedCommit(null)
              }
            >
              close
            </button>
          </div>

          <div className="commit-details-id">
            {selected.id}
          </div>

          <div className="commit-details-message">
            {selected.message}
          </div>

          <div className="commit-details-row">
            <span>branch</span>
            <span>{selected.branch}</span>
          </div>

          <div className="commit-details-row">
            <span>parents</span>
            <span>
              {selected.parents.length
                ? selected.parents.join(", ")
                : "none"}
            </span>
          </div>

          <div className="commit-details-row">
            <span>files</span>
            <span>
              {selected.files.length
                ? selected.files.join(", ")
                : "none"}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GitGraph