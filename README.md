# Beano

[![bundlephobia size](https://badgen.net/bundlephobia/minzip/beano)](https://bundlephobia.com/result?p=beano)


A [Pino](https://github.com/pinojs/pino) inspired logger for the Browser.

Visit the [Playground](https://erhathaway.github.io/beano/)

> Why?

The [console log Web API](https://developer.mozilla.org/en-US/docs/Web/API/Console/log) supports `grouping` log statements into nested groups. Few browser compatible loggers support this at the moment. `Beano` takes advantage of log groups to add support for child loggers - a feature that many backend loggers support. Child loggers are nice to have when developing modules or handling code that has nested scope.

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
const evenMoreChildrenLogger = childLogger.child({collapse: true}, 'my_sub_module');

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

## Usage in modules and packages

Beano helps you scope logging that happens in third party contexts, which makes logs more readable. Simply expose an optional `logger` attribute in your package or module's interface. 

For example, say you published the following component
```
const MyPublishedComponent = ({logger}) => {
    const l = logger && logger.child('MyPublishedComponent');
    
    useEffect(() => {
        l && l.debug('Running effect')
        ...some effect
    }
    
    if (...some predicate) {
        l && l.warn('Some state noticed')
    }
    
    return (
        <h1>Hi</h1>
    )
}
```

Now when users consume it in their app, they can get logs from the external context scoped to their current context.

```shell
[current scopes]
    MyPublishedComponent
        > Running effect
        > Some state noticed

```

## API

You can customize behavior by passing options to the merge object at any time!

Options:

| name           | type    | purpose                                                                                 |
| -------------- | ------- | --------------------------------------------------------------------------------------- |
| collapse       | boolean | Whether to use `console.group` or `console.groupCollapsed` for the current child scope. |
| groupByMessage | boolean | Whether to try and group sequential messages into the same group if they belong.        |

