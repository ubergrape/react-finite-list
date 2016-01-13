import React, {Component, PropTypes} from 'react'
import ReactDOM from 'react-dom'
import findIndex from 'lodash/array/findIndex'
import noop from 'lodash/utility/noop'
import debounce from 'lodash/function/debounce'
import VisibilitySensor from 'react-visibility-sensor'


/**
 * Finds an element index in a list by selector "prev" or "next".
 * If selector goes to the undefined position, first or last element will be selected.
 */
function findIndexBySelector(selector, list, validation) {
  const currIndex = findIndex(list, validation)
  let index

  if (selector === 'next') {
    index = list[currIndex + 1] ? currIndex + 1 : 0
  }

  if (selector === 'prev') {
    index = list[currIndex - 1] ? currIndex - 1 : list[list.length - 1]
  }

  return index
}

export default class FiniteList extends Component {
  static propTypes = {
    focused: PropTypes.any,
    onMouseOver: PropTypes.func,
    onSelect: PropTypes.func,
    onFocus: PropTypes.func,
    renderItem: PropTypes.func,
    items: PropTypes.array,
    className: PropTypes.string,
    style: PropTypes.object
  }

  static defaultProps = {
    items: [],
    className: '',
    onSelect: noop,
    renderItem: noop,
    onFocus: noop,
    onMouseOver: noop,
    style: {
      overflow: 'auto',
      position: 'relative'
    }
  }

  constructor(props) {
    super(props)
    this.scrolling = false
    this.onScrollStopDebounced = debounce(::this.onScrollStop, 30)
  }

  componentDidMount() {
    if (!this.node) this.forceUpdate()
    this.node = ReactDOM.findDOMNode(this)
  }

  componentDidUpdate(prevProps) {
    if (this.props.focused !== prevProps.focused) {
      this.checkSensor(this.props.focused)
    }
  }

  onMouseOver(item) {
    this.props.onMouseOver(item)
  }

  onMouseUp(item) {
    this.props.onSelect(item)
  }

  onVisibilityChange(index, isVisible, visibilityRect) {
    if (isVisible || this.scrolling) return

    const itemNode = ReactDOM.findDOMNode(this.refs[`item-${index}`])
    const itemTop = itemNode.offsetTop

    // Scrolling up.
    let scrollTop = itemTop

    // Scrolling down.
    if (visibilityRect.top) {
      const viewPortHeight = this.node.offsetHeight
      const itemHeight = itemNode.offsetHeight
      scrollTop = itemTop - viewPortHeight + itemHeight
    }

    this.node.scrollTop = scrollTop
  }

  onScrollStop() {
    this.scrolling = false
  }

  onScroll() {
    this.scrolling = true
    this.onScrollStopDebounced()
  }

  /**
   * Selector can be a string prev/next or item object.
   */
  focus(selector) {
    const {items, focused} = this.props
    let item = selector

    if (typeof selector == 'string') {
      const index = findIndexBySelector(selector, items, _item => _item === focused)
      item = items[index]
    }

    this.props.onFocus(item)
  }

  checkSensor(item) {
    const index = findIndex(this.props.items, _item => _item === item)
    this.refs[`sensor-${index}`].check()
  }

  renderItems() {
    const {items} = this.props

    // We need theis DOM node for visibility sensor.
    if (!this.node || !items.length) return null

    return items.map((item, index) => {
      const element = this.props.renderItem({
        item,
        focused: this.props.focused === item
      })
      const clone = React.cloneElement(element, {
        onMouseOver: this.onMouseOver.bind(this, item),
        onMouseUp: this.onMouseUp.bind(this, item),
        ref: `item-${index}`
      })
      return (
        <VisibilitySensor
          onChange={this.onVisibilityChange.bind(this, index)}
          containment={this.node}
          active={false}
          ref={`sensor-${index}`}
          key={`sensor-${index}`}>
          {clone}
        </VisibilitySensor>
      )
    })
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
}
