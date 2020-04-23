import React from 'react';
import styled from 'styled-components';
import {ExampleFeature} from '../features';
import {routerComponents} from '../router';
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

const Moon = styled.div`
    height: 100;
    width: 200;
    background-color: blue;
`;

const Sun = styled.div`
    height: 100;
    width: 200;
    background-color: yellow;
`;

const animateJustShown = (uuid: string): void => {
    anime({
        targets: `#${uuid}`,
        translateX: 200
    });
};

const animateJustHidden = (uuid: string): void => {
    anime({targets: `#${uuid}`, translateX: -250});
};

const {isJustHidden, isJustShown} = statePredicates;

const Root = (): JSX.Element => {
    return (
        <RootLayoutContainer>
            <ExampleFeature />
            <MoonScene.Animate
                when={[
                    [[isJustShown as any], animateJustShown],
                    [[isJustHidden as any], animateJustHidden]
                ]}
            >
                {({id}) => (
                    <Moon id={id}>
                        {'moon'}
                        <MoonScene.Link action={'hide'}>
                            <Button id="123">{'Hide moon'}</Button>
                        </MoonScene.Link>
                        <SunScene.Link action={'show'}>
                            <Button>{'Show Sun'}</Button>
                        </SunScene.Link>
                    </Moon>
                )}
            </MoonScene.Animate>
            <SunScene.Animate
                when={[
                    [[isJustShown as any], animateJustShown],
                    [[isJustHidden as any], animateJustHidden]
                ]}
            >
                {({id}) => (
                    <Sun id={id}>
                        {'sun'}
                        <MoonScene.Link action={'show'}>
                            <Button>{'Show Moon'}</Button>
                        </MoonScene.Link>
                        <SunScene.Link action={'hide'}>
                            <Button>{'Hide Sun'}</Button>
                        </SunScene.Link>
                    </Sun>
                )}
            </SunScene.Animate>
            {/* <SunScene>
                {'sun'}
                <MoonScene.Link action={'show'}>
                    <Button>{'Show Moon'}</Button>
                </MoonScene.Link>
                <SunScene.Link action={'hide'}>
                    <Button>{'Hide Sun'}</Button>
                </SunScene.Link>
            </SunScene> */}
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
