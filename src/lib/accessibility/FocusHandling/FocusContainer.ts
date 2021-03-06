import * as _ from 'lodash'
import { FocusableItemProps, SetStateDelegate } from './FocusableItem'

export interface FocusContainerProps<T> {
  items?: T[]
}

export interface FocusContainerState {
  focusItemOnIdx: number
}

export class ContainerFocusHandler<
  T,
  P extends FocusContainerProps<T>,
  S extends FocusContainerState
> {
  constructor(
    private getProps: () => P,
    private setState: SetStateDelegate<P, S>,
    private initState: (state: FocusContainerState) => void,
    private getState: () => S,
  ) {
    this.initState({ focusItemOnIdx: 0 } as S)
  }

  public static create<T, P extends FocusContainerProps<T>, S extends FocusContainerState>(
    component: React.Component<P, S>,
  ): ContainerFocusHandler<T, P, S> {
    return new this(
      () => component.props,
      component.setState.bind(component),
      (state: S) => {
        component.state = _.assign(component.state, state)
      },
      () => component.state,
    )
  }

  public createItemProps(idx: number, itemsLength: number): FocusableItemProps {
    return {
      isFocused: idx === this.getState().focusItemOnIdx && this.getState().focusItemOnIdx !== -1,
      isFirstElement: idx === 0,
      isLastElement: idx === itemsLength - 1,
    }
  }

  public movePrevious(): void {
    if (this.getState().focusItemOnIdx <= 0) {
      return
    }

    this.setState(prev => {
      return { focusItemOnIdx: prev.focusItemOnIdx - 1 }
    })
  }

  public moveNext(): void {
    if (
      !this.getProps().items ||
      this.getState().focusItemOnIdx >= this.getProps().items.length - 1
    ) {
      return
    }

    this.setState(prev => {
      return { focusItemOnIdx: prev.focusItemOnIdx + 1 }
    })
  }

  public moveFirst(): void {
    if (this.getState().focusItemOnIdx === 0) {
      return
    }

    this.setState({
      focusItemOnIdx: 0,
    })
  }

  public moveLast(): void {
    if (
      !this.getProps().items ||
      this.getState().focusItemOnIdx === this.getProps().items.length - 1
    ) {
      return
    }

    this.setState({
      focusItemOnIdx: this.getProps().items.length - 1,
    })
  }
}
