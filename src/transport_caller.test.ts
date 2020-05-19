import transportCaller from './transport_caller';

describe('transportCaller', () => {
    it('calls the transports in the merge object', () => {
        const transport = jest.fn();
        const mergingObject = {transports: [transport]};
        transportCaller('info', mergingObject)('hello');
        expect(transport.mock.calls).toEqual([['info', mergingObject, 'hello']]);
    });
    it('throws an error if no transport is supplied', () => {
        const mergingObject = {};
        expect(() => {
            transportCaller('info', mergingObject)('hello');
        }).toThrowError();
    });
    describe('closure', () => {
        it('can be called with a message only', () => {
            const transport = jest.fn();
            const mergingObject = {transports: [transport]};
            transportCaller('info', mergingObject)('hello');
            expect(transport.mock.calls).toEqual([['info', mergingObject, 'hello']]);
        });
        it('can be called with an object only', () => {
            const transport = jest.fn();
            const mergingObject = {transports: [transport]};
            transportCaller('info', mergingObject)({test: 'data'});
            expect(transport.mock.calls).toEqual([
                ['info', {...mergingObject, test: 'data'}, undefined]
            ]);
        });
        it('can be called with an object and a message', () => {
            const transport = jest.fn();
            const mergingObject = {transports: [transport]};
            transportCaller('info', mergingObject)({test: 'data'}, 'yus');
            expect(transport.mock.calls).toEqual([
                ['info', {...mergingObject, test: 'data'}, 'yus']
            ]);
        });
        it('throws an error if the first param isnt an object or string', () => {
            const transport = jest.fn();
            const mergingObject = {transports: [transport]};
            expect(() => {
                transportCaller('info', mergingObject)(2 as any);
            }).toThrowError();
        });
    });
});
