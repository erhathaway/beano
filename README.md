# Beano

[![bundlephobia size](https://badgen.net/bundlephobia/minzip/beano)](https://bundlephobia.com/result?p=beano)


A [Pino](https://github.com/pinojs/pino) inspired logger for the Browser.

## Usage

```typescript
import logger from 'beano';

// start logging with no initialization
// pass a message string or mergeObject as the first param
// if a mergeObject is the first param, you can pass the message string as the second param
logger.info({groupByMessage: true}, 'look at me!');

// create chilren from a logger
const childLogger = logger.child('my_module');

// pass a message string or merge object as the first param (like before!)
childLogger.info({muyBeano: true}, 'is right');
childLogger.debug('something doesnt seem right...');

// create a child logger from a child logger
evenMoreChildrenLogger = childLogger.child({collapse: true}, 'my_sub_module');

// use debug, info, warn, error level
evenMoreChildrenLogger.warn('im a nested logger');


logger.info('starting over');
eventMoreChildrenLogger.error('or not');
```

The browser terminal output would look like:
```bash
> look at me
my_module
    > is right {muyBeano: true}
    > something doesnt seem right...
    my_sub_module
        > im a nested logger
> starting over
my_module
    my_sub_module
        > or not
```

## API

You can customize behavior by passing options to the merge object at any time!

Options:

|name|type|purpose|
|-|-|-|
| collapse | boolean | Whether to use `console.group` or `console.groupCollapsed` for the current child scope. |
| groupByMessage | boolean | Whether to try and group sequential messages into the same group if they belong. |

   
