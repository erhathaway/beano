import React from 'react';
import styled from 'styled-components';
import {ExampleFeature} from '../features';
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
    width: 200;
    background-color: blue;
`;

const AnimateableSun = styled.div`
    // position: absolute;
    height: 100;
    width: 200;
    background-color: yellow;
`;

const animateJustShown = (ctx: AnimationCtx): void => {
    const animation = anime({
        targets: `#${ctx.id}`,
        translateX: [0, 200],
        opacity: [0, 100],
        scale: [0, 1]
    });
    ctx.finish.push(animation.finished);
};

const animateJustHidden = (ctx: AnimationCtx): void => {
    const animation = anime({
        targets: `#${ctx.id}`,
        translateX: [200, 400],
        opacity: [100, 0],
        scale: [1, 0.8],
        easing: 'linear',
        duration: 300
    });
    ctx.finish.push(animation.finished);
};

const {isJustHidden, isJustShown} = statePredicates;

const Root = (): JSX.Element => {
    return (
        <RootLayoutContainer>
            <MoonScene.Animate
                unMountOnHide
                when={[
                    [[isJustShown as any], animateJustShown],
                    [[isJustHidden as any], animateJustHidden]
                ]}
            >
                <AnimateableMoon>
                    {'moon'}
                    <MoonScene.Link action={'hide'}>
                        <Button id="123">{'Hide moon'}</Button>
                    </MoonScene.Link>
                    <SunScene.Link action={'show'}>
                        <Button>{'Show Sun'}</Button>
                    </SunScene.Link>
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
                    <MoonScene.Link action={'show'}>
                        <Button>{'Show Moon'}</Button>
                    </MoonScene.Link>
                    <SunScene.Link action={'hide'}>
                        <Button>{'Hide Sun'}</Button>
                    </SunScene.Link>
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
