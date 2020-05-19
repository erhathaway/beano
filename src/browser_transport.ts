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
export const createBrowserTransport = (): Transport => {
    let previousScopes: Scope[] = [];
    return (level, mergingObject, message) => {
        const log: Console = console;

        // if we have previous scopes we were grouping on, but we are no longer grouping, we need to back out of the groups
        if (previousScopes.length > 0 && mergingObject && mergingObject.groupByMessage === false) {
            previousScopes.forEach(console.groupEnd);
        }
        const calculateScopesToGroupOn =
            mergingObject && mergingObject.groupByMessage !== false
                ? calculateScopes(previousScopes, mergingObject.scopes || [])
                : mergingObject.scopes || [];
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

        scopeControl.begin.forEach(f => f());
        const newMergingObject = extractOptionsFromMergingObject({
            ...scopeControl.mergingObject,
            ...mergingObject
        });

        // do the actual logging
        newMergingObject
            ? message
                ? log[level](message, newMergingObject)
                : log[level](newMergingObject)
            : message
            ? log[level](message)
            : noop;

        if (mergingObject && mergingObject.groupByMessage === false) {
            scopeControl.end.forEach(f => f());
        }

        // if we are grouping by messages save the scopes
        previousScopes =
            mergingObject.groupByMessage !== false && mergingObject.scopes
                ? [...mergingObject.scopes]
                : [];
    };
};

// create a singleton so there is one browser transport
export const browserTransport = createBrowserTransport();
