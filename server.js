const path = require('path')
const http = require('http')
const express = require('express')

const app = express()
const server = http.createServer(app)

app.use(express.static(path.join(__dirname, 'public')))

server.listen(3000, () => console.log('Server running on port 3000'))