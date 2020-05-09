import React from 'react';
import styled from 'styled-components';
import {AnimationCtx, createRouterComponents} from '../router';
import {statePredicates} from 'router-primitives';
import anime from 'animejs';
import Animateable from '../animateable';
import {Manager, IRouterDeclaration, IRouterTemplates} from 'router-primitives';

// const rocketFeatures = [{name: 'engine'}];
// const moonFeatures = [{name: 'rocket', children: {feature: rocketFeatures}}];
// const sunFeatures = [{name: 'river', defaultAction: ['show']} as IRouterDeclaration<any>];

const routerDeclaration: IRouterDeclaration<any> = {
    name: 'root',
    children: {
        scene: [
            {name: 'native'},
            {
                name: 'router-primitives',
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
                                feature: [{name: 'rocket', children: {feature: [{name: 'engine'}]}}]
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
const routerComponents = createRouterComponents(routers);

const RootLayoutContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: absolute;
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    margin: 40px;
    overflow: hidden;
`;

const MoonScene = routerComponents['moon'];
const EngineFeature = routerComponents['engine'];

const RocketFeature = routerComponents['rocket'];

const SunScene = routerComponents['sun'];
const RouterPrimitives = routerComponents['router-primitives'];
const Native = routerComponents['native'];

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
    // background-color: gray;
    display: flex;
`;
const RouterPrimitiveAnimations = styled(RouterPrimitives)`
    position: relative;
    // background-color: orange;
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

const AnimateableRocket = styled(Animateable)`
    position: absolute;

    width: 200;
    background-color: green;
`;

const AnimateableSun = styled.div`
    position: absolute;
    height: 100;
    width: 200;
    border-radius: 50%;
    background-color: yellow;
`;

const animateJustShown = (ctx: AnimationCtx): void => {
    console.log('oh hi', '$$$$$$$$', ctx.node.id);

    const animation = anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, 200],
        opacity: [0, 1],
        scale: [0, 1],
        duration: 550
    });
    ctx.finish.push(animation.finished);
};

const animateJustHidden = (ctx: AnimationCtx): void => {
    console.log('oh hi', '$$$$$$$$', ctx.node.id);
    // const changeBegan = 0;
    // const changeCompleted = 0;

    const animation = anime({
        targets: `#${ctx.node.id}`,
        // translateX: [0, 200],
        // opacity: [0, 1],
        // scale: [0, 1]
        // duration: 500
        translateX: [200, 400],
        translateY: [0, 500],
        opacity: [1, 0],
        scale: [1, 0.2],
        easing: 'linear',
        duration: 5000
        // backgroundColor: ['hsl(250, 75%, 50%)', 'hsl(200, 50%, 50%)']
        // update: function(anim) {
        //     changeBegan++;
        //     console.log('%%%%%% change began : ' + changeBegan);
        // },
        // changeBegin: function(anim) {
        //     changeCompleted++;
        //     console.log('change completed : ' + changeCompleted);
        // },
        // delay: 4000
    });
    // setTimeout(() => {
    //     // animation.pause();
    //     anime.remove(`#${ctx.node.id}`);
    // }, 500);
    ctx.finish.push(animation.finished);
};

const animateRocketJustShown = (ctx: AnimationCtx): void => {
    console.log('oh hi', '$$$$$$$$', ctx.node.id);

    const animation = anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, 100],

        // opacity: [0, 1],
        // scale: [0, 1],
        duration: 500
        // delay: 500
    });
    ctx.finish.push(animation.finished);
};

const animateRocketJustHidden = (ctx: AnimationCtx): void => {
    console.log('oh hi', '$$$$$$$$', ctx.node.id);
    const animation = anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, 400],
        translateY: [0, 400],

        opacity: [1, 0],
        scale: [1, 0.2],
        easing: 'linear',
        duration: 300
    });
    ctx.finish.push(animation.finished);
};

const {isJustHidden, isJustShown} = statePredicates;

const Root = (): JSX.Element => {
    return (
        <RootLayoutContainer>
            <AnimationsController>
                <RouterPrimitives.Link action={'show'}>
                    <Button id="123">{'Show Router Primitive Animations'}</Button>
                </RouterPrimitives.Link>
                <Native.Link action={'show'}>
                    <Button>{'Show Native Animations'}</Button>
                </Native.Link>
            </AnimationsController>
            <RouterPrimitiveAnimations>
                <MoonScene.Animate
                    unMountOnHide
                    exitAfterChildFinish={['1']}
                    when={[
                        [[isJustShown], animateJustShown],
                        [[isJustHidden as any], animateJustHidden]
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
                                        [[isJustShown as any], animateRocketJustShown],
                                        [[isJustHidden as any], animateRocketJustHidden]
                                    ]}
                                >
                                    <AnimateableRocket>
                                        {rocketAnimationBinding => (
                                            <>
                                                {'rocket'}
                                                <RocketFeature.Link action={'hide'}>
                                                    <Button id="123">{'Hide rocket'}</Button>
                                                </RocketFeature.Link>
                                                <EngineFeature.Animate
                                                    id={'2'}
                                                    enterAfterParentFinish
                                                    animationBinding={rocketAnimationBinding}
                                                    unMountOnHide
                                                    when={[
                                                        [
                                                            [isJustShown as any],
                                                            animateRocketJustShown
                                                        ],
                                                        [
                                                            [isJustHidden as any],
                                                            animateRocketJustHidden
                                                        ]
                                                    ]}
                                                >
                                                    <AnimateableRocket>
                                                        {() => (
                                                            <>
                                                                {'engine'}
                                                                <EngineFeature.Link action={'hide'}>
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
                        [[isJustShown as any], animateJustShown],
                        [[isJustHidden as any], animateJustHidden]
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
            </RouterPrimitiveAnimations>
        </RootLayoutContainer>
    );
};

export default Root;
