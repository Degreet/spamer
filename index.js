require('c4console')
const { MongoClient, ObjectId } = require("mongodb")
const { createServer } = require('http')
const fs = require('fs'), fsp = fs.promises
const bcrypt = require('bcrypt')
const Cookies = require('cookies')
const dotenv = require('dotenv')
dotenv.config()

const dbName = "spamer-test"
const appName = "Spamer"

const PORT = process.env.PORT || 3000
const pass = process.env.KEY
const server = createServer(requestHandler)
const uri = `mongodb+srv://Node:${pass}@cluster0-ttfss.mongodb.net/${dbName}?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

async function requestHandler(req, resp) {
  let { url } = req
  const cookies = new Cookies(req, resp)
  resp.setHeader('Content-Type', 'text/html')

  if (url.startsWith('/api/')) {
    url = url.slice(5)
  } else {
    let path = process.cwd() + '/public' + url.replace(/\/$/, '')

    try {
      const target = await fsp.stat(path).catch(_ => fsp.stat(path += '.html'))
      if (target.isDirectory()) path += '/index.html'
      const match = path.match(/\.(\w+)$/), ext = match ? match[1] : 'html'

      if (path.endsWith("/public/index.html")) {
        resp.end(await getPage(`${appName} - Главная`, buildPath("index.html")))
      } else {
        fs.createReadStream(path).pipe(resp)
        resp.setHeader('Content-Type', {
          html: 'text/html',
          json: 'application/json',
          css: 'text/css',
          ico: 'image/x-icon',
          jpg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          svg: 'image/svg+xml',
          js: 'application/javascript',
        }[ext])
      }
    } catch {
      resp.end(await getPage(`${appName} - Ошибка №404`, buildPath("errors/404.html")))
    }
  }
}

async function getPage(title, path, script) {
  const [file, body] = await Promise.all([fsp.readFile(path),
    fsp.readFile(buildPath("templates/main.html"))])
  const html = body.toString()
    .replace("PAGE_TITLE", title)
    .replace("PAGE_BODY", file.toString())
    .replace("PAGE_SCRIPT", script ? /*html*/`<script src="/js/${script}.js"></script>` : "")
  return html
}

function buildPath(path) {
  return `${__dirname}/public/${path}`
}

async function getCandidate(cookies) {
  const token = cookies.get("token")
  return await users.findOne({ token })
}

function streamToString(stream) {
  const chunks = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

function generateToken() {
  let res = ''
  const chars = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890'
  for (let i = 0; i < 32; i++) res += chars[Math.floor(Math.random() * chars.length)]
  return res
}

client.connect(err => {
  if (err) console.log(err)

  global.users = client.db(dbName).collection("users")

  server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`))
  setTimeout(() => client.close(), 1e9)
})