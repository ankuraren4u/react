import * as React from 'react'
import * as PropTypes from 'prop-types'
import {
  FocusZoneDirection,
  FocusZoneTabbableElements,
  IFocusZone,
  IFocusZoneProps,
} from './FocusZone.types'
import * as keyboardKey from 'keyboard-key'
import * as cx from 'classnames'
import * as _ from 'lodash'
// import {
//   // BaseComponent,
//   // EventGroup,
//   // KeyCodes,
//   // css,
//   // htmlElementProperties,
//   // elementContains,
//   // getDocument,
//   // getId,
//   // getNextElement,
//   // getNativeProps,
//   // getParent,
//   // getPreviousElement,
//   // getRTL, // TODO: this is probably broken anyway, we need a way to check RTL in Stardust!
//   // isElementFocusZone,
//   // isElementFocusSubZone,
//   // isElementTabbable,
//   // shouldWrapFocus,
//   // createRef,
// } from '@uifabric/utilities'
import {
  getNextElement,
  getPreviousElement,
  isElementFocusZone,
  isElementFocusSubZone,
  isElementTabbable,
} from './FocusUtilities'
import { IS_FOCUSABLE_ATTRIBUTE } from '../interfaces'
import getUnhandledProps from '../../getUnhandledProps'

const IS_ENTER_DISABLED_ATTRIBUTE = 'data-disable-click-on-enter'
export const FOCUSZONE_ID_ATTRIBUTE = 'data-focuszone-id'
const TABINDEX = 'tabindex'
const NO_VERTICAL_WRAP = 'data-no-vertical-wrap'
const NO_HORIZONTAL_WRAP = 'data-no-horizontal-wrap'
const LARGE_DISTANCE_FROM_CENTER = 999999999
const LARGE_NEGATIVE_DISTANCE_FROM_CENTER = -999999999

const _allInstances: {
  [key: string]: FocusZone
} = {}

interface IPoint {
  left: number
  top: number
}
const ALLOWED_INPUT_TYPES = ['text', 'number', 'password', 'email', 'tel', 'url', 'search']

function getParent(child: HTMLElement): HTMLElement | null {
  return child && child.parentNode && (child.parentNode as HTMLElement)
}

const getRTL = () => false

export class FocusZone extends React.Component<IFocusZoneProps, {}> implements IFocusZone {
  static propTypes = {
    isCircularNavigation: PropTypes.bool,
    direction: PropTypes.number,
  }

  public static defaultProps: IFocusZoneProps = {
    isCircularNavigation: false,
    direction: FocusZoneDirection.bidirectional,
  }

  static handledProps = ['isCircularNavigation', 'direction']

  static displayName = 'FocusZone'
  static className = 'ms-FocusZone'

  private _root = React.createRef<HTMLElement>()
  private _id: string
  /** The most recently focused child element. */
  private _activeElement: HTMLElement | null
  /** The child element with tabindex=0. */
  private _defaultFocusElement: HTMLElement | null
  private _focusAlignment: IPoint
  private _isInnerZone: boolean

  /** Used to allow us to move to next focusable element even when we're focusing on a input element when pressing tab */
  private _processingTabKey: boolean

  private windowElement: Window | null

  constructor(props: IFocusZoneProps) {
    super(props, undefined) // TODO what is context?

    this._id = _.uniqueId('FocusZone')

    this._focusAlignment = {
      left: 0,
      top: 0,
    }

    this._processingTabKey = false
    this.onKeyDownCapture = this.onKeyDownCapture.bind(this)
  }

  public componentDidMount(): void {
    _allInstances[this._id] = this
    if (this._root.current) {
      this.windowElement = this._root.current.ownerDocument.defaultView

      let parentElement = getParent(this._root.current)

      while (parentElement && parentElement !== document.body && parentElement.nodeType === 1) {
        if (isElementFocusZone(parentElement)) {
          this._isInnerZone = true
          break
        }
        parentElement = getParent(parentElement)
      }

      if (!this._isInnerZone) {
        this.windowElement.addEventListener('keydown', this.onKeyDownCapture, true)
      }

      // Assign initial tab indexes so that we can set initial focus as appropriate.
      this.updateTabIndexes()

      if (this.props.defaultActiveElement) {
        this._activeElement = document.querySelector(this.props.defaultActiveElement) as HTMLElement
        this.focus()
      }
    }
  }

  public componentWillUnmount() {
    delete _allInstances[this._id]
    if (this.windowElement) {
      this.windowElement.removeEventListener('keydown', this.onKeyDownCapture, true)
    }
  }

