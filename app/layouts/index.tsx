import React from 'react';
import styled from 'styled-components';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {qtcreatorDark} from 'react-syntax-highlighter/dist/esm/styles/hljs';
import logger from '../../src';
const Container = styled.div`
    height: 100vh;
    width: 100vw;
    background-color: blue;
    overflow-y: scroll;
    font-family: 'Space Mono', monospace;
`;

const Header = styled.div`
    color: yellow;
    padding: 60px;
`;

const HowTo = styled.div`
    border: 1px solid black;
    border-radius: 7px;
    padding: 20px;
    color: white;
    width: 800px;
`;

const Section = styled.div`
    margin-top: -10px;
    padding: 40px;
    width: 1000px;
`;

const SectionTitle = styled.div`
    display: flex;
    justify-content: space-between;
    color: white;
`;

const Run = styled.div`
    display: flex;
    align-items: center;
    border: 1px solid green;
    padding: 0px 10px 0px 10px;
    border-radius: 5px;
`;

const RunArrow = styled.div`
    margin-left: 10px;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 10px 0 10px 15px;
    border-color: transparent transparent transparent green;
`;

const childLogger = logger.child('my_module');
const evenMoreChildrenLogger = childLogger.child('my_sub_module');

const SECTIONS = [
    {
        title: 'Install',
        highlight: `import logger from 'beano';`
    },
    {
        title: 'Start logging',
        highlight: `logger.info({groupByMessage: true}, 'look at me!')`,
        code: () => logger.info({groupByMessage: true}, 'look at me!')
    },
    {
        title: 'Create a child logger',
        highlight: `const childLogger = logger.child('my_module');`
    },
    {
        title: 'Pass messages to the child logger',
        highlight: `childLogger.info({muyBeano: true}, 'is right');`,
        code: () => {
            childLogger.info({muyBeano: true}, 'is right');
        }
    },
    {
        title: 'Pass another message to the child logger',
        highlight: `childLogger.debug('something doesnt seem right...');`,
        code: () => {
            childLogger.debug('something doesnt seem right...');
        }
    },
    {
        title: 'Create a child logger from a child logger',
        highlight: `const evenMoreChildrenLogger = childLogger.child('my_sub_module');`
    },
    {
        title: 'Pass messages to the double nested child logger',
        highlight: `evenMoreChildrenLogger.info('im a double nested log message')`,
        code: () => evenMoreChildrenLogger.info('im a double nested log message')
    }
];
const Layout = (): JSX.Element => {
    return (
        <Container>
            <Header>
                <h1>Beano</h1>
                <h3>A Pino inspired logger for the browser</h3>
                <HowTo>
                    <h4>Open the browser console to see the results of running the logger!</h4>
                </HowTo>
            </Header>

            {SECTIONS.map((s, i) => (
                <Section key={i}>
                    <SectionTitle>
                        <h3>{s.title}</h3>
                        {s.code && (
                            <Run onClick={s.code}>
                                <h4>Run</h4>
                                <RunArrow />
                            </Run>
                        )}
                    </SectionTitle>
                    <SyntaxHighlighter language="javascript" style={qtcreatorDark}>
                        {s.highlight}
                    </SyntaxHighlighter>
                </Section>
            ))}
        </Container>
    );
};
export default Layout;
