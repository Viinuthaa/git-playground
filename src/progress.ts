const STORAGE_KEY = "git-playground-progress"

export type Progress = {
  completed: number[]
  currentChallenge: number
}

const defaultProgress: Progress = {
  completed: [],
  currentChallenge: 0
}

export function loadProgress(): Progress {
  const saved =
    localStorage.getItem(STORAGE_KEY)

  if (!saved) {
    return defaultProgress
  }

  try {
    return JSON.parse(saved)
  } catch {
    return defaultProgress
  }
}

export function saveProgress(
  progress: Progress
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(progress)
  )
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY)
}