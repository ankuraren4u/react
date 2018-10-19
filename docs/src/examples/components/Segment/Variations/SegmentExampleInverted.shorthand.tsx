import * as React from 'react'
import { Segment, Text } from '@stardust-ui/react'

const SegmentExampleInvertedShorthand = () => (
  <div>
    <Segment content="Colored segment." variables={{ color: 'purple' }} />
    <br />
    <Segment
      inverted
      content={<Text content="Colored inverted segment." styles={{ color: 'white' }} />}
      variables={{ color: 'purple' }}
    />
  </div>
)

export default SegmentExampleInvertedShorthand