  render() {
    const { className } = this.props
    const Tag = this.props.elementType || 'div'
    const rest = getUnhandledProps({ handledProps: FocusZone.handledProps }, this.props)

    return (
      <Tag
        role="presentation"
        {...rest}
        className={cx('ms-FocusZone', className)}
        ref={this._root}
        data-focuszone-id={this._id}
        onKeyDown={this._onKeyDown}
        onFocus={this._onFocus}
        onMouseDownCapture={this._onMouseDown}
      >
        {this.props.children}
      </Tag>
    )
  }

  /**
   * Sets focus to the first tabbable item in the zone.
   * @param {boolean} forceIntoFirstElement If true, focus will be forced into the first element, even if focus is already in the focus zone.
   * @returns True if focus could be set to an active element, false if no operation was taken.
   */
  public focus(forceIntoFirstElement: boolean = false): boolean {
    if (this._root.current) {
      if (
        !forceIntoFirstElement &&
        this._root.current.getAttribute(IS_FOCUSABLE_ATTRIBUTE) === 'true' &&
        this._isInnerZone
      ) {
        const ownerZoneElement = this.getOwnerZone(this._root.current) as HTMLElement

        if (ownerZoneElement !== this._root.current) {
          const ownerZone =
            _allInstances[ownerZoneElement.getAttribute(FOCUSZONE_ID_ATTRIBUTE) as string]

          return !!ownerZone && ownerZone.focusElement(this._root.current)
        }

        return false
      }
      if (
        !forceIntoFirstElement &&
        this._activeElement &&
        this._root.current.contains(this._activeElement) &&
        isElementTabbable(this._activeElement)
      ) {
        this._activeElement.focus()
        return true
      }

      const firstChild = this._root.current.firstChild as HTMLElement

      return this.focusElement(getNextElement(this._root.current, firstChild, true) as HTMLElement)
    }
    return false
  }

  /**
   * Sets focus to the last tabbable item in the zone.
   * @param {boolean} forceIntoFirstElement If true, focus will be forced into the first element, even if focus is already in the focus zone.
   * @returns True if focus could be set to an active element, false if no operation was taken.
   */
  public focusLast(): boolean {
    if (this._root.current) {
      const lastChild = this._root.current && (this._root.current.lastChild as HTMLElement | null)

      this.focusElement(getPreviousElement(
        this._root.current,
        lastChild,
        true,
        true,
        true,
      ) as HTMLElement)
    }

    return false
  }

  /**
   * Sets focus to a specific child element within the zone. This can be used in conjunction with
   * onBeforeFocus to created delayed focus scenarios (like animate the scroll position to the correct
   * location and then focus.)
   * @param {HTMLElement} element The child element within the zone to focus.
   * @returns True if focus could be set to an active element, false if no operation was taken.
   */
  public focusElement(element: HTMLElement): boolean {
    const { onBeforeFocus } = this.props

    if (onBeforeFocus && !onBeforeFocus(element)) {
      return false
    }

    if (element) {
      this.setActiveElement(element)
      if (this._activeElement) {
        this._activeElement.focus()
      }

      return true
    }

    return false
  }

  private _onFocus = (ev: React.FocusEvent<HTMLElement>): void => {
    const {
      onActiveElementChanged,
      doNotAllowFocusEventToPropagate,
      onFocusNotification,
    } = this.props

    if (onFocusNotification) {
      onFocusNotification()
    }

    if (this.isImmediateDescendantOfZone(ev.target as HTMLElement)) {
      this._activeElement = ev.target as HTMLElement
      this.setFocusAlignment(this._activeElement)
    } else {
      let parentElement = ev.target as HTMLElement

      while (parentElement && parentElement !== this._root.current) {
        if (isElementTabbable(parentElement) && this.isImmediateDescendantOfZone(parentElement)) {
          this._activeElement = parentElement
          break
        }
        parentElement = getParent(parentElement) as HTMLElement
      }
    }

    if (onActiveElementChanged) {
      onActiveElementChanged(this._activeElement as HTMLElement, ev)
    }

    if (doNotAllowFocusEventToPropagate) {
      ev.stopPropagation()
    }
  }

  /**
   * Handle global tab presses so that we can patch tabindexes on the fly.
   */
  private onKeyDownCapture(ev: KeyboardEvent) {
    if (keyboardKey.getCode(ev) === keyboardKey.Tab) {
      this.updateTabIndexes()
    }
  }

