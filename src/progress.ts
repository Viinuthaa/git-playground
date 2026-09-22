export type Progress = {
  completed: number[]
  currentChallenge: number
}

const fallback: Progress = {
  completed: [],
  currentChallenge: 0
}

const API = "http://localhost:3001"

export async function loadProgress(): Promise<Progress> {
  try {
    const response = await fetch(API)

    if (!response.ok) {
      return fallback
    }

    return await response.json()
  } catch {
    return fallback
  }
}

export async function saveProgress(
  progress: Progress
) {
  await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(progress)
  })
}

export async function clearProgress() {
  await fetch(API, {
    method: "DELETE"
  })
}