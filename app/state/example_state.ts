import {runInAction, decorate, observable, computed} from 'mobx';

class ExampleState {
    public internalAttributeState?: boolean;

    constructor(startingState = true) {
        runInAction(() => {
            this.internalAttributeState = startingState;
        });
    }

    public toggleAttributeState = (): void => {
        return runInAction(() => {
            this.internalAttributeState = !this.someAttribute;
        });
    };

    get someAttribute(): boolean {
        return this.internalAttributeState || false;
    }
}

decorate(ExampleState, {
    internalAttributeState: observable,
    someAttribute: computed
});

export default ExampleState;
