import React from 'react';
import styled from 'styled-components';
import {routerComponents, AnimationCtx, Animateable} from '../router';
import {statePredicates} from 'router-primitives';
import anime from 'animejs';

const RootLayoutContainer = styled.div`
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    margin: 40px;
    overflow: hidden;
`;

const MoonScene = routerComponents['moon'];
const RocketFeature = routerComponents['rocket'];

const SunScene = routerComponents['sun'];

const Button = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 30px;
    width: 100px;
    border: 1px solid black;
`;

const AnimateableMoon = styled(Animateable)`
    position: relative;
    display: flex;
    height: 200px
    // width: 200px;
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
    background-color: yellow;
`;

const animateJustShown = (ctx: AnimationCtx): void => {
    console.log('oh hi', '$$$$$$$$', ctx.node.id);

    const animation = anime({
        targets: `#${ctx.node.id}`,
        translateX: [0, 200],
        opacity: [0, 1],
        scale: [0, 1],
        duration: 1500
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
        duration: 5000
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
        duration: 3000
    });
    ctx.finish.push(animation.finished);
};

const {isJustHidden, isJustShown} = statePredicates;

const Root = (): JSX.Element => {
    return (
        <RootLayoutContainer>
            <MoonScene.Animate
                unMountOnHide
                exitAfterChildFinish
                when={[
                    [[isJustShown as any], animateJustShown],
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
                            <RocketFeature.Animate
                                enterAfterParentFinish
                                animationBinding={animationBinding}
                                unMountOnHide
                                when={[
                                    [[isJustShown as any], animateRocketJustShown],
                                    [[isJustHidden as any], animateRocketJustHidden]
                                ]}
                            >
                                <AnimateableRocket>
                                    {() => (
                                        <>
                                            {'rocket'}
                                            <RocketFeature.Link action={'hide'}>
                                                <Button id="123">{'Hide rocket'}</Button>
                                            </RocketFeature.Link>
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
            <MoonScene.Link action={'show'}>
                <Button>{'Show Moon'}</Button>
            </MoonScene.Link>
            <SunScene.Link action={'show'}>
                <Button>{'Show Sun'}</Button>
            </SunScene.Link>
        </RootLayoutContainer>
    );
};

export default Root;
