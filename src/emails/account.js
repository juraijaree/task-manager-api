const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'jirachai_u@hotmail.com',
    subject: 'Welcome to the app !',
    text: `Hi, ${name}!`
  })
}

const sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'jirachai_u@hotmail.com',
    subject: 'Cancel !',
    text: `Bye, ${name}!`
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail
}
