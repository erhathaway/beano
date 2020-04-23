import React from 'react';
import styled from 'styled-components';
import {ExampleFeature} from '../features';

const RootLayoutContainer = styled.div`
    width: calc(100% - 80px);
    height: calc(100% - 80px);
    margin: 40px;
    overflow: hidden;
`;

const Root = (): JSX.Element => {
    return (
        <RootLayoutContainer>
            <ExampleFeature />
        </RootLayoutContainer>
    );
};

export default Root;
