const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
let db = null
const bcrypt = require('bcrypt')

const initializing = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server: http://localhost:3000')
    })
  } catch (err) {
    console.log(`server Err: ${err}`)
  }
}

initializing()

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body

  let hashedPassword = await bcrypt.hash(password, 10)

  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`

  let userData = await db.get(checkTheUsername)

  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username, name, password, gender, location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`

    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      await db.run(postNewUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (req, res) => {
  const {username, password} = req.body

  const getQuery = `
    SELECT * FROM user WHERE username = '${username}';
  `

  const user = await db.get(getQuery)

  if (!user) {
    res.status(400).send('Invalid user')
  } else {
    const hashedPassword2 = await bcrypt.compare(password, user.password)

    if (!hashedPassword2) {
      res.status(400).send('Invalid password')
    } else {
      res.status(200).send('Login success!')
    }
  }
})

app.put('/change-password', async (req, res) => {
  const {username, oldPassword, newPassword} = req.body

  const getUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
  `

  const user = await db.get(getUserQuery)

  if (!user) {
    res.status(400).send('User not found')
  } else {
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password)

    if (!isPasswordCorrect) {
      res.status(400).send('Invalid current password')
    } else if (newPassword.length < 5) {
      res.status(400).send('Password is too short')
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      const updatePasswordQuery = `
        UPDATE user
        SET password = '${hashedNewPassword}'
        WHERE username = '${username}';
      `

      await db.run(updatePasswordQuery)

      res.status(200).send('Password updated')
    }
  }
})

module.exports = app