  private _onMouseDown = (ev: React.MouseEvent<HTMLElement>): void => {
    const { disabled } = this.props

    if (disabled) {
      return
    }

    let target = ev.target as HTMLElement
    const path: HTMLElement[] = []

    while (target && target !== this._root.current) {
      path.push(target)
      target = getParent(target) as HTMLElement
    }

    while (path.length) {
      target = path.pop() as HTMLElement

      if (target && isElementTabbable(target)) {
        this.setActiveElement(target, true)
      }

      if (isElementFocusZone(target)) {
        // Stop here since the focus zone will take care of its own children.
        break
      }
    }
  }

  private setActiveElement(element: HTMLElement, forceAlignemnt?: boolean): void {
    const previousActiveElement = this._activeElement

    this._activeElement = element

    if (previousActiveElement) {
      if (isElementFocusZone(previousActiveElement)) {
        this.updateTabIndexes(previousActiveElement)
      }

      previousActiveElement.tabIndex = -1
    }

    if (this._activeElement) {
      if (!this._focusAlignment || forceAlignemnt) {
        this.setFocusAlignment(element, true, true)
      }

      this._activeElement.tabIndex = 0
    }
  }

  private preventDefaultWhenHandled(ev: React.KeyboardEvent<HTMLElement>): void {
    this.props.preventDefaultWhenHandled && ev.preventDefault()
  }

  /**
   * Handle the keystrokes.
   */
  private _onKeyDown = (ev: React.KeyboardEvent<HTMLElement>): boolean | undefined => {
    const { direction, disabled, isInnerZoneKeystroke } = this.props

    if (disabled) {
      return
    }

    if (document.activeElement === this._root.current && this._isInnerZone) {
      // If this element has focus, it is being controlled by a parent.
      // Ignore the keystroke.
      return
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(ev)
    }

    // If the default has been prevented, do not process keyboard events.
    if (ev.isDefaultPrevented()) {
      return
    }

    if (
      isInnerZoneKeystroke &&
      isInnerZoneKeystroke(ev) &&
      this.isImmediateDescendantOfZone(ev.target as HTMLElement)
    ) {
      // Try to focus
      const innerZone = this.getFirstInnerZone()

      if (innerZone) {
        if (!innerZone.focus(true)) {
          return
        }
      } else if (isElementFocusSubZone(ev.target as HTMLElement)) {
        if (
          !this.focusElement(getNextElement(
            ev.target as HTMLElement,
            (ev.target as HTMLElement).firstChild as HTMLElement,
            true,
          ) as HTMLElement)
        ) {
          return
        }
      } else {
        return
      }
    } else if (ev.altKey) {
      return
    } else {
      switch (keyboardKey.getCode(ev)) {
        case keyboardKey.Spacebar:
          if (this.tryInvokeClickForFocusable(ev.target as HTMLElement)) {
            break
          }
          return

        case keyboardKey.ArrowLeft:
          if (direction !== FocusZoneDirection.vertical) {
            this.preventDefaultWhenHandled(ev)
            if (this.moveFocusLeft()) {
              break
            }
          }
          return

        case keyboardKey.ArrowRight:
          if (direction !== FocusZoneDirection.vertical) {
            this.preventDefaultWhenHandled(ev)
            if (this.moveFocusRight()) {
              break
            }
          }
          return

        case keyboardKey.ArrowUp:
          if (direction !== FocusZoneDirection.horizontal) {
            this.preventDefaultWhenHandled(ev)
            if (this.moveFocusUp()) {
              break
            }
          }
          return

        case keyboardKey.ArrowDown:
          if (direction !== FocusZoneDirection.horizontal) {
            this.preventDefaultWhenHandled(ev)
            if (this.moveFocusDown()) {
              break
            }
          }
          return

        case keyboardKey.Tab:
          if (
            this.props.handleTabKey === FocusZoneTabbableElements.all ||
            (this.props.handleTabKey === FocusZoneTabbableElements.inputOnly &&
              this.isElementInput(ev.target as HTMLElement))
          ) {
            let focusChanged = false
            this._processingTabKey = true
            if (direction === FocusZoneDirection.vertical) {
              focusChanged = ev.shiftKey ? this.moveFocusUp() : this.moveFocusDown()
            } else if (
              direction === FocusZoneDirection.horizontal ||
              direction === FocusZoneDirection.bidirectional
            ) {
              const tabWithDirection = getRTL() ? !ev.shiftKey : ev.shiftKey
              focusChanged = tabWithDirection ? this.moveFocusLeft() : this.moveFocusRight()
            }
            this._processingTabKey = false
            if (focusChanged) {
              break
            }
          }
          return

        case keyboardKey.Home:
          if (
            this.isElementInput(ev.target as HTMLElement) &&
            !this.shouldInputLoseFocus(ev.target as HTMLInputElement, false)
          ) {
            return false
          }
          const firstChild =
            this._root.current && (this._root.current.firstChild as HTMLElement | null)
          if (
            this._root.current &&
            firstChild &&
            this.focusElement(getNextElement(this._root.current, firstChild, true) as HTMLElement)
          ) {
            break
          }
          return

        case keyboardKey.End:
          if (
            this.isElementInput(ev.target as HTMLElement) &&
            !this.shouldInputLoseFocus(ev.target as HTMLInputElement, true)
          ) {
            return false
          }

          const lastChild =
            this._root.current && (this._root.current.lastChild as HTMLElement | null)
          if (
            this._root.current &&
            this.focusElement(getPreviousElement(
              this._root.current,
              lastChild,
              true,
              true,
              true,
            ) as HTMLElement)
          ) {
            break
          }
          return

        case keyboardKey.Enter:
          if (this.tryInvokeClickForFocusable(ev.target as HTMLElement)) {
            break
          }
          return

        default:
          return
      }
    }

    ev.preventDefault()
    ev.stopPropagation()
  }

