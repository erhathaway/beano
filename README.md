# router-primitives-react

Bindings for [router-primitives](https://github.com/erhathaway/router-primitives) to React.

Router Primitives is a layout primitives paradigm for application routing. Instead of focusing on pattern matching path names and query params, you describe the layout of your application in terms of router primitives. Primitives are composable and provide a simple declarative API to control routing actions and add complex animations.

# Usage

## 1. Declare the layout of your app in terms of router primitives

```typescript
import {IRouterDeclaration, AllTemplates} from 'router-primitives';

const routerDeclaration: IRouterDeclaration<AllTemplates> = {
    name: 'root',
    children: {
        scene: [
            {
                name: 'user',
                children: {
                    data: [{name: 'userId', isPathRouter: true}]
                }
            },
            {name: 'home', defaultAction: ['show']},
            {
                name: 'options',
                children: {
                    scene: [{name: 'appOptions', defaultAction: ['show']}, {name: 'userOptions'}]
                }
            }
        ],
        features: [{name: 'sideNav', routeKey: 'nav'}]
    }
};
```

## 2. Instantiate the router manager and generate Router Primitive React components

```typescript
const manager = new Manager({routerDeclaration}) as Manager<IRouterTemplates<unknown>>;
const routers = manager.routers;
const routerComponents = createRouterComponents(routers);

const Root = routerComponents['root'];
const UserScene = routerComponents['user'];
const UserIdData = routerComponents['userId'];
const HomeScene = routerComponents['home'];
const OptionsScene = routerComponents['options'];
const AppOptionsScene = routerComponents['appOptions'];
const UserOptionsScene = routerComponents['userOptionsScene'];
const SideNavFeature = routerComponents['sideNav'];
```

## 3. Use the components in your app

```typescript
import {Animatable} from 'animated-components';
import anime from 'animejs';
import {predicates} from 'router-primitives';

const app = () => (
    <Root>
        <UserScene>
            <UserIdData>{`The current user id is: ${routers.userId.state.data}`}</UserIdData>
        </UserScene>
        <HomeScene>{'Welcome to the app'}</HomeScene>
        <OptionsScene>
            <AppOptions.Link action={'show'}>
                <div>{`Show App Options`}</div>
            </AppOptions.Link>
            <UserOptions.Link action={'show'}>
                <div>{`Show User Options`}</div>
            </UserOptions.Link>
            <AppOptions>{'All your app option components'}</AppOptions>
            <UserOptions>{'All your user option components'}</UserOptions>
        </OptionsScene>
        <SideNav.Animate
            unMountOnHide
            when={[
                [
                    predicates.isJustShown,
                    ({node}) => anime({targets: `#${node.id}`, translateX: [0, 200]})
                ][
                    (predicates.isJustHidden,
                    ({node}) => anime({targets: `#${node.id}`, translateX: [200, 0]}))
                ]
            ]}
        >
            <Animatable>
                <UserScene.Link action={'show'}>
                    <div>{`Show Home Scene`}</div>
                </UserScene.Link>
                <HomeScene.Link action={'show'}>
                    <div>{`Show Home Scene`}</div>
                </HomeScene.Link>
                <OptionsScene.Link action={'show'}>
                    <div>{`Show Options`}</div>
                </OptionsScene.Link>
            </Animatable>
        </SideNav.Animate>
        <SideNav
            uncontrolled
        >
            {({state: {visible}}) =>
                visible ? (
                    <SideNav.Link action={'hide'}>
                        <div>{`Hide Side Nav`}</div>
                    </SideNav.Link>
                ) : (
                    <SideNav.Link action={'show'}>
                        <div>{`Show Side Nav`}</div>
                    </SideNav.Link>
                )
            }
        </SideNav uncontrolled>

    </Root>
);
```
