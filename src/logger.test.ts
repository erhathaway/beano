import logger, {createLogger} from './logger';
import {createBrowserTransport} from './browser_transport';
import {Transport, ILogger} from './types';

declare const console: Console & {
    groupEnd: jest.Mock;
    groupCollapsed: jest.Mock;
    group: jest.Mock;
    info: jest.Mock;
};

describe('logger', () => {
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

    describe('no instantiation', () => {
        it('can log a message without instantiating', () => {
            logger.info('hello');

            expect(console.group.mock.calls).toHaveLength(0);
            expect(console.groupCollapsed.mock.calls).toHaveLength(0);
            expect(console.groupEnd.mock.calls).toHaveLength(0);
            expect(console.info.mock.calls).toHaveLength(1);
            expect(console.info.mock.calls).toEqual([['hello']]);
        });
        it('can log data and a message without instantiating', () => {
            logger.info({some: 'data'}, 'hello');

            expect(console.group.mock.calls).toHaveLength(0);
            expect(console.groupCollapsed.mock.calls).toHaveLength(0);
            expect(console.groupEnd.mock.calls).toHaveLength(0);
            expect(console.info.mock.calls).toHaveLength(1);
            expect(console.info.mock.calls).toEqual([['hello', {some: 'data'}]]);
        });
        it('can create a child logger', () => {
            logger.child('hi').info({some: 'data'}, 'hello');

            expect(console.group.mock.calls).toHaveLength(1);
            expect(console.group.mock.calls).toEqual([['hi']]);
            expect(console.groupCollapsed.mock.calls).toHaveLength(0);
            expect(console.groupEnd.mock.calls).toHaveLength(0);
            expect(console.info.mock.calls).toHaveLength(1);
            expect(console.info.mock.calls).toEqual([['hello', {some: 'data'}]]);
        });
    });
    describe('children', () => {
        let browserTransport: Transport;
        let newLogger: ILogger;
        beforeEach(() => {
            browserTransport = createBrowserTransport();
            newLogger = createLogger({transports: [browserTransport]});
        });
        it('can create a child logger', () => {
            newLogger.child('hi').info({some: 'data'}, 'hello');

            expect(console.group.mock.calls).toHaveLength(1);
            expect(console.group.mock.calls).toEqual([['hi']]);
            expect(console.groupCollapsed.mock.calls).toHaveLength(0);
            expect(console.groupEnd.mock.calls).toHaveLength(0);
            expect(console.info.mock.calls).toHaveLength(1);
            expect(console.info.mock.calls).toEqual([['hello', {some: 'data'}]]);
        });
        // it('can create multiple child loggers', () => {
        //     newLogger
        //         .child('hi')
        //         .child('hello')
        //         .info({some: 'data'}, 'hello');

        //     expect(console.group.mock.calls).toHaveLength(2);
        //     expect(console.group.mock.calls).toEqual([['hi'], ['hello']]);
        //     expect(console.groupCollapsed.mock.calls).toHaveLength(0);
        //     expect(console.groupEnd.mock.calls).toHaveLength(0);
        //     expect(console.info.mock.calls).toHaveLength(1);
        //     expect(console.info.mock.calls).toEqual([['hello', {some: 'data'}]]);
        // });
    });
});