  /**
   * Walk up the dom try to find a focusable element.
   * TODO
   */
  private tryInvokeClickForFocusable(onTarget: HTMLElement): boolean {
    return false
  }

  /**
   * Traverse to find first child zone.
   */
  private getFirstInnerZone(forRootElement?: HTMLElement | null): FocusZone | null {
    const rootElement = forRootElement || this._activeElement || this._root.current

    if (!rootElement) {
      return null
    }

    if (isElementFocusZone(rootElement)) {
      return _allInstances[rootElement.getAttribute(FOCUSZONE_ID_ATTRIBUTE) as string]
    }

    let child = rootElement.firstElementChild as HTMLElement | null

    while (child) {
      if (isElementFocusZone(child)) {
        return _allInstances[child.getAttribute(FOCUSZONE_ID_ATTRIBUTE) as string]
      }
      const match = this.getFirstInnerZone(child)

      if (match) {
        return match
      }

      child = child.nextElementSibling as HTMLElement | null
    }

    return null
  }

  private moveFocus(
    isForward: boolean,
    getDistanceFromCenter: (activeRect: ClientRect, targetRect: ClientRect) => number,
    ev?: Event,
    useDefaultWrap: boolean = true,
  ): boolean {
    let element = this._activeElement
    let candidateDistance = -1
    let candidateElement: HTMLElement | undefined = undefined
    let changedFocus = false
    const isBidirectional = this.props.direction === FocusZoneDirection.bidirectional

    if (!element || !this._root.current) {
      return false
    }

    if (this.isElementInput(element)) {
      if (!this.shouldInputLoseFocus(element as HTMLInputElement, isForward)) {
        return false
      }
    }

    const activeRect = isBidirectional ? element.getBoundingClientRect() : null

    do {
      element = (isForward
        ? getNextElement(this._root.current, element)
        : getPreviousElement(this._root.current, element)) as HTMLElement

      if (isBidirectional) {
        if (element) {
          const targetRect = element.getBoundingClientRect()
          const elementDistance = getDistanceFromCenter(activeRect as ClientRect, targetRect)

          if (elementDistance === -1 && candidateDistance === -1) {
            candidateElement = element
            break
          }

          if (
            elementDistance > -1 &&
            (candidateDistance === -1 || elementDistance < candidateDistance)
          ) {
            candidateDistance = elementDistance
            candidateElement = element
          }

          if (candidateDistance >= 0 && elementDistance < 0) {
            break
          }
        }
      } else {
        candidateElement = element
        break
      }
    } while (element)

    // Focus the closest candidate
    if (candidateElement && candidateElement !== this._activeElement) {
      changedFocus = true
      this.focusElement(candidateElement)
    } else if (this.props.isCircularNavigation && useDefaultWrap) {
      if (isForward) {
        return this.focusElement(getNextElement(
          this._root.current,
          this._root.current.firstElementChild as HTMLElement,
          true,
        ) as HTMLElement)
      }
      return this.focusElement(getPreviousElement(
        this._root.current,
        this._root.current.lastElementChild as HTMLElement,
        true,
        true,
        true,
      ) as HTMLElement)
    }

    return changedFocus
  }

