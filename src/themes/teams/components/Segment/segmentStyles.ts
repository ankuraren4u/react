import { ICSSInJSStyle, ComponentSlotStylesInput } from '../../../types'
import { SegmentProps } from 'src/components/Segment/Segment'
import { SegmentVariables } from './segmentVariables'

const segmentStyles: ComponentSlotStylesInput<SegmentProps, SegmentVariables> = {
  root: ({ props: { inverted }, variables: v }): ICSSInJSStyle => {
    return {
      padding: '1rem',
      boxShadow: '0 1px 1px 1px rgba(34,36,38,.15)',
      ...(inverted
        ? {
            backgroundColor: v.color,
          }
        : v.color && {
            borderTop: `2px solid ${v.color}`,
          }),
    }
  },
}

export default segmentStyles
