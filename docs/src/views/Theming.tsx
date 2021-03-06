import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { Header } from 'semantic-ui-react'
import { Button, Divider, Icon, Provider, Text } from '@stardust-ui/react'

import DocPage from '../components/DocPage/DocPage'
import ExampleSnippet from '../components/ExampleSnippet/ExampleSnippet'

export default () => (
  <DocPage title="Theming">
    <Header as="h2" content="Overview" />
    <p>
      Stardust is a fully themable component library. Theming is opt-in, allowing you to theme as
      much or as little as needed. Themes can be applied to your entire app, to specific subtrees,
      or to individual components. You can also infinitely nest and override themes.
    </p>

    <p>Let's look at how this is done.</p>

    <Header as="h2" content="Variables" />
    <p>
      The recommended API for customizing the look and feel of components is through theme
      variables. Variables are both easier to use and more robust than styles. Setting a theme
      variable will ensure your value is properly applied to every applicable style in every
      supported usage of the component.
    </p>

    <p>Variables are defined at two levels, the site level and the component level.</p>

    <Header a="h3" content="Site variables" />
    <p>
      Site variables define your site, app, or business. These are global values, like brand colors
      and typography, that are shared across many components.
    </p>
    <p>
      You define site variables using the <NavLink to="components/provider">Provider</NavLink>.
    </p>

    <ExampleSnippet
      value={[
        `<Provider theme={{ siteVariables: { brand: 'hotpink' } }}>`,
        `  <div>`,
        `    <Button type="primary">Branding</Button>`,
        `    <Divider type="primary">Branding</Divider>`,
        `  </div>`,
        `</Provider>`,
      ].join('\n')}
      render={() => (
        <Provider theme={{ siteVariables: { brand: 'hotpink' }, componentVariables: {} }}>
          <div>
            <Button type="primary">Branding</Button>
            <Divider type="primary">Branding</Divider>
          </div>
        </Provider>
      )}
    />

    <Header a="h3" content="Component variables" />
    <p>
      Component variables define theme values for a specific component. This includes information
      such as colors, borders, or box model values.
    </p>

    <p>You can define component variables on a single instance of a component.</p>
    <ExampleSnippet
      value={[
        `<Icon name="user" circular />`,
        `<Icon name="user" circular variables={{ color: 'cornflowerblue' }} />`,
      ].join('\n')}
      render={() => (
        <div>
          <Icon name="user" circular />
          <Icon name="user" circular variables={{ color: 'cornflowerblue' }} />
        </div>
      )}
    />

    <p>
      You can also define component variables for all components in a part of your render tree using
      the <NavLink to="components/provider">Provider</NavLink>.
    </p>
    <ExampleSnippet
      value={[
        `<Icon name="user" circular />`,
        `<Icon name="user" circular />`,
        '',
        `<Provider theme={{ componentVariables: { Icon: { color: 'cornflowerblue' } } }}>`,
        `  <span>`,
        `    <Icon name="user" circular />`,
        `    <Icon name="user" circular />`,
        `  </span>`,
        `</Provider>`,
      ].join('\n')}
      render={() => (
        <div>
          <Icon name="user" circular />
          <Icon name="user" circular />

          <Provider theme={{ componentVariables: { Icon: { color: 'cornflowerblue' } } }}>
            <span>
              <Icon name="user" circular />
              <Icon name="user" circular />
            </span>
          </Provider>
        </div>
      )}
    />
    <p>
      You can customize component variables for your entire app by defining component variables on a{' '}
      <NavLink to="components/provider">Provider</NavLink> at the root of your app.
    </p>

    <Header as="h2" content="Styles" />
    <blockquote>
      <strong>First, prefer variables</strong> - In order to override component styles you must
      understand and align your overrides to the current theme's style implementation. You also must
      ensure you properly override styles for every permutation of props for the component, which
      can be complex at times. Otherwise, you risk breaking styles in some usages of the component.
      This makes style overrides more brittle and less desirable than variable overrides.
    </blockquote>

    <p>
      Styles are available as an escape hatch for when there is no suitable theme variable available
      for your needs. Component <code>styles</code> are CSS-like style objects that are converted to
      real CSS and applied to your component as HTML class names.
    </p>

    <p>
      You can define <code>styles</code> on a single component instance.
    </p>
    <ExampleSnippet
      value={`<Text styles={{ color: 'green' }}>This is green text</Text>`}
      render={() => <Text styles={{ color: 'green' }}>This is green text</Text>}
    />
    <p>
      Every slot (named part) of every component also accepts <code>styles</code> that are applied
      to the root element of the slot.
    </p>
    <ExampleSnippet
      value={[
        `<Button`,
        `  icon={{ name: 'user', styles: { boxShadow: '0 0 0 2px red' } }}`,
        `  content="Profile"`,
        `/>`,
      ].join('\n')}
      render={() => (
        <Button icon={{ name: 'user', styles: { boxShadow: '0 0 0 2px red' } }} content="Profile" />
      )}
    />

    <p>
      You can also define <code>styles</code> for all components in a part of your render tree using
      the <NavLink to="components/provider">Provider</NavLink>.
    </p>
    <p>
      This is done with the Provider's <code>theme</code> prop. Styles are applied based on
      component display name and slot name. Here's how we can style the <code>Button</code> and its{' '}
      <code>icon</code> slot.
    </p>
    <ExampleSnippet
      value={[
        `<Button icon="user" content="Profile" />`,
        `<Button icon="user" content="Profile" />`,
        ``,
        `<Provider`,
        `  theme={{`,
        `    componentStyles: {`,
        `      Button: {`,
        `        root: { boxShadow: '0 0 0 2px blue' },`,
        `        icon: { boxShadow: '0 0 0 2px red' },`,
        `        content: { boxShadow: '0 0 0 2px green' },`,
        `      },`,
        `    },`,
        `  }}`,
        `>`,
        `  <span>`,
        `    <Button icon="user" content="Profile" />`,
        `    <Button icon="user" content="Profile" />`,
        `  </span>`,
        `</Provider>`,
      ].join('\n')}
      render={() => (
        <div>
          <Button icon="user" content="Profile" />
          <Button icon="user" content="Profile" />

          <Provider
            theme={{
              componentStyles: {
                Button: {
                  root: { boxShadow: '0 0 0 2px blue' },
                  icon: { boxShadow: '0 0 0 2px red' },
                  content: { boxShadow: '0 0 0 2px green' },
                },
              },
            }}
          >
            <span>
              <Button icon="user" content="Profile" />
              <Button icon="user" content="Profile" />
            </span>
          </Provider>
        </div>
      )}
    />
    <p>
      You can style all components in your app by defining component styles on a{' '}
      <NavLink to="components/provider">Provider</NavLink> at the root of your app.
    </p>

    <br />
    <Divider size={1} />
    <br />
    <Button
      as={NavLink}
      content="Accessibility"
      type="primary"
      icon="arrow left"
      iconPosition="before"
      to="/accessibility"
    />
    <Button
      as={NavLink}
      content="Theming Examples"
      type="primary"
      icon="arrow right"
      iconPosition="after"
      to="theming-examples"
    />
  </DocPage>
)
