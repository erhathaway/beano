import React from 'react';
import styled from 'styled-components';
import {ExampleFeature} from '../features';
import {routerComponents} from '../router';

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

const Root = (): JSX.Element => {
    return (
        <RootLayoutContainer>
            <ExampleFeature />
            <MoonScene>
                {'moon'}
                <MoonScene.Link action={'hide'}>
                    <Button id="123">{'Hide moon'}</Button>
                </MoonScene.Link>
                <SunScene.Link action={'show'}>
                    <Button>{'Show Sun'}</Button>
                </SunScene.Link>
            </MoonScene>
            <SunScene>
                {'sun'}
                <MoonScene.Link action={'show'}>
                    <Button>{'Show Moon'}</Button>
                </MoonScene.Link>
                <SunScene.Link action={'hide'}>
                    <Button>{'Hide Sun'}</Button>
                </SunScene.Link>
            </SunScene>
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
