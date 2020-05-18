import {
    ILoggerConfig,
    ILoggerOptions,
    MergingObject,
    Scope,
    Console,
    ScopeReducerAcc,
    Transport
} from './types';

import {noop} from './logger';

export const extractOptionsFromMergingObject = (
    mergingObject: MergingObject
): Omit<MergingObject, keyof ILoggerConfig & keyof ILoggerOptions> | undefined => {
    const newMergeObject = {...mergingObject};
    delete newMergeObject.scopes;
    delete newMergeObject.transports;
    delete newMergeObject.level;
    delete newMergeObject.collapse;
    delete newMergeObject.groupByMessage;

    return Object.keys(newMergeObject).length > 0 ? newMergeObject : undefined;
};

export const calculateScopes = (oldScopes: Scope[], newScopes: Scope[] = []): Scope[] => {
    let diffScopes: Scope[] = [];
    if (oldScopes.length >= newScopes.length) {
        for (const [index, oldScope] of oldScopes.entries()) {
            const remainingScopes = oldScopes.length - index;

            // If old scopes have groups that the new scopes don't have, we need to end these groups
            if (newScopes[index] === undefined || oldScope.message !== newScopes[index].message) {
                Array.from(Array(remainingScopes)).forEach(() => {
                    console.groupEnd();
                });
                // Add the remaining scopes so that groups can be made for these
                diffScopes = newScopes.slice(index, newScopes.length);
                break;
            }
        }
    } else {
        for (const [index, newScope] of newScopes.entries()) {
            const remainingScopes = oldScopes.length - index;

            // If old scopes have groups that the new scopes don't have, we need to end these groups
            if (oldScopes[index] === undefined || newScope.message !== oldScopes[index].message) {
                Array.from(Array(remainingScopes)).forEach(() => {
                    console.groupEnd();
                });
                // Add the remaining scopes so that groups can be made for these
                diffScopes = newScopes.slice(index, newScopes.length);
                break;
            }
        }
    }
    return diffScopes;
};
export const browserTransport = (): Transport => {
    let previousScopes: Scope[] = [];
    return (level, mergingObject, message) => {
        const log: Console = console;
        if (mergingObject.scopes === undefined) {
            throw new Error('Missing scopes');
        }
        const calculateScopesToGroupOn =
            mergingObject && mergingObject.groupByMessage === true
                ? calculateScopes(previousScopes, mergingObject.scopes)
                : mergingObject.scopes;
        const scopeControl = calculateScopesToGroupOn.reduce(
            (acc, s) => {
                acc.begin.push(() => {
                    s.mergingObject && s.mergingObject.collapse
                        ? console.groupCollapsed(s.message)
                        : console.group(s.message);
                });
                acc.end.push(() => {
                    console.groupEnd();
                });
                return {...acc, mergingObject: {...acc.mergingObject, ...s.mergingObject}};
            },
            {begin: [], end: [], mergingObject: {}} as ScopeReducerAcc
        );

        scopeControl.begin.forEach((f) => f());
        const newMergingObject = extractOptionsFromMergingObject({
            ...scopeControl.mergingObject,
            ...mergingObject
        });

        newMergingObject
            ? message
                ? log[level](message, newMergingObject)
                : log[level](newMergingObject)
            : message
            ? log[level](message)
            : noop;

        if (mergingObject && mergingObject.groupByMessage === false) {
            scopeControl.end.forEach((f) => f());
        }
        previousScopes = [...mergingObject.scopes];
    };
};
