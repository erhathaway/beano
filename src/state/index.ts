import {configure} from 'mobx';

export {default as ExampleState} from './example_state';

configure({
    computedRequiresReaction: true,
    reactionRequiresObservable: true,
    enforceActions: 'always',
    isolateGlobalState: true
});
