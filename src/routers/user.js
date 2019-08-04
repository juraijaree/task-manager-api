const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')

const router = new express.Router()

// POST (sign up)
router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()

    sendWelcomeEmail(user.email, user.name)

    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  }
  catch (e) {
    res.status(400).send(e)
  }
})

// POST (login)
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()

    res.send({ user, token })
  }
  catch (e) {
    res.status(400).send(e)
  }
})

// POST (logout)
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => (
      token.token !== req.token
    ))

    await req.user.save()

    res.send('LOGGED OUT')
  }
  catch (e) {
    res.status(500).send(e)
  }
})

// POST (logout all)
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []

    await req.user.save()

    res.send('LOGGED OUT ALL !')
  }
  catch (e) {
    res.status(500).send(e)
  }
})

// GET (me)
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

// PATCH (me)
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every(update => allowedUpdates.includes(update))

  if (!isValidOperation) return res.status(400).send('Invalid Updates!')

  try {
    updates.forEach(update => req.user[update] = req.body[update])

    await req.user.save()

    res.send(req.user)
  }
  catch (e) {
    res.status(400).send(e)
  }
})


// DELETE (me)
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove()

    sendCancelationEmail(req.user.email, req.user.name)

    res.send(req.user)
  }
  catch (e) {
    res.status(500).send(e)
  }
})

// POST (upload image)
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter (req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error('Must be jpg / jpeg / png'))
    }

    callback(undefined, true)
  }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer)
    .resize({ width: 250, height: 250 })
    .png()
    .toBuffer()

  req.user.avatar = buffer

  await req.user.save()

  res.send('Avatar Uploaded!')
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

// DELETE (avatar)
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined

  await req.user.save()

  res.send('Avatar Deleted!')
})

// GET avatar by user id
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) throw new Error()

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  }
  catch (e) {
    res.status(404).send(e)
  }
})

module.exports = router

// // GET all
// router.get('/users', auth, async (req, res) => {
//   try {
//     const users = await User.find({})
//     res.send(users)
//   }
//   catch (e) {
//     res.status(500).send(e)
//   }
// })

// // GET by id
// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id

//   try {
//     const user = await User.findById(_id)

//     if (!user) return res.status(404).send('Not Found')

//     res.send(user)
//   }
//   catch (e) {
//     res.status(500).send(e)
//   }
// })

// // PATCH
// router.patch('/users/:id', async (req, res) => {
//   const updates = Object.keys(req.body)
//   const allowedUpdates = ['name', 'email', 'password', 'age']
//   const isValidOperation = updates.every(update => allowedUpdates.includes(update))

//   if (!isValidOperation) return res.status(400).send('Invalid Updates!')

//   try {
//     const user = await User.findById(req.params.id)

//     updates.forEach(update => user[update] = req.body[update])

//     await user.save()
//     // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
//     //   new: true,
//     //   runValidators: true
//     // })

//     if (!user) return res.status(404).send('NOT FOUND')

//     res.send(user)
//   }
//   catch (e) {
//     res.status(400).send(e)
//   }
// })

// // DELETE
// router.delete('/users/:id', auth, async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id)

//     if (!user) return res.status(404).send('NOT FOUND')

//     res.send(user)
//   }
//   catch (e) {
//     res.status(500).send(e)
//   }
// })