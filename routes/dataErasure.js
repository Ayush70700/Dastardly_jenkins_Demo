/*
 * Copyright (c) 2014-2021 Bjoern Kimminich.
 * SPDX-License-Identifier: MIT
 */

const express = require('express')
const router = express.Router()
const insecurity = require('../lib/insecurity')
const models = require('../models/index')

router.get('/', async (req, res, next) => {
  const loggedInUser = insecurity.authenticatedUsers.get(req.cookies.token)
  const email = loggedInUser.data.email
  models.SecurityAnswer.findOne({
    include: [{
      model: models.User,
      where: { email }
    }]
  }).then(answer => {
    if (answer) {
      models.SecurityQuestion.findByPk(answer.SecurityQuestionId).then(question => {
        res.render('dataErasure', { Email: email, securityQuestion: question.dataValues.question })
      }).catch(error => {
        next(error)
      })
    } else {
      res.json({})
    }
  }).catch(error => {
    next(error)
  })
})

router.post('/', (req, res, next) => {
  const loggedInUser = insecurity.authenticatedUsers.get(req.cookies.token)
  if (loggedInUser && loggedInUser.data.email === req.body.profile.email) {
    const userData = {
      UserId: loggedInUser.data.id,
      deletionRequested: true
    }
    models.PrivacyRequest.create(userData).catch((err) => {
      next(err)
    })
    const email = req.body.profile
    res.render('dataErasure', email)
  } else {
    next(new Error('Blocked illegal activity by ' + req.connection.remoteAddress))
  }
})

module.exports = router