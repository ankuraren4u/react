import React from 'react'
import { Label } from '@stardust-ui/react'

class LabelExampleOnRemoveShorthand extends React.Component<{}, { display: string }> {
  constructor() {
    super({})
    this.state = {
      display: 'inline-block',
    }
  }

  public hide = () => {
    this.setState({ display: 'none' })
  }

  public render() {
    const { display } = this.state
    return <Label circular style={{ display }} onRemove={this.hide} content="Removable label" />
  }
}

export default LabelExampleOnRemoveShorthand
