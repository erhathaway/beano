import React from 'react';
import styled from 'styled-components';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {a11yDark} from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    background-color: blue;
    // margin: 1vh 1vw 1vh 1vw;
    overflow-y: scroll;
    font-family: 'Space Mono', monospace;
`;

const Header = styled.div`
    color: white;
    padding: 60px;
    // height: 100px;
    // width: 50%;
    // display: flex;
`;

const Section = styled.div`
    margin-top: -10px;
    padding: 40px;
`;

const SectionTitle = styled.div`
    color: green;
`;
const Layout = (): JSX.Element => {
    return (
        <Container>
            <Header>
                <h1>Beano</h1>
                <h3>A Pino inspired logger for the browser</h3>
            </Header>

            <Section>
                <SectionTitle>
                    <h3>Install</h3>
                </SectionTitle>
                <SyntaxHighlighter language="javascript" style={a11yDark}>
                    {`import logger from 'beano';`}
                </SyntaxHighlighter>
            </Section>

            <Section>
                <SectionTitle>
                    <h3>Start logging</h3>
                </SectionTitle>
                <SyntaxHighlighter language="javascript" style={a11yDark}>
                    {`logger.info({groupByMessage: true}, 'look at me!');`}
                </SyntaxHighlighter>
            </Section>
        </Container>
    );
};
export default Layout;
