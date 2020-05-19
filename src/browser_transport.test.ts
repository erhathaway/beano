import {calculateScopes, createBrowserTransport} from './browser_transport';
import {Message, Scope, Transport} from './types';

declare const console: Console & {
    groupEnd: jest.Mock;
    groupCollapsed: jest.Mock;
    group: jest.Mock;
    info: jest.Mock;
};

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
        console.groupEnd = trueConsoleGroupEnd;
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
    describe('createBrowserTransport', () => {
        let browserTransport: Transport;
        beforeEach(() => {
            browserTransport = createBrowserTransport();
        });
        let trueConsoleGroupEnd: typeof console['groupEnd'];
        let trueConsoleGroupCollapsed: typeof console['groupCollapsed'];
        let trueConsoleGroup: typeof console['group'];
        let trueConsoleInfo: typeof console['info'];

        beforeEach(() => {
            jest.clearAllMocks();
            trueConsoleGroupEnd = console.groupEnd;
            trueConsoleGroupCollapsed = console.groupCollapsed;
            trueConsoleGroup = console.group;
            trueConsoleInfo = console.info;

            console.groupEnd = jest.fn();
            console.groupCollapsed = jest.fn();
            console.group = jest.fn();
            console.info = jest.fn();
        });
        afterEach(() => {
            console.groupEnd = trueConsoleGroupEnd;
            console.groupCollapsed = trueConsoleGroupCollapsed;
            console.group = trueConsoleGroup;
            console.info = trueConsoleInfo;
        });
        describe('options', () => {
            it('collapses groups when `collapse` option is used', () => {
                const eventOne = [
                    'info',
                    {
                        collapse: false, // <- ignores this. only collapses in the merging object for the scope are used
                        scopes: [
                            {mergingObject: {collapse: true}, message: 'a'},
                            {mergingObject: {collapse: false}, message: 'b'},
                            {mergingObject: {collapse: true}, message: 'c'}
                        ]
                    },
                    'one'
                ] as Parameters<Transport>;
                jest.clearAllMocks();
                browserTransport(...eventOne);

                expect(console.group.mock.calls).toHaveLength(1);
                expect(console.groupCollapsed.mock.calls).toHaveLength(2);
                expect(console.groupEnd.mock.calls).toHaveLength(0);
                expect(console.info.mock.calls).toHaveLength(1);
            });
        });
        describe('grouping with no scopes', () => {
            it('doesnt group by default', () => {
                const eventOne = ['info', {}, 'one'] as Parameters<Transport>;
                const eventTwo = ['info', {}, 'two'] as Parameters<Transport>;
                const eventThree = ['info', {}, 'three'] as Parameters<Transport>;

                jest.clearAllMocks();
                browserTransport(...eventOne);

                expect(console.group.mock.calls).toHaveLength(0);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(0);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventTwo);

                expect(console.group.mock.calls).toHaveLength(0);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(0);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventThree);

                expect(console.group.mock.calls).toHaveLength(0);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(0);
                expect(console.info.mock.calls).toHaveLength(1);
            });
        });

        describe('grouping with scopes', () => {
            it('groups by default', () => {
                const eventOne = [
                    'info',
                    {scopes: createScopesFromMessages(['a', 'b', 'c'])},
                    'one'
                ] as Parameters<Transport>;
                const eventTwo = [
                    'info',
                    {scopes: createScopesFromMessages(['a', 'd'])},
                    'two'
                ] as Parameters<Transport>;
                const eventThree = [
                    'info',
                    {scopes: createScopesFromMessages(['a', 'b', 'c'])},
                    'three'
                ] as Parameters<Transport>;
                const eventFour = [
                    'info',
                    {scopes: createScopesFromMessages(['a'])},
                    'four'
                ] as Parameters<Transport>;

                jest.clearAllMocks();
                browserTransport(...eventOne);

                expect(console.group.mock.calls).toHaveLength(3);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(0);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventTwo);

                expect(console.group.mock.calls).toHaveLength(1);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(2);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventThree);

                expect(console.group.mock.calls).toHaveLength(2);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(1);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventFour);

                expect(console.group.mock.calls).toHaveLength(0);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(2);
                expect(console.info.mock.calls).toHaveLength(1);
            });
            it('doesnt group if turned off', () => {
                const eventOne = [
                    'info',
                    {groupByMessage: false, scopes: createScopesFromMessages(['a', 'b', 'c'])},
                    'one'
                ] as Parameters<Transport>;
                const eventTwo = [
                    'info',
                    {groupByMessage: false, scopes: createScopesFromMessages(['a', 'd'])},
                    'two'
                ] as Parameters<Transport>;
                const eventThree = [
                    'info',
                    {groupByMessage: false, scopes: createScopesFromMessages(['a', 'b', 'c'])},
                    'three'
                ] as Parameters<Transport>;
                const eventFour = [
                    'info',
                    {groupByMessage: false, scopes: createScopesFromMessages(['a'])},
                    'four'
                ] as Parameters<Transport>;

                browserTransport(...eventOne);

                expect(console.group.mock.calls).toHaveLength(3);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(3);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventTwo);

                expect(console.group.mock.calls).toHaveLength(2);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(2);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventThree);

                expect(console.group.mock.calls).toHaveLength(3);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(3);
                expect(console.info.mock.calls).toHaveLength(1);

                jest.clearAllMocks();
                browserTransport(...eventFour);

                expect(console.group.mock.calls).toHaveLength(1);
                expect(console.groupCollapsed.mock.calls).toHaveLength(0);
                expect(console.groupEnd.mock.calls).toHaveLength(1);
                expect(console.info.mock.calls).toHaveLength(1);
            });
        });
    });
});
