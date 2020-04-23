import React from 'react';
import {ExampleState} from './state';

const exampleState = new ExampleState(true);

export default {
    exampleState: React.createContext(exampleState)
};
