import React from 'react';
import styled from 'styled-components';
import {createRouterComponents} from '../router';
import {statePredicates} from 'router-primitives';
import anime from 'animejs';
import Animateable from '../animateable';
import Animate from '../animate';
import {Manager, IRouterDeclaration, IRouterTemplates} from 'router-primitives';
import predicates from '../predicates';
import {AnimationCtx, AnimationResult} from '../types';

const routerDeclaration: IRouterDeclaration<{}> = {
    name: 'root',
    children: {
        scene: [
            {name: 'native'},
            {
                name: 'router-primitives',
                defaultAction: ['show'],
                children: {
                    scene: [
                        {
                            name: 'sun',
                            children: {feature: [{name: 'river', defaultAction: ['show']}]}
                        },
                        {
                            name: 'moon',
                            defaultAction: ['show'],
                            children: {
                                feature: [
                                    {
                                        name: 'rocket',
                                        defaultAction: ['show'],
                                        children: {
                                            feature: [{name: 'engine', defaultAction: ['show']}]
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                    feature: [{name: 'trees'}, {name: 'mountains'}]
                }
            }
        ]
    }
};

// let manager: Manager<IRouterTemplates<unknown>>;

// try {
const manager = new Manager({routerDeclaration}) as Manager<IRouterTemplates<unknown>>;
// } catch (e) {
//     console.log(e);
// }

const routers = manager.routers;
const routerComponents = createRouterComponents(routers as any);

const MoonScene = routerComponents['moon'];
const EngineFeature = routerComponents['engine'];
const RocketFeature = routerComponents['rocket'];
const SunScene = routerComponents['sun'];
const RouterPrimitives = routerComponents['router-primitives'];
const Native = routerComponents['native'];

const RootLayoutContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: absolute;
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    margin: 40px;
    overflow: hidden;
`;

const Button = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    border: 1px solid black;
    border-radius: 10px;
    background-color: #fff9e1;
    margin: 10px;
`;

const AnimationsController = styled.div`
    position: relative;
    display: flex;
`;

const RouterPrimitiveAnimationsControl = styled.div`
    display: flex;
`;

const AnimateableMoon = styled(Animateable)`
    position: relative;
    display: flex;
    height: 200px
    width: 200px;
    border-radius: 50%;
    background-color: blue;
`;

const AnimateableNative = styled(Animateable)`
    position: relative;
    display: flex;
    height: 200px
    width: 200px;
    border-radius: 50%;
    background-color: yellow;
`;

const AnimateableRocket = styled(Animateable)`
    position: absolute;
    width: 200;
    background-color: green;
`;

const AnimateableNativeContainer = styled(Animateable)``;

const AnimateableSun = styled.div`
    position: absolute;
    height: 100;
    width: 200;
    border-radius: 50%;
    background-color: yellow;
`;

const animateJustShown = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, 200],
        opacity: [0, 1],
        scale: [0, 1],
        duration: 550
    });

const animateJustHidden = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: [200, 400],
        translateY: [0, 500],
        opacity: [1, 0],
        scale: [1, 0.2],
        easing: 'linear',
        duration: 5000
    });

const animateNativeJustShown = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, 200],
        opacity: [0, 1],
        scale: [0, 1],
        duration: 850
    });

const animateNativeJustHidden = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: [200, 400],
        translateY: [0, 500],
        opacity: [1, 0],
        scale: [1, 0.2],
        easing: 'linear',
        duration: 800
    });

const animateRocketJustShown = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: ['0px', '100px'],
        duration: 500
    });

const animateEngineJustShown = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: ['0px', '100px'],
        duration: 200
    });

const animateRocketJustHidden = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, 400],
        translateY: [0, 400],
        opacity: [1, 0],
        scale: [1, 0.2],
        easing: 'linear',
        duration: 300
    });

const animateSceneIn = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: ['-300%', 0],
        scale: [0.5, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'linear'
    });

const animateSceneOut = (ctx: AnimationCtx): AnimationResult =>
    anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, '300%'],
        position: 'fixed',
        scale: [1, 0],
        duration: 5000
    });

