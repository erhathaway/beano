import transportCaller from './transport_caller';

describe('transportCaller', () => {
    it('calls the transports in the merge object', () => {
        const transport = jest.fn();
        const mergingObject = {transports: [transport]};
        transportCaller('info', mergingObject)('hello');
        expect(transport.mock.calls).toEqual([['info', mergingObject, 'hello']]);
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
    });
});
