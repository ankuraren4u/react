import * as React from 'react'
import { ReactWrapper } from 'enzyme'
import { mountWithProvider as mount } from 'test/utils'

import Slot from 'src/components/Slot/Slot'
import { ShorthandValue } from 'utils'

export interface ImplementsWrapperPropOptions {
  wrapppedComponentSelector: any
  wrappperComponentSelector?: any
}

const implementsWrapperProp = <P extends { wrapper: ShorthandValue }>(
  Component: React.ReactType<P>,
  options: ImplementsWrapperPropOptions,
) => {
  const { wrapppedComponentSelector, wrappperComponentSelector = Slot.defaultProps.as } = options

  const wrapperTests = (wrapper: ReactWrapper) => {
    expect(wrapper.length).toBeGreaterThan(0)
    expect(wrapper.find(wrapppedComponentSelector).length).toBeGreaterThan(0)
  }

  describe('"wrapper" prop', () => {
    it('wraps the component by default', () => {
      wrapperTests(mount(<Component />).find(wrappperComponentSelector))
    })

    it('wraps the component with a custom element', () => {
      wrapperTests(mount(<Component wrapper={<span />} />).find('span'))
    })

    it('wraps the component with a custom element using "as" prop', () => {
      wrapperTests(mount(<Component wrapper={{ as: 'p' }} />).find('p'))
    })
  })
}

export default implementsWrapperProp
