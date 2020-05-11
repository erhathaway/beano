/* eslint-disable @typescript-eslint/no-explicit-any */

const pendingPromise = Promise.race.bind(Promise, []);

export default class AnimationControl {
    _cancel: undefined | (() => any) = undefined;
    _onFinishPromise: undefined | Promise<any> = undefined;
    _onFinishAction: undefined | (() => any) = undefined;

    cancel = (): void => {
        console.log('** ATTEMPTING CANCEL', this._cancel);
        try {
            this._cancel && this._cancel();
        } catch (e) {
            console.log('**', e);
        }
    };

    createOnFinishPromise = (animationFinishPromise: Promise<any>): Promise<any> => {
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
                animationFinishPromise
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
