class Alert {
  constructor( text) {
    const alert = document.createElement("div")
    alert.className = `alert`
    alert.innerText = text
    document.body.append(alert)
    this.alert = alert

    const styles = document.createElement("style")
    styles.innerHTML = /*css*/`
      .alert {
        transform: translateY(-150%);
        transition: 1s;
      }
      
      .alert.show {
        transform: translateY(0);
      }
    `
    
    document.head.append(styles)
  }

  setText(text) {
    this.alert.innerText = text
  }

  toggle(on) {
    setTimeout(() => this.alert.classList.add(on), 100)
  }

  show() {
    setTimeout(() => this.alert.classList.add("show"), 100)
  }

  hide() {
    setTimeout(() => this.alert.classList.remove("show"), 100)
  }
}