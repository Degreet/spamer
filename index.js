require('c4console')
const { MongoClient, ObjectId } = require("mongodb")
const gmailMsg = require("gmail-send")
const { createServer, get } = require('http')
const fs = require('fs'), fsp = fs.promises
const bcrypt = require('bcrypt')
const Cookies = require('cookies')
const dotenv = require('dotenv')
dotenv.config()

const dbName = "spamer-test"
const appName = "Spamer"
const linkToHeroku = `http://localhost:3000`

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

    if (url == "check-subscriber") {
      const { email } = JSON.parse(await streamToString(req))
      const candidate = await getCandidate(email)
      const data = { isUnoccupied: candidate ? false : true }
      resp.end(JSON.stringify(data))
    } else if (url == "subscribe-user") {
      const { email } = JSON.parse(await streamToString(req))
      const date = getDate()
      const token = generateToken()
      const sub = { email, date, token }

      sendMsgToEmail(email, "Добро пожаловать в Spamer!", /*html*/`
        <h1>Добро пожаловать в Spamer!</h1>
        <span>Вы подписались на рассылку. Чтобы отписаться, перейдите по ссылке: ${linkToHeroku}/unsubscribe/${token}.</span>
      `)

      await subs.insertOne(sub)
      resp.end()
    } else if (url == "send-email-for-unsubscribe") {
      const { email } = JSON.parse(await streamToString(req))
      const candidate = await getCandidate(email)

      if (candidate) {
        sendMsgToEmail(email, "Отписаться от рассылки (Spamer)", /*html*/`
        <h1>Отписаться от рассылки (Spamer)</h1>
        <span>Чтобы отписаться от рассылки, перейдите по ссылке: ${linkToHeroku}/unsubscribe/${candidate.token}.</span>
      `)
      }

      resp.end()
    } else if (url == "send-msg") {
      const { msg } = JSON.parse(await streamToString(req))
      const subscribedUsers = await subs.find().toArray()

      subscribedUsers.forEach(sub => {
        sendMsgToEmail(sub.email, `SPAMER - Рассылка`, msg)
      })

      resp.end()
    }
  } else if (url.startsWith("/unsubscribe/")) {
    const token = url.replace("/unsubscribe/", "").replace("/", "")
    const candidate = await getCandidateByToken(token)

    if (candidate) {
      await subs.deleteOne({ _id: candidate._id })
      resp.end(await getPage(`${appName} - Отписка`, buildPath("success-unsubscribe.html")))
    } else {
      resp.end(await error404())
    }
  } else if (url == "/admin") {
    resp.end(await getPage(`${appName} - Админ панель`, buildPath("admin.html"), "admin"))
  } else {
    let path = process.cwd() + '/public' + url.replace(/\/$/, '')

    try {
      const target = await fsp.stat(path).catch(_ => fsp.stat(path += '.html'))
      if (target.isDirectory()) path += '/index.html'
      const match = path.match(/\.(\w+)$/), ext = match ? match[1] : 'html'

      if (path.endsWith("/public/index.html")) {
        resp.end(await getPage(`${appName} - Главная`, buildPath("index.html"), "main"))
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
      resp.end(await error404())
    }
  }
}

async function error404() {
  return await getPage(`${appName} - Ошибка №404`, buildPath("errors/404.html"))
}

async function getPage(title, path, script) {
  const [file, body] = await Promise.all([fsp.readFile(path),
  fsp.readFile(buildPath("templates/main.html"))])
  const html = body.toString()
    .replace("PAGE_TITLE", title)
    .replace("PAGE_BODY", file.toString())
    .replace("PAGE_SCRIPT", script ? /*html*/`
      <script src="/js/${script}.js"${script == "main" || script == "admin" ? ' type="module"' : ""}></script>` : "")
  return html
}

function buildPath(path) {
  return `${__dirname}/public/${path}`
}

function getDate() {
  return new Date().toISOString().slice(0, 19).replace("T", " ")
}

async function getCandidate(email) {
  return await subs.findOne({ email })
}

async function getCandidateByToken(token) {
  return await subs.findOne({ token })
}

function sendMsgToEmail(email, subject, html) {
  gmailMsg({
    user: 'aspamer2@gmail.com',
    pass: process.env.GMAIL_PASS,
    to: `<${email}>`,
    subject,
    html
  })()
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

  global.subs = client.db(dbName).collection("subs")

  server.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`))
  setTimeout(() => client.close(), 1e9)
})