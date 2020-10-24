import Toaster from '/Toaster/Toaster.js'

const toaster = new Toaster({
  width: 30,
  limit: 5,
  life: 5,
  from: "bottom"
})

const emailPattern =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const onEmailInpblur = () => subscribeSect.classList.remove("focused")
emailInp.onfocus = () => subscribeSect.classList.add("focused")
emailInp.onblur = onEmailInpblur

function validateEmail(email2) {
  const email = email2 ? email2 : emailInp.value.toLowerCase()

  if (emailPattern.test(email)) {
    subscribeBtn.classList.add("allowed")
    subscribeSect.classList.add("focused")
    emailInp.onblur = null
    return true
  } else {
    subscribeBtn.classList.remove("allowed")
    emailInp.onblur = onEmailInpblur
    return false
  }
}

emailInp.oninput = emailInp.onchange = () => validateEmail(null)

subscribeBtn.onclick = () => {
  const email = emailInp.value.toLowerCase()
  const validate = validateEmail(email)

  if (validate) {
    fetch(`/api/check-subscriber`, {
      method: "POST",
      body: JSON.stringify({ email })
    }).then(resp => resp.json()).then(data => {
      if (data.isUnoccupied) {
        fetch(`/api/subscribe-user`, {
          method: "POST",
          body: JSON.stringify({ email })
        }).then(() => {
          toaster.log("Вы были успешно подписаны!")
        })
      } else {
        fetch(`/api/send-email-for-unsubscribe`, { method: "POST", body: JSON.stringify({ email }) })
        toaster.log("Такой email уже подписан. На этот email отправлено письмо с кнопкой, для отписки.")
      }
    })
  }
}