const {isJustHidden, isJustShown} = statePredicates;

const VisibleToggle: React.FC<{
    children: (args: {isVisible: boolean; toggleVisible: () => void}) => React.ReactElement; //JSX.Element[] | React.ReactElement | React.ReactChild; //React.ReactChildren; // | React.ReactElement | null | undefined;
}> = ({children}) => {
    const [isVisible, setVisible] = React.useState<boolean>(true);

    const toggleVisible = (): void => {
        setVisible(state => !state);
    };
    return children({toggleVisible, isVisible});
};

const Root = (): JSX.Element => {
    return (
        <RootLayoutContainer>
            <AnimationsController>
                <Native.Link action={'show'}>
                    <Button>{'Show Native Animations'}</Button>
                </Native.Link>
                <RouterPrimitives.Link action={'show'}>
                    <Button id="123">{'Show Router Primitive Animations'}</Button>
                </RouterPrimitives.Link>
            </AnimationsController>
            <Native.Animate
                unMountOnHide
                exitAfterChildFinish={['1']}
                when={[
                    [isJustShown, animateSceneIn],
                    [isJustHidden, animateSceneOut]
                ]}
            >
                <AnimateableNativeContainer>
                    {animationBinding => (
                        <>
                            <VisibleToggle>
                                {({isVisible: isVisibleOne, toggleVisible: toggleVisibleOne}) => (
                                    <VisibleToggle>
                                        {({
                                            isVisible: isVisibleTwo,
                                            toggleVisible: toggleVisibleTwo
                                        }) => (
                                            <>
                                                <Button
                                                    onClick={toggleVisibleOne}
                                                >{`toggle native - ${isVisibleOne}`}</Button>

                                                <Button
                                                    onClick={toggleVisibleTwo}
                                                >{`toggle inside - ${isVisibleTwo}`}</Button>
                                                <Animate
                                                    enterAfterParentFinish
                                                    animationBinding={animationBinding}
                                                    name={'native'}
                                                    visible={isVisibleOne}
                                                    exitAfterChildFinish={['inside']}
                                                    when={[
                                                        [
                                                            predicates.isVisible,
                                                            animateNativeJustShown
                                                        ],
                                                        [
                                                            predicates.isHidden,
                                                            animateNativeJustHidden
                                                        ]
                                                    ]}
                                                >
                                                    <AnimateableNative>
                                                        {nativeAnimationBinding => (
                                                            <div>
                                                                {'engine'}
                                                                <div>{'world'}</div>
                                                                <Animate
                                                                    id={'inside'}
                                                                    name={'inside'}
                                                                    visible={isVisibleTwo}
                                                                    enterAfterParentFinish
                                                                    animationBinding={
                                                                        nativeAnimationBinding
                                                                    }
                                                                    when={[
                                                                        [
                                                                            predicates.isVisible,
                                                                            animateNativeJustShown
                                                                        ],
                                                                        [
                                                                            predicates.isHidden,
                                                                            animateNativeJustHidden
                                                                        ]
                                                                    ]}
                                                                >
                                                                    <AnimateableNative>
                                                                        {() => (
                                                                            <div>
                                                                                {'engine'}
                                                                                <div>{'world'}</div>
                                                                            </div>
                                                                        )}
                                                                    </AnimateableNative>
                                                                </Animate>
                                                            </div>
                                                        )}
                                                    </AnimateableNative>
                                                </Animate>
                                            </>
                                        )}
                                    </VisibleToggle>
                                )}
                            </VisibleToggle>
                            {'hello'}
                        </>
                    )}
                </AnimateableNativeContainer>
            </Native.Animate>
            <RouterPrimitives.Animate
                unMountOnHide
                exitAfterChildFinish={['1']}
                when={[
                    [isJustShown, animateSceneIn],
                    [isJustHidden, animateSceneOut]
                ]}
            >
                <Animateable>
                    {routerPrimitivesAnimationBinding => (
                        <>
                            <MoonScene.Animate
                                animationBinding={routerPrimitivesAnimationBinding}
                                enterAfterParentFinish
                                unMountOnHide
                                exitAfterChildFinish={['1']}
                                when={[
                                    [isJustShown, animateJustShown],
                                    [isJustHidden, animateJustHidden]
                                ]}
                            >
                                <AnimateableMoon>
                                    {animationBinding => (
                                        <>
                                            {'moon'}
                                            <MoonScene.Link action={'hide'}>
                                                <Button id="123">{'Hide moon'}</Button>
                                            </MoonScene.Link>
                                            <SunScene.Link action={'show'}>
                                                <Button>{'Show Sun'}</Button>
                                            </SunScene.Link>
                                            <RocketFeature.Link action={'show'}>
                                                <Button>{'Show rocket'}</Button>
                                            </RocketFeature.Link>
                                            <EngineFeature.Link action={'show'}>
                                                <Button>{'Show engine'}</Button>
                                            </EngineFeature.Link>
                                            <RocketFeature.Animate
                                                id={'1'}
                                                enterAfterParentFinish
                                                exitAfterChildFinish={['2']}
                                                animationBinding={animationBinding}
                                                unMountOnHide
                                                when={[
                                                    [isJustShown, animateRocketJustShown],
                                                    [isJustHidden, animateRocketJustHidden]
                                                ]}
                                            >
                                                <AnimateableRocket>
                                                    {rocketAnimationBinding => (
                                                        <>
                                                            {'rocket'}
                                                            <RocketFeature.Link action={'hide'}>
                                                                <Button id="123">
                                                                    {'Hide rocket'}
                                                                </Button>
                                                            </RocketFeature.Link>
                                                            <EngineFeature.Animate
                                                                id={'2'}
                                                                enterAfterParentFinish
                                                                animationBinding={
                                                                    rocketAnimationBinding
                                                                }
                                                                unMountOnHide
                                                                when={[
                                                                    [
                                                                        isJustShown,
                                                                        animateEngineJustShown
                                                                    ],
                                                                    [
                                                                        isJustHidden,
                                                                        animateRocketJustHidden
                                                                    ]
                                                                ]}
                                                            >
                                                                <AnimateableRocket>
                                                                    {() => (
                                                                        <>
                                                                            {'engine'}
                                                                            <EngineFeature.Link
                                                                                action={'hide'}
                                                                            >
                                                                                <Button id="123">
                                                                                    {'Hide engine'}
                                                                                </Button>
                                                                            </EngineFeature.Link>
                                                                        </>
                                                                    )}
                                                                </AnimateableRocket>
                                                            </EngineFeature.Animate>
                                                        </>
                                                    )}
                                                </AnimateableRocket>
                                            </RocketFeature.Animate>
                                        </>
                                    )}
                                </AnimateableMoon>
                            </MoonScene.Animate>
                            <SunScene.Animate
                                unMountOnHide
                                when={[
                                    [isJustShown, animateJustShown],
                                    [isJustHidden, animateJustHidden]
                                ]}
                            >
                                <AnimateableSun>
                                    {'sun'}
                                    <SunScene.Link action={'hide'}>
                                        <Button>{'Hide Sun'}</Button>
                                    </SunScene.Link>
                                    <MoonScene.Link action={'show'}>
                                        <Button>{'Show Moon'}</Button>
                                    </MoonScene.Link>
                                </AnimateableSun>
                            </SunScene.Animate>
                            {'main'}
                            <RouterPrimitiveAnimationsControl>
                                <MoonScene.Link action={'show'}>
                                    <Button>{'Show Moon'}</Button>
                                </MoonScene.Link>
                                <SunScene.Link action={'show'}>
                                    <Button>{'Show Sun'}</Button>
                                </SunScene.Link>
                            </RouterPrimitiveAnimationsControl>
                        </>
                    )}
                </Animateable>
            </RouterPrimitives.Animate>
        </RootLayoutContainer>
    );
};

export default Root;
