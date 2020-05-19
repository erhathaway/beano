import React from 'react';
import styled from 'styled-components';
import SyntaxHighlighter from 'react-syntax-highlighter';
import {docco} from 'react-syntax-highlighter/dist/esm/styles/hljs';

const codeString = '(num) => num + 1';

const Container = styled.div`
    height: 100%;
    width: 100%;
    background-color: blue;
`;
const Layout = (): JSX.Element => {
    return (
        <Container>
            <SyntaxHighlighter language="javascript" style={docco}>
                {codeString}
            </SyntaxHighlighter>
        </Container>
    );
};
export default Layout;
