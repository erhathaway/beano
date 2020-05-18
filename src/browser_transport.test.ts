import {calculateScopes} from './browser_transport';
import {Message, Scope} from './types';

declare const console: Console & {groupEnd: jest.Mock};

const createScopesFromMessages = (messages: Message[]): Scope[] => {
    return messages.map(m => ({message: m}));
};

describe('browserTransport', () => {
    let trueConsoleGroupEnd: typeof console['groupEnd'];
    beforeEach(() => {
        trueConsoleGroupEnd = console.groupEnd;
        console.groupEnd = jest.fn();
    });
    afterEach(() => {
        console.group = trueConsoleGroupEnd;
    });
    describe('calculateScopes', () => {
        it('returns correct scopes when there are no old scopes', () => {
            const oldScopes = [] as Scope[];
            const newScopes = createScopesFromMessages(['one', 'two', 'three']);

            expect(calculateScopes(oldScopes, newScopes)).toEqual(newScopes);
            expect(console.groupEnd.mock.calls).toHaveLength(0);
        });
        it('returns correct scopes when old and new scopes are the same', () => {
            const newScopes = createScopesFromMessages(['one', 'two', 'three']);

            expect(calculateScopes(newScopes, newScopes)).toEqual([]);
            expect(calculateScopes([], [])).toEqual([]);
            expect(console.groupEnd.mock.calls).toHaveLength(0);
        });
        describe('scope differences', () => {
            describe('more old scopes', () => {
                it('returns correct scopes when half the scopes overlap', () => {
                    const oldScopes = createScopesFromMessages(['one', 'two', 'three', 'four']);
                    const newScopes = createScopesFromMessages(['one', 'two', 'five', 'six']);

                    expect(calculateScopes(oldScopes, newScopes)).toEqual(
                        createScopesFromMessages(['five', 'six'])
                    );
                    expect(console.groupEnd.mock.calls).toHaveLength(2);
                });
                it('returns correct scopes when there is no overlap', () => {
                    const oldScopes = createScopesFromMessages(['one', 'two', 'three', 'four']);
                    const newScopes = createScopesFromMessages(['five', 'six', 'seven']);

                    expect(calculateScopes(oldScopes, newScopes)).toEqual(newScopes);
                    expect(console.groupEnd.mock.calls).toHaveLength(4);
                });
                it('returns correct scopes when there are no new scopes', () => {
                    const oldScopes = createScopesFromMessages(['one', 'two', 'three', 'four']);
                    const newScopes = createScopesFromMessages([]);

                    expect(calculateScopes(oldScopes, newScopes)).toEqual(
                        createScopesFromMessages([])
                    );
                    expect(console.groupEnd.mock.calls).toHaveLength(4);
                });
            });
            describe('more new scopes', () => {
                it('returns correct scopes when half the scopes overlap', () => {
                    const oldScopes = createScopesFromMessages(['one', 'two', 'five']);
                    const newScopes = createScopesFromMessages(['one', 'two', 'three', 'four']);

                    expect(calculateScopes(oldScopes, newScopes)).toEqual(
                        createScopesFromMessages(['three', 'four'])
                    );
                    expect(console.groupEnd.mock.calls).toHaveLength(1);
                });
                it('returns correct scopes when there is no overlap', () => {
                    const oldScopes = createScopesFromMessages(['five', 'six', 'seven']);
                    const newScopes = createScopesFromMessages(['one', 'two', 'three', 'four']);

                    expect(calculateScopes(oldScopes, newScopes)).toEqual(newScopes);
                    expect(console.groupEnd.mock.calls).toHaveLength(3);
                });
                it('returns correct scopes when there are no old scopes', () => {
                    const oldScopes = createScopesFromMessages([]);
                    const newScopes = createScopesFromMessages(['one', 'two', 'three', 'four']);

                    expect(calculateScopes(oldScopes, newScopes)).toEqual(newScopes);
                    expect(console.groupEnd.mock.calls).toHaveLength(0);
                });
            });
        });
    });
});