  private moveFocusDown(): boolean {
    let targetTop = -1
    const leftAlignment = this._focusAlignment.left

    if (
      this.moveFocus(true, (activeRect: ClientRect, targetRect: ClientRect) => {
        let distance = -1
        // ClientRect values can be floats that differ by very small fractions of a decimal.
        // If the difference between top and bottom are within a pixel then we should treat
        // them as equivalent by using Math.floor. For instance 5.2222 and 5.222221 should be equivalent,
        // but without Math.Floor they will be handled incorrectly.
        const targetRectTop = Math.floor(targetRect.top)
        const activeRectBottom = Math.floor(activeRect.bottom)

        if (targetRectTop < activeRectBottom) {
          return LARGE_DISTANCE_FROM_CENTER
        }

        if (
          (targetTop === -1 && targetRectTop >= activeRectBottom) ||
          targetRectTop === targetTop
        ) {
          targetTop = targetRectTop
          if (
            leftAlignment >= targetRect.left &&
            leftAlignment <= targetRect.left + targetRect.width
          ) {
            distance = 0
          } else {
            distance = Math.abs(targetRect.left + targetRect.width / 2 - leftAlignment)
          }
        }

        return distance
      })
    ) {
      this.setFocusAlignment(this._activeElement as HTMLElement, false, true)
      return true
    }

    return false
  }

  private moveFocusUp(): boolean {
    let targetTop = -1
    const leftAlignment = this._focusAlignment.left

    if (
      this.moveFocus(false, (activeRect: ClientRect, targetRect: ClientRect) => {
        let distance = -1
        // ClientRect values can be floats that differ by very small fractions of a decimal.
        // If the difference between top and bottom are within a pixel then we should treat
        // them as equivalent by using Math.floor. For instance 5.2222 and 5.222221 should be equivalent,
        // but without Math.Floor they will be handled incorrectly.
        const targetRectBottom = Math.floor(targetRect.bottom)
        const targetRectTop = Math.floor(targetRect.top)
        const activeRectTop = Math.floor(activeRect.top)

        if (targetRectBottom > activeRectTop) {
          return LARGE_DISTANCE_FROM_CENTER
        }

        if (
          (targetTop === -1 && targetRectBottom <= activeRectTop) ||
          targetRectTop === targetTop
        ) {
          targetTop = targetRectTop
          if (
            leftAlignment >= targetRect.left &&
            leftAlignment <= targetRect.left + targetRect.width
          ) {
            distance = 0
          } else {
            distance = Math.abs(targetRect.left + targetRect.width / 2 - leftAlignment)
          }
        }

        return distance
      })
    ) {
      this.setFocusAlignment(this._activeElement as HTMLElement, false, true)
      return true
    }

    return false
  }

  private moveFocusLeft(): boolean {
    if (
      this.moveFocus(
        getRTL(),
        (activeRect: ClientRect, targetRect: ClientRect) => {
          let distance = -1

          if (
            targetRect.bottom > activeRect.top &&
            targetRect.right <= activeRect.right &&
            this.props.direction !== FocusZoneDirection.vertical
          ) {
            distance = activeRect.right - targetRect.right
          }

          return distance
        },
        undefined /*ev*/,
        true,
      )
    ) {
      this.setFocusAlignment(this._activeElement as HTMLElement, true, false)
      return true
    }

    return false
  }

  private moveFocusRight(): boolean {
    if (
      this.moveFocus(
        !getRTL(),
        (activeRect: ClientRect, targetRect: ClientRect) => {
          let distance = -1

          if (
            targetRect.top < activeRect.bottom &&
            targetRect.left >= activeRect.left &&
            this.props.direction !== FocusZoneDirection.vertical
          ) {
            distance = targetRect.left - activeRect.left
          }

          return distance
        },
        undefined /*ev*/,
        true,
      )
    ) {
      this.setFocusAlignment(this._activeElement as HTMLElement, true, false)
      return true
    }

    return false
  }

  private setFocusAlignment(element: HTMLElement, isHorizontal?: boolean, isVertical?: boolean) {
    if (
      this.props.direction === FocusZoneDirection.bidirectional &&
      (!this._focusAlignment || isHorizontal || isVertical)
    ) {
      const rect = element.getBoundingClientRect()
      const left = rect.left + rect.width / 2
      const top = rect.top + rect.height / 2

      if (!this._focusAlignment) {
        this._focusAlignment = { left, top }
      }

      if (isHorizontal) {
        this._focusAlignment.left = left
      }

      if (isVertical) {
        this._focusAlignment.top = top
      }
    }
  }

