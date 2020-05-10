import React, {useState, useEffect} from 'react';
import {useId} from 'react-id-generator';

import AnimationControl from './animate_control';
import {AnimationState, AnimationBinding, NotifyParentOfState} from './types';

// type Predicate<T> = (predicateState: T) => boolean;
export type Predicate = <PS, TS>(
    predicateState: PS,
    {triggerState, visible}: {triggerState: TS; visible: boolean}
) => boolean;

export type Predicates = Array<Predicate>;

export type AnimationCtx = {
    node: HTMLElement;
    // classNames: string[];
    // finish: Array<Promise<any>>;
};

export interface IAnimationResult {
    finished: Promise<any>;
}

export type AnimationRun = {hasRun: boolean; ctx: AnimationCtx; animationResult: AnimationResult};

export type AnimationResult = IAnimationResult | null;

type PredicateAnimation = (ctx: AnimationCtx) => AnimationResult;

export type When = Array<[Predicates | Predicate, PredicateAnimation]>;
interface AnimateProps<PS, TS> {
    name: string; // TODO make me optional in the future
    visible: boolean;
    triggerState?: TS;
    predicateState?: PS;

    when?: When;
    children?: any;

    unMountOnHide?: boolean;
    unMountOnShow?: boolean;

    id?: string;

    animationBinding?: AnimationBinding;
    enterAfterParentStart?: boolean;
    enterAfterParentFinish?: boolean;
    exitAfterChildStart?: string[];
    exitAfterChildFinish?: string[];
}

type CurrentState<TriggerState> = {
    actionCount: number; // The current action count. Each layout change counts as an action
    currentState: AnimationState; // 'restarting', 'initalizing', 'running', 'finished', 'unmounted'
    hasRunForCycle: boolean; // Flag tracking whether this component has an animation is in progress for this action count
    triggerState: TriggerState;
    childStates: {
        // The state of each child
        [childId: string]: AnimationState | undefined;
    };
    visible: boolean;
};

const setStateForNewAction = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>,
    triggerState: TriggerState,
    visible: boolean
): void => {
    console.log('Setting new state for new action!!!!');
    setEState(current => {
        // increment action count
        const actionCount = current.actionCount + 1;
        // either cancel the existing animation ('restarting') or prep for new one ('initializing')
        const currentState = current.currentState === 'running' ? 'restarting' : 'initalizing';
        // set the flag recording if an animation has taken place to false
        const hasRunForCycle = false;
        // copy over unmounted child states b/c they wont be in play anymore
        // otherwise set child states to undefined for this action
        const childStates = Object.keys(current.childStates).reduce((acc, childId) => {
            const currentChildState = current.childStates[childId];
            if (currentChildState === 'unmounted') {
                return {
                    ...acc,
                    [childId]: 'unmounted' as AnimationState
                };
            } else {
                return {
                    ...acc,
                    [childId]: undefined
                };
            }
        }, {} as {[childId: string]: AnimationState | undefined});

        return {
            actionCount,
            currentState,
            triggerState,
            hasRunForCycle,
            childStates,
            visible
        };
    });
};

const setStateForFinishedAction = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: current.currentState === 'running' ? 'finished' : current.currentState
    }));
};

const setHasRunForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        hasRunForCycle: true
    }));
};

const setCurrentStateToRunningForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'running'
    }));
};

const setCurrentStateToFinishedForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'finished'
    }));
};

const setCurrentStateToUnmountedForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'unmounted'
    }));
};

const setCurrentStateToInitializingForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'initalizing'
    }));
};

const setChildStateForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): NotifyParentOfState => (id, state) => {
    setEState(current => ({
        ...current,
        childStates: {
            ...current.childStates,
            [id]: state
        }
    }));
};

const childrenMatch = (
    childrenOfInterest: string[],
    statesToMatch: Array<AnimationState | undefined>,
    allChildren: {[childId: string]: AnimationState | undefined}
): boolean => {
    const childrenToLookAt = Object.keys(allChildren).filter(childId =>
        childrenOfInterest.includes(childId)
    );

    if (childrenToLookAt.length === 0) {
        return false;
    }
    return childrenToLookAt.reduce((acc, childId) => {
        return acc && statesToMatch.includes(allChildren[childId]);
    }, true as boolean);
};

const Animate = <PredicateState extends any, TriggerState>({
    name,

    visible: visibleProp,
    triggerState,
    predicateState,

    when,
    children,
    unMountOnHide: _unMountOnHide,
    id,

    enterAfterParentStart,
    enterAfterParentFinish,
    exitAfterChildStart,
    exitAfterChildFinish,

    animationBinding
}: AnimateProps<PredicateState, TriggerState>): ReturnType<React.FC<
    AnimateProps<PredicateState, TriggerState>
