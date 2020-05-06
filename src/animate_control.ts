const pendingPromise = Promise.race.bind(Promise, []);

export default class AnimationControl {
    // eslint-disable-next-line
    _cancel: undefined | (() => any) = undefined;
    // eslint-disable-next-line
    _onFinishPromise: undefined | Promise<any> = undefined;
    // eslint-disable-next-line
    _onFinishAction: undefined | (() => any) = undefined;

    cancel = (): void => {
        console.log('** ATTEMPTING CANCEL', this._cancel);
        try {
            this._cancel && this._cancel();
        } catch (e) {
            console.log('**', e);
        }
    };

    // eslint-disable-next-line
    createOnFinishPromise = (promises: Promise<any>[] = []): Promise<any> => {
        console.log('** CREATING ON FINISH');
        let hasCanceled = false;
        this._onFinishPromise = new Promise((fulfill, _reject) => {
            this._cancel = () => {
                // console.log(r.name, ': OHHHHHH yeah CANCELING');

                fulfill(pendingPromise());
                console.log('** FULLFILLING CANCEL');
                hasCanceled = true;
            };

            try {
                Promise.all(promises)
                    .then(() => {
                        console.log('** FULLFILLING PROMISEE!!!');

                        !hasCanceled && fulfill();
                    })
                    .then(() => {
                        if (this._onFinishAction && !hasCanceled) {
                            this._onFinishAction();
                        }
                    });
            } catch (e) {
                _reject(e);
            }
        });
        return this._onFinishPromise;
    };

    setOnFinishAction = (action: () => any): void => {
        this._onFinishAction = action;
    };
}