  private isImmediateDescendantOfZone(element?: HTMLElement): boolean {
    return this.getOwnerZone(element) === this._root.current
  }

  private getOwnerZone(element?: HTMLElement): HTMLElement | null {
    let parentElement = getParent(element as HTMLElement)

    while (
      parentElement &&
      parentElement !== this._root.current &&
      parentElement !== document.body
    ) {
      if (isElementFocusZone(parentElement)) {
        return parentElement
      }

      parentElement = getParent(parentElement)
    }

    return this._root.current
  }

  private updateTabIndexes(onElement?: HTMLElement) {
    let element = onElement
    if (!element && this._root.current) {
      this._defaultFocusElement = null
      element = this._root.current
      if (this._activeElement && !element.contains(this._activeElement)) {
        this._activeElement = null
      }
    }

    // If active element changes state to disabled, set it to null.
    // Otherwise, we lose keyboard accessibility to other elements in focus zone.
    if (this._activeElement && !isElementTabbable(this._activeElement)) {
      this._activeElement = null
    }

    const childNodes = element && element.children

    for (let childIndex = 0; childNodes && childIndex < childNodes.length; childIndex++) {
      const child = childNodes[childIndex] as HTMLElement

      if (!isElementFocusZone(child)) {
        // If the item is explicitly set to not be focusable then TABINDEX needs to be set to -1.
        if (child.getAttribute && child.getAttribute(IS_FOCUSABLE_ATTRIBUTE) === 'false') {
          child.setAttribute(TABINDEX, '-1')
        }

        if (isElementTabbable(child)) {
          if (this.props.disabled) {
            child.setAttribute(TABINDEX, '-1')
          } else if (
            !this._isInnerZone &&
            ((!this._activeElement && !this._defaultFocusElement) || this._activeElement === child)
          ) {
            this._defaultFocusElement = child
            if (child.getAttribute(TABINDEX) !== '0') {
              child.setAttribute(TABINDEX, '0')
            }
          } else if (child.getAttribute(TABINDEX) !== '-1') {
            child.setAttribute(TABINDEX, '-1')
          }
        } else if (child.tagName === 'svg' && child.getAttribute('focusable') !== 'false') {
          // Disgusting IE hack. Sad face.
          child.setAttribute('focusable', 'false')
        }
      } else if (child.getAttribute(IS_FOCUSABLE_ATTRIBUTE) === 'true') {
        if (
          !this._isInnerZone &&
          ((!this._activeElement && !this._defaultFocusElement) || this._activeElement === child)
        ) {
          this._defaultFocusElement = child
          if (child.getAttribute(TABINDEX) !== '0') {
            child.setAttribute(TABINDEX, '0')
          }
        } else if (child.getAttribute(TABINDEX) !== '-1') {
          child.setAttribute(TABINDEX, '-1')
        }
      }

      this.updateTabIndexes(child)
    }
  }

  private isElementInput(element: HTMLElement): boolean {
    if (
      element &&
      element.tagName &&
      (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea')
    ) {
      return true
    }
    return false
  }

  private shouldInputLoseFocus(element: HTMLInputElement, isForward?: boolean) {
    // If a tab was used, we want to focus on the next element.
    if (
      !this._processingTabKey &&
      element &&
      element.type &&
      ALLOWED_INPUT_TYPES.indexOf(element.type.toLowerCase()) > -1
    ) {
      const selectionStart = element.selectionStart
      const selectionEnd = element.selectionEnd
      const isRangeSelected = selectionStart !== selectionEnd
      const inputValue = element.value

      // We shouldn't lose focus in the following cases:
      // 1. There is range selected.
      // 2. When selection start is larger than 0 and it is backward.
      // 3. when selection start is not the end of length and it is forward.
      // 4. We press any of the arrow keys when our handleTabKey isn't none or undefined (only losing focus if we hit tab)
      // and if shouldInputLoseFocusOnArrowKey is defined, if scenario prefers to not loose the focus which is determined by calling the
      // callback shouldInputLoseFocusOnArrowKey
      if (
        isRangeSelected ||
        (selectionStart! > 0 && !isForward) ||
        (selectionStart !== inputValue.length && isForward) ||
        (!!this.props.handleTabKey &&
          !(
            this.props.shouldInputLoseFocusOnArrowKey &&
            this.props.shouldInputLoseFocusOnArrowKey(element)
          ))
      ) {
        return false
      }
    }

    return true
  }
}