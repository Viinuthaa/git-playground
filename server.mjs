import {
  createServer
} from "node:http"

import {
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises"

const PORT = 3001
const DATA_DIR = "./data"
const DATA_FILE = "./data/progress.json"

const fallback = {
  completed: [],
  currentChallenge: 0
}

async function readProgress() {
  try {
    return JSON.parse(
      await readFile(DATA_FILE, "utf8")
    )
  } catch {
    return fallback
  }
}

const server = createServer(
  async (req, res) => {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    )

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type"
    )

    if (req.method === "OPTIONS") {
      res.writeHead(204)
      res.end()
      return
    }

    if (
      req.method === "GET" &&
      req.url === "/"
    ) {
      const progress =
        await readProgress()

      res.writeHead(200, {
        "Content-Type":
          "application/json"
      })

      res.end(JSON.stringify(progress))
      return
    }

    if (
      req.method === "POST" &&
      req.url === "/"
    ) {
      let body = ""

      req.on("data", chunk => {
        body += chunk
      })

      req.on("end", async () => {
        await mkdir(DATA_DIR, {
          recursive: true
        })

        await writeFile(
          DATA_FILE,
          JSON.stringify(
            JSON.parse(body),
            null,
            2
          )
        )

        res.writeHead(200)
        res.end("saved")
      })

      return
    }

    if (
      req.method === "DELETE" &&
      req.url === "/"
    ) {
      await mkdir(DATA_DIR, {
        recursive: true
      })

      await writeFile(
        DATA_FILE,
        JSON.stringify(
          fallback,
          null,
          2
        )
      )

      res.writeHead(200)
      res.end("reset")
      return
    }

    res.writeHead(404)
    res.end("Not found")
  }
)

server.listen(PORT, () => {
  console.log(
    `Git Playground server running on http://localhost:${PORT}`
  )
})