>> => {
    const [eState, setEState] = useState<CurrentState<TriggerState | undefined>>({
        actionCount: 0,
        currentState: 'initalizing',
        hasRunForCycle: false,
        triggerState: triggerState || undefined,
        visible: false,
        childStates: {}
    });

    const visible =
        animationBinding && animationBinding.parentVisible === false ? false : visibleProp;

    // const visible = visibleProp;

    const [uuid] = useId();

    const [ref, setRef] = useState<HTMLElement | null>();

    const refId = ref ? ref.id : undefined;

    const unMountOnHide = _unMountOnHide === undefined ? true : _unMountOnHide;
    console.log(
        name,
        ': ',
        'START------------ref',
        refId,
        'currentState:',
        eState.currentState,
        'child state',
        eState.childStates,
        'incoming trigger',
        triggerState,
        'old trigger',
        eState.triggerState,
        'incoming visibility',
        visible,
        'old visibility',
        eState.visible
    );

    const createAnimationControl = (): AnimationControl => {
        const ac = new AnimationControl();
        ac.setOnFinishAction(() => {
            setStateForFinishedAction(setEState);
        });
        return ac;
    };

    // TODO enable setting of animation control
    const [animationControl, setAnimationControl] = useState<AnimationControl>(
        createAnimationControl()
    );

    useEffect(() => {
        if (animationBinding) {
            console.log(name, ': ', 'Notifying parent of state :))', eState.currentState);

            animationBinding.notifyParentOfState(id || uuid, eState.currentState);
        }
    }, [eState.currentState]);

    useEffect(() => {
        return () => {
            if (animationBinding) {
                console.log(name, ': ', 'Unmounting from unmount action');

                animationBinding.notifyParentOfState(id || uuid, 'unmounted');
            }
        };
    }, ['onExit']);

    useEffect(() => {
        setAnimationControl(c => {
            c.cancel();
            return createAnimationControl();
        });
        setStateForNewAction(setEState, triggerState, visible);
    }, [JSON.stringify(triggerState), visible]);

    const animate = (node: HTMLElement): AnimationRun => {
        return (when || []).reduce(
            (acc, predicateAnimation) => {
                const {hasRun, ctx} = acc;
                if (hasRun) {
                    return acc;
                }
                let shouldRun: boolean;
                const predicate = predicateAnimation[0];
                if (Array.isArray(predicate)) {
                    shouldRun = predicate.reduce((accc, predicate) => {
                        return accc && predicate(predicateState, {triggerState, visible});
                    }, true as boolean);
                } else {
                    shouldRun = predicate(predicateState, {triggerState, visible});
                }

                if (shouldRun) {
                    const animation = predicateAnimation[1];

                    const animationResult = animation(ctx);
                    if (animationResult) {
                        return {hasRun: true, ctx, animationResult};
                    } else {
                        return {...acc, hasRun: true, ctx};
                    }
                }
                return acc;
            },
            {hasRun: false, ctx: {node}, animationResult: null} as AnimationRun
        );
    };

    useEffect(() => {
        console.log(name, ': ', 'Updated eState action count', eState.actionCount);
    }, [eState.actionCount]);

    useEffect(() => {
        console.log(name, ': ', 'Updated ref', refId);
        if (!refId) {
            console.log(name, ': ', 'Updated to no ref', refId);
        }
    }, [refId]);

    const parentState = (animationBinding && animationBinding.parentState) || 'initalizing';
    const parentVisible = (animationBinding && animationBinding.parentVisible) || true;

    useEffect(() => {
        console.log(name, ': ', 'Updated parentState', parentState);
    }, [parentState]);

    useEffect(() => {
        console.log(name, ': ', 'Updated parentVisible', parentVisible);
    }, [parentVisible]);

    useEffect(() => {
        console.log(name, ': ', 'Updated children states', eState.childStates);
    }, [JSON.stringify(eState.childStates)]);

    /**
     * Run animations whenever there is a state change
     */
    useEffect(() => {
        console.log(name, ': ', 'Child states:', eState.childStates);

        if (eState.currentState === 'restarting') {
            return;
        }
        if (ref == null) {
            console.log(name, ': ', 'WOULD PAUSE / STOP IF COULD');
            if (animationControl.cancel) {
                console.log(name, ': ', 'Canceling animation');

                animationControl.cancel();
            }
            if (!visible) {
                setCurrentStateToUnmountedForActionCount(setEState);
            }

            console.log(name, ': ', 'Skipping running of animation b/c ref missing');

            return;
        }

        if (eState.hasRunForCycle === true) {
            console.log(name, ': ', 'Has already run for cycle. Not running animation');

            return;
        }

        if (
            visible &&
            enterAfterParentStart &&
            parentState !== 'running' &&
            parentState !== 'finished'
        ) {
            console.log(name, ': ', 'Waiting for parent to start');

            return;
        }

        if (
            !visible &&
            exitAfterChildStart &&
            exitAfterChildStart.length > 0 &&
            childrenMatch(
                exitAfterChildStart,
                // if matches the states that come before the finished state
                [undefined, 'restarting', 'initalizing'],
                eState.childStates
            )
        ) {
            console.log(name, ': ', 'Waiting for child to start');
            return;
        }

        if (visible && enterAfterParentFinish && parentState !== 'finished') {
            console.log(name, ': ', 'Waiting for parent to finish');
            return;
        }

        if (
            !visible &&
            exitAfterChildFinish &&
            exitAfterChildFinish.length > 0 &&
            childrenMatch(
                exitAfterChildFinish,
                // if matches the states that come before the finished state
                [undefined, 'restarting', 'initalizing', 'running'],
                eState.childStates
            )
        ) {
            console.log(name, ': ', 'Waiting for child to finish');
            return;
        }

        console.log(name, ': ', 'Running animation');
        setHasRunForActionCount(setEState);

        const {ctx: animationCtx, hasRun, animationResult} = animate(ref);
        console.log(name, ': ', 'Animation running with', hasRun, animationCtx);

        if (hasRun) {
            setCurrentStateToRunningForActionCount(setEState);
        }
        if (animationResult && animationResult.finished) {
            animationControl.createOnFinishPromise(animationResult.finished);
        } else {
            console.log(name, ': ', 'No finish promises found. Setting state to finished');
            setCurrentStateToFinishedForActionCount(setEState);
        }
    }, [
        eState.currentState,
        eState.actionCount,
        refId,
        parentState,
        JSON.stringify(eState.childStates)
    ]);

    useEffect(() => {
        console.log(name, ': ', 'Updated currentState', eState.currentState);
    }, [eState.currentState]);

    useEffect(() => {
        if (eState.currentState === 'restarting') {
            console.log(name, 'Lifecycle ohhhh maybe');
            setCurrentStateToInitializingForActionCount(setEState);
        }
    }, [eState.currentState]);

    if (eState.currentState === 'restarting') {
        console.log(name, 'Lifecycle ohhhh yeah');
        // Return null to unmount children and allow new animation to be in correct dom position
        // incase an animation applied a transform or similar
        return null;
    }
    if (ref == null && unMountOnHide && visible === false) {
        return null;
    }

    const setRefOfAnimateable = (ref: HTMLElement) => {
        // TODO: for some reason null is returned whenever this component rerenders.
        // Possibly due to the cloneElement behavior.
        // This prevents knowing about child unmount events, which isn't a big deal
        // if using the Animateable component.
        // However, if run in uncontrolled mode, this could be a problem.
        if (ref == null) {
            return;
        }
        setRef(ref);
    };
    const realChildren = children
        ? React.cloneElement(children as any, {
              ref: setRefOfAnimateable,
              id: uuid,
              animationBinding: {
                  notifyParentOfState: setChildStateForActionCount(setEState),
                  parentState: eState.currentState,
                  parentVisible: eState.visible
              }
          })
        : null;

    if (
        visible &&
        enterAfterParentStart &&
        parentState !== 'running' &&
        parentState !== 'finished'
    ) {
        console.log(name, ': ', 'Waiting for parent to start before entering');
        return null;
    }

    if (visible && enterAfterParentFinish && parentState !== 'finished') {
        console.log(name, ': ', 'Waiting for parent to finish before entering');
        return null;
    }

    if (eState.currentState === 'unmounted') {
        console.log(name, ': ', 'Unmounted. Returning null');

        return null;
    }

    if (
        !visible &&
        unMountOnHide &&
        eState.currentState === 'finished' &&
        // TODO change to only do a shallow compare
        // Guard against running one new trigger states.
        //  Often, on !visible states we are also in the 'finished' state
        //  doing an unmount at the beginning can kill the child animations
        JSON.stringify({triggerState, visible}) ===
            JSON.stringify({triggerState: eState.triggerState, visible: eState.visible})
    ) {
        console.log(name, ': ', 'Unmounting b/c finished', triggerState, eState);
        if (eState.currentState === 'finished') {
            setCurrentStateToUnmountedForActionCount(setEState);
        }
        return null;
    } else {
        console.log(name, ': ', 'Showing children');
        return realChildren;
    }
};

export default Animate;
