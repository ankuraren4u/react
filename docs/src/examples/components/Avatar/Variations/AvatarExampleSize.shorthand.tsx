import _ from 'lodash'
import React from 'react'
import { Avatar } from '@stardust-ui/react'

const AvatarExampleSizeShorthand = () =>
  _.times(10, i => {
    const size = i + 1

    return (
      <div style={{ background: 'white', marginBottom: '10px' }}>
        <Avatar
          key={size}
          size={size}
          src="public/images/avatar/small/matt.jpg"
          status="Available"
          variables={{ presenceIndicatorBackground: 'white' }}
          style={{ marginRight: '10px' }}
        />
        <Avatar
          key={size * 100}
          size={size}
          name="John Doe"
          status="Available"
          variables={{ presenceIndicatorBackground: 'white' }}
          style={{ marginRight: '10px' }}
        />
        <Avatar key={size * 1000} size={size} src="public/images/avatar/small/matt.jpg" />
      </div>
    )
  })

export default AvatarExampleSizeShorthand
