import {MergingObject, ILoggerOptions, Scope, Levels, Message, ILogger, Transport} from './types';
import transportCaller from './transport_caller';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};

export const logger = (
    paramOne?: MergingObject | Message,
    paramTwo?: Message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ILogger => {
    // extract existing scopes
    const oldScopes: Scope[] =
        paramOne && typeof paramOne !== 'string' && paramOne.scopes ? paramOne.scopes : [];

    // extract new mergeObject
    const newMergeObject: MergingObject = paramOne && typeof paramOne === 'object' ? paramOne : {};

    // extract new mergeObject
    const groupByMessage: ILoggerOptions['groupByMessage'] =
        paramOne && typeof paramOne === 'object' && paramOne.groupByMessage !== undefined
            ? paramOne.groupByMessage
            : false;

    // extract message
    const message: Message =
        paramOne && typeof paramOne === 'object' && paramTwo && typeof paramTwo === 'string'
            ? paramTwo
            : undefined;

    const newScope: Scope = {message, mergingObject: newMergeObject};
    const newScopes: Scope[] = [...oldScopes, newScope];

    // extract existing log level
    const level: Levels =
        paramOne && typeof paramOne !== 'string' && paramOne.level ? paramOne.level : 'info';

    // extract existing transports
    const transports: Transport[] | undefined =
        paramOne && typeof paramOne !== 'string' && paramOne.transports
            ? paramOne.transports
            : undefined;
    if (transports === undefined) {
        throw new Error(
            'You must define an initial logger transport. For instance `logger({transports: browserTransport})`'
        );
    }

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
                    ...logger(existingMergeObj, childParamOne)
                };
            } else if (typeof childParamOne === 'object') {
                const childMergeObj = {
                    ...existingMergeObj,
                    ...childParamOne
                };
                return {
                    ...logger(childMergeObj, childParamTwo)
                };
            } else {
                // TODO add better error handling around possible abuse
                throw new Error('Invalid call');
            }
        },
        // parent: () => {
        //     const parentScopes = newScopes.length > 1 ? newScopes.slice(0, -1) : newScopes;
        //     const parentMergeObj = {
        //         ...existingMergeObj,
        //         scopes: parentScopes
        //     };
        //     const parentScope = parentScopes[parentScopes.length - 1];
        //     const parentMessage = parentScope.message;
        //     return {
        //         ...createLogger(parentMergeObj, parentMessage)
        //     };
        // },
        info: ['info', 'warn', 'debug', 'error'].includes(level)
            ? transportCaller('info', existingMergeObj)
            : noop,
        warn: ['warn', 'debug', 'error'].includes(level)
            ? transportCaller('warn', existingMergeObj)
            : noop,
        debug: ['debug', 'error'].includes(level)
            ? transportCaller('debug', existingMergeObj)
            : noop,
        error: ['error'].includes(level) ? transportCaller('error', existingMergeObj) : noop
    };
};

export default logger;
