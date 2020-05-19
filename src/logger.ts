import {MergingObject, ILoggerOptions, Scope, Levels, Message, ILogger, Transport} from './types';
import transportCaller from './transport_caller';
import {browserTransport} from './browser_transport';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};

export const createLogger = (
    paramOne?: MergingObject | Message,
    paramTwo?: Message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ILogger => {
    // extract existing scopes
    const oldScopes: Scope[] =
        paramOne && typeof paramOne !== 'string' && paramOne.scopes ? paramOne.scopes : [];

    // extract existing transports
    const transports: Transport[] | undefined =
        paramOne && typeof paramOne !== 'string' && paramOne.transports
            ? paramOne.transports
            : [browserTransport];

    // extract new mergeObject
    const groupByMessage: ILoggerOptions['groupByMessage'] =
        paramOne && typeof paramOne === 'object' && paramOne.groupByMessage !== undefined
            ? paramOne.groupByMessage
            : true;

    // extract message
    const message: Message =
        paramOne && typeof paramOne === 'object' && paramTwo && typeof paramTwo === 'string'
            ? paramTwo
            : undefined;

    // extract new mergeObject
    const newMergeObject: MergingObject | undefined =
        paramOne && typeof paramOne === 'object' ? paramOne : undefined; // {transports, scopes: [], groupByMessage, message};

    const newScope: Scope | undefined = newMergeObject
        ? {message, mergingObject: newMergeObject}
        : undefined;
    const newScopes: Scope[] = newScope ? [...oldScopes, newScope] : [...oldScopes];

    // extract existing log level
    const level: Levels =
        paramOne && typeof paramOne !== 'string' && paramOne.level ? paramOne.level : 'info';

    // if (transports === undefined) {
    //     throw new Error(
    //         'You must define an initial logger transport. For instance `logger({transports: browserTransport})`'
    //     );
    // }

    // extract collapse
    const collapse: ILoggerOptions['collapse'] =
        paramOne && typeof paramOne !== 'string' && paramOne.collapse ? paramOne.collapse : false;

    const existingMergeObj: MergingObject = {
        level,
        transports,
        scopes: newScopes,
        collapse,
        groupByMessage
    };

    return {
        child: (childParamOne?: MergingObject | Message, childParamTwo?: Message) => {
            if (typeof childParamOne === 'string') {
                return {
                    ...createLogger(existingMergeObj, childParamOne)
                };
            } else if (typeof childParamOne === 'object') {
                const childMergeObj = {
                    ...existingMergeObj,
                    ...childParamOne
                };
                return {
                    ...createLogger(childMergeObj, childParamTwo)
                };
            } else {
                // TODO add better error handling around possible abuse
                throw new Error('Invalid call');
            }
        },
        trace: ['trace', 'debug', 'info', 'warn', 'error'].includes(level)
            ? transportCaller('trace', existingMergeObj)
            : noop,
        debug: ['debug', 'info', 'warn', 'error'].includes(level)
            ? transportCaller('debug', existingMergeObj)
            : noop,
        info: ['info', 'warn', 'error'].includes(level)
            ? transportCaller('info', existingMergeObj)
            : noop,
        warn: ['warn', 'error'].includes(level) ? transportCaller('warn', existingMergeObj) : noop,
        error: ['error'].includes(level) ? transportCaller('error', existingMergeObj) : noop,
        silent: noop
    };
};

export default createLogger();
