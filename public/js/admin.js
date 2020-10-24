import Toaster from '/Toaster/Toaster.js'

const toaster = new Toaster({
  width: 30,
  limit: 5,
  life: 5,
  from: "bottom"
})

sendBtn.onclick = () => {
  const msg = msgTA.value
  msgTA.value = ""

  fetch(`/api/send-msg`, {
    method: "POST",
    body: JSON.stringify({msg})
  }).then(() => {
    toaster.log("Успешно отправлено!")
  })
}