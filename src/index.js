import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import findIndex from 'lodash/array/findIndex'
import noop from 'lodash/utility/noop'
import debounce from 'lodash/function/debounce'
import VisibilitySensor from 'react-visibility-sensor'

export default class FiniteList extends Component {
  static defaultProps = {
    items: [],
    className: '',
    onSelect: noop,
    renderItem: noop,
    style: {
      overflow: 'auto',
      position: 'relative'
    }
  }

  constructor(props) {
    super(props)
    this.state = this.createState(this.props)
    this.scrolling = false
    this.onScrollStopDebounced = debounce(::this.onScrollStop, 30)
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.createState(nextProps))
  }

  componentDidMount() {
    this.setState({node: ReactDOM.findDOMNode(this)})
  }

  render() {
    return (
      <div
        className={this.props.className}
        onScroll={::this.onScroll}
        style={this.props.style}>
        {this.renderItems()}
      </div>
    )
  }

  renderItems() {
    let {items, node} = this.state
    // We need theis DOM node for visibility sensor.
    if (!node || !items.length) return null

    return items.map((item, i) => {
      let element = this.props.renderItem({
        item,
        focused: this.state.focused === item
      })
      let clone = React.cloneElement(element, {
        onMouseOver: this.onMouseOver.bind(this, item),
        onMouseUp: this.onMouseUp.bind(this, item),
        ref: `item-${i}`
      })
      return (
        <VisibilitySensor
          onChange={this.onVisibilityChange.bind(this, i)}
          containment={node}
          active={false}
          ref={`sensor-${i}`}
          key={`item-${i}`}>
          {clone}
        </VisibilitySensor>
      )
    })
  }

  createState(props) {
    let {items} = props
    let focused = items[0]
    return {items, focused}
  }

  /**
   * Selector can be a string prev/next or item object.
   */
  focus(selector) {
    let {items} = this.state
    let item

    if (typeof selector == 'string') {
      let index = findIndex(items, _item => _item === this.state.focused)
      if (selector === 'next') {
        index++
        if (!items[index]) index = 0
      }
      else {
        index--
        if (!items[index]) index = items.length - 1
      }
      item = items[index]
    }
    else item = selector

    if (!item) return

    this.setState({focused: item}, ::this.onFocus)
  }

  onMouseOver(item) {
    this.focus(item)
  }

  onMouseUp(item) {
    this.props.onSelect(item)
  }

  onVisibilityChange(index, isVisible, visibilityRect) {
    if (isVisible || this.scrolling) return

    let viewPortNode = this.state.node
    let itemNode = ReactDOM.findDOMNode(this.refs[`item-${index}`])
    let itemTop = itemNode.offsetTop

    // Scrolling up.
    let scrollTop = itemTop

    // Scrolling down.
    if (visibilityRect.top) {
      let viewPortHeight = viewPortNode.offsetHeight
      let itemHeight = itemNode.offsetHeight
      scrollTop = itemTop - viewPortHeight + itemHeight
    }

    viewPortNode.scrollTop = scrollTop
  }

  onFocus() {
    let index = findIndex(this.state.items, item => item === this.state.focused)
    this.refs[`sensor-${index}`].check()
  }

  onScrollStop() {
    this.scrolling = false
  }

  onScroll() {
    this.scrolling = true
    this.onScrollStopDebounced()
  }
}
