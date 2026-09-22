import { createServer } from "node:http"
import { readFile, writeFile } from "node:fs/promises"

const PORT = 3001
const FILE = "progress.json"

type Progress = {
  completed: number[]
  currentChallenge: number
}

const defaultProgress: Progress = {
  completed: [],
  currentChallenge: 0
}

async function load(): Promise<Progress> {
  try {
    return JSON.parse(
      await readFile(FILE, "utf8")
    )
  } catch {
    return defaultProgress
  }
}

const server = createServer(
  async (request, response) => {
    response.setHeader(
      "Content-Type",
      "application/json"
    )
    response.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    )

    if (request.method === "GET") {
      response.end(
        JSON.stringify(await load())
      )
      return
    }

    if (request.method === "POST") {
      let body = ""

      request.on("data", chunk => {
        body += chunk
      })

      request.on("end", async () => {
        await writeFile(
          FILE,
          body || JSON.stringify(defaultProgress)
        )

        response.end(
          JSON.stringify({ saved: true })
        )
      })

      return
    }

    response.statusCode = 404
    response.end(
      JSON.stringify({ error: "Not found" })
    )
  }
)

server.listen(PORT, () => {
  console.log(
    `Git Playground API running on ${PORT}`
  )
})