export default class Toast {
  constructor (msgContent='', additionalClass='', life=null) {
    assign(this, {msgContent, additionalClass, life})
  }

  render() {
    this.el = document.createElement('div')

    assign(this.el, {
      ...typeof this.msgContent=='string'? {innerHTML: this.msgContent} : {},
      className: `Toaster-toast ${this.additionalClass}`,
      toast: this,
    })
    if (typeof this.msgContent != 'string') this.el.append(this.msgContent)

    const sides = this.toaster.side.split('-')
    let leftOffset = 'var(--offset)'
    let transform = {}
    if (sides[1] == 'center') {
      sides[1] = 'left'
      leftOffset = '50%'
      transform = {transform: 'translateX(-50%)'}
    }

    assign(this.el.style, {
      [sides[0]]: 'calc(var(--offset) + var(--shift))',
      [sides[1]]: leftOffset, ...transform,
      zIndex: zIndex++
    })

    this.prepareEventHandlers()

    this.toaster.el.append(this.el)

    this.timer = setTimeout(() => this.remove(), this.life*1000)
  }

  prepareEventHandlers() {
    const closer = this.closer = closeBtn.cloneNode(true)
    closer.onclick = e => e.shiftKey ? this.toaster.clear() : this.remove()
    this.el.append(closer)

    let offsetX, offsetY

    const glass = this.toaster.el

    const handleMove = e => {
      if ((e.buttons & 1) !== 1) return handleStop()

      const left = e.clientX - offsetX + 'px'
      const top = e.clientY - offsetY + 'px'

      if (!this.placed) {
        clearTimeout(this.timer)
        this.placed = true
        this.el.classList.add('placed')

        this.toaster.updateShifts()

        const {width, height} = this.el.getBoundingClientRect()
        assign(this.el.style,
          {width: width+'px', height: height+'px', maxWidth: 'unset'},
          {left: null, right: null, top: null, bottom: null, transform: null})
      }

      assign(this.el.style, {top, left})
    }

    const handleStop = () => {
      glass.style.pointerEvents = null
      glass.removeEventListener('mousemove', handleMove)
      glass.removeEventListener('mouseup', handleStop)
      this.el.style.transition = null
      this.updateClosePos()
    }

    this.el.onmousedown = e => {
      this.el.style.transition = 'none'
      assign(this.el.style, {transition: 'none', zIndex: zIndex++})
      this.toaster.rise()

      const {x, y} = this.el.getBoundingClientRect()
      const {clientX, clientY} = e
      offsetX = clientX - x
      offsetY = clientY - y

      glass.style.pointerEvents = 'all'
      glass.addEventListener('mousemove', handleMove)
      glass.addEventListener('mouseup', handleStop)
    }
  }

  remove() {
    clearTimeout(this.timer)
    this.el.classList.add('fleeing')
    this.el.onanimationend = () => this.el.remove()

    const {toasts} = this.toaster
    toasts.splice(toasts.indexOf(this), 1)
    this.toaster.updateShifts()
  }

  updateClosePos() {
    const {closer, closer: {style}} = this
    const {left, right, top, bottom} = closer.getBoundingClientRect()

    if (left < 0) assign(style, {left: 'unset', right: null})
    if (right > innerWidth) assign(style, {left: null, right: 'unset'})
    if (top < 0) assign(style, {top: 'unset', bottom: null})
    if (bottom > innerHeight) assign(style, {top: null, bottom: 'unset'})
  }
}


let zIndex = 1


const {assign} = Object


const closeBtn = document.createElement('button')
assign(closeBtn, {innerText: '×', className: 'toast-close'})
assign(closeBtn.style, {left: 'unset', bottom: 'unset'})
