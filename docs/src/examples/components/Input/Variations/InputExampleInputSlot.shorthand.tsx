import React from 'react'
import { Grid, Input, Text } from '@stardust-ui/react'

const inputStyles = { color: 'blue', background: 'yellow' }
const InputExampleInputSlot = () => (
  <Grid columns="1fr 2fr" styles={{ justifyItems: 'start', alignItems: 'center', gap: '10px' }}>
    <Text content="Input default:" />
    <Input placeholder="Search..." role="presentation" />

    <Text content="Input with input slot as props:" />
    <Input
      placeholder="Search..."
      role="presentation"
      input={{
        // will override component's 'placeholder' attribute
        placeholder: 'Placeholder Override...',

        // will override component's 'role' attribute
        role: 'checkbox',

        // will set custom styles for input DOM element
        styles: inputStyles,
      }}
    />

    <Text content="Wrapped Input with existing component:" />
    <Input
      placeholder="Search..."
      role="presentation"
      input={
        <Text
          as="input"
          placeholder="Placeholder Override..."
          role="checkbox"
          styles={inputStyles}
        />
      }
    />

    <Text content="Wrapped Input with custom element:" />
    <Input
      placeholder="Search..."
      role="presentation"
      input={<input placeholder="Placeholder Override..." role="checkbox" style={inputStyles} />}
    />
  </Grid>
)

export default InputExampleInputSlot
