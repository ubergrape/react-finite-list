/* eslint-disable react/no-array-index-key */

import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {findDOMNode} from 'react-dom'
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
    index = list[currIndex - 1] ? currIndex - 1 : list.length - 1
  }

  return index
}

const findIndexByItem = (item, list) => findIndex(list, _item => _item === item)

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
    focused: null,
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
    this.index = 0
    this.onScrollStopDebounced = debounce(this.onScrollStop, 30)
  }

  componentDidMount() {
    // We need to pass the DOM node to VisibilitySensor in render method,
    // however react wants us to make render function without side effects.
    // Without this reference we don't render anything at first pass, thats why
    // we need to rerender when we got the node ref.
    if (!this.node) this.forceUpdate()
    this.node = findDOMNode(this)
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

  onScrollStop = () => {
    this.scrolling = false
  }

  onScroll = () => {
    this.scrolling = true
    this.onScrollStopDebounced()
  }

  onRef = (node) => {
    this.node = node
  }

  scrollTo(index) {
    // eslint-disable-next-line react/no-string-refs
    const itemNode = findDOMNode(this.refs[`item-${index}`])
    const itemTop = itemNode.offsetTop
    const direction = this.index - index

    // Scrolling up.
    let scrollTop = itemTop

    // Scrolling down.
    if (direction < 0) {
      const viewPortHeight = this.node.offsetHeight
      const itemHeight = itemNode.offsetHeight
      scrollTop = (itemTop - viewPortHeight) + itemHeight
    }

    this.node.scrollTop = scrollTop
  }

  /**
   * Selector can be a string prev/next or item object.
   */
  focus(itemOrSelector) {
    const {items, focused} = this.props
    let item = itemOrSelector

    if (typeof itemOrSelector === 'string') {
      this.index = findIndexBySelector(itemOrSelector, items, _item => _item === focused)
      item = items[this.index]
    }

    this.props.onFocus(item)
  }

  checkSensor(item) {
    const index = findIndexByItem(item, this.props.items)
    // eslint-disable-next-line react/no-string-refs
    const state = this.refs[`sensor-${index}`].check()

    if (!state.isVisible && !this.scrolling) {
      this.scrollTo(index)
    }

    this.index = index
  }

  renderItems() {
    const {items} = this.props

    // Without containment DOM node VisibilitySensor won't work.
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
        // VisibilitySensor is used to react when a list item goes out of viewport
        // for e.g. when it is scrolled down and became invisible.
        <VisibilitySensor
          onChange={noop}
          containment={this.node}
          active={false}
          ref={`sensor-${index}`}
          key={`sensor-${index}`}
        >
          {clone}
        </VisibilitySensor>
      )
    })
  }

  render() {
    return (
      <div
        className={this.props.className}
        onScroll={this.onScroll}
        style={this.props.style}
      >
        {this.renderItems()}
      </div>
    )
  }
}
