import React, {useContext, useEffect} from 'react';
import styled from 'styled-components';
import context from '../../context';
import {observer} from 'mobx-react';
import anime from 'animejs';

const ExampleFeature = styled.div`
    height: 300px;
    width: 600px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    box-shadow: rgba(0, 0, 0, 0.16) 0px 5px 40px;
    border: 1px solid #dedede;
    border: 1px solid black;
    cursor: pointer;
`;

export default observer(() => {
    useEffect(() => {
        anime({
            targets: '#example-feature-animation',
            translateX: [1000, 0],
            opacity: [0, 1],
            duration: 12000
        });
    }, []);

    const {someAttribute, toggleAttributeState} = useContext(context.exampleState);
    return (
        <ExampleFeature id="example-feature-animation" onClick={toggleAttributeState}>
            My State is: {someAttribute ? 'TRUE' : 'FALSE'}
        </ExampleFeature>
    );
});
