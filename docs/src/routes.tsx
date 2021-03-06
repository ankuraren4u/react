import * as React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'

import ExternalExampleLayout from './components/ExternalExampleLayout'
import DocsLayout from './components/DocsLayout'
import DocsRoot from './components/DocsRoot'

import Accessibility from './views/Accessibility'
import ShorthandProps from './views/ShorthandProps'
import Glossary from './views/Glossary'
import Introduction from './views/Introduction'
import PageNotFound from './views/PageNotFound'
import QuickStart from './views/QuickStart'
import Theming from './views/Theming'
import ThemingExamples from './views/ThemingExamples'

const Router = () => (
  <BrowserRouter basename={__BASENAME__}>
    <Switch>
      <Route exact path="/maximize/:exampleName" component={ExternalExampleLayout} />
      <Switch>
        <DocsLayout exact path="/" component={Introduction} />
        <DocsLayout exact path="/:type/:name" component={DocsRoot} sidebar />
        <DocsLayout exact path="/quick-start" component={QuickStart} />
        {process.env.NODE_ENV !== 'production' && [
          <DocsLayout
            exact
            key="/prototype-chat-pane"
            path="/prototype-chat-pane"
            component={require('./prototypes/chatPane/index').default}
          />,
          <DocsLayout
            exact
            key="/prototype-async-shorthand"
            path="/prototype-async-shorthand"
            component={require('./prototypes/AsyncShorthand/index').default}
          />,
          <DocsLayout
            exact
            key="/prototype-employee-card"
            path="/prototype-employee-card"
            component={require('./prototypes/employeeCard/index').default}
          />,
          <DocsLayout
            exact
            key="/prototype-meeting-options"
            path="/prototype-meeting-options"
            component={require('./prototypes/meetingOptions/index').default}
          />,
        ]}
        <DocsLayout exact path="/glossary" component={Glossary} />
        <DocsLayout exact path="/accessibility" component={Accessibility} />
        <DocsLayout exact path="/theming" component={Theming} />
        <DocsLayout exact path="/theming-examples" component={ThemingExamples} />
        <DocsLayout exact path="/shorthand-props" component={ShorthandProps} />
        <DocsLayout exact path="/*" component={PageNotFound} />
      </Switch>
    </Switch>
  </BrowserRouter>
)

export default Router
