import React, {useState, useEffect} from 'react';
import {useId} from 'react-id-generator';

import AnimationControl from './animate_control';
import {AnimationState, AnimateProps, AnimationRun, CurrentState} from './types';
import {
    setStateForFinishedAction,
    setStateForNewAction,
    setCurrentStateToUnmountedForActionCount,
    setHasRunForActionCount,
    setCurrentStateToRunningForActionCount,
    setCurrentStateToFinishedForActionCount,
    setCurrentStateToInitializingForActionCount,
    setChildStateForActionCount
} from './animation_state_transforms';
import {createLogger, browserTransport} from './logger';

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

const logger = createLogger(
    {
        level: 'info',
        transports: [browserTransport()],
        groupByMessage: true,
        module: 'Kinetic Components'
    },
    'Kinetic Components'
);

const Animate = <PredicateState, TriggerState>({
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
    const animateLogger = logger.child('Animate Component');
    const namedAnimationLogger = animateLogger.child(name || 'unnamed');

    const [eState, setEState] = useState<CurrentState<TriggerState | undefined>>({
        actionCount: 0,
        currentState: 'initalizing',
        hasRunForCycle: false,
        triggerState: triggerState || undefined,
        visible: false,
        childStates: {}
    });

    const specificAnimateLogger = namedAnimationLogger.child(eState.currentState);
    specificAnimateLogger.info(eState.currentState);
    const visible =
        animationBinding && animationBinding.parentVisible === false ? false : visibleProp;

    // const visible = visibleProp;

    const [uuid] = useId();

    const [ref, setRef] = useState<HTMLElement | null>();

    const refId = ref ? ref.id : undefined;

    const unMountOnHide = _unMountOnHide === undefined ? true : _unMountOnHide;

    specificAnimateLogger.debug(
        {
            refId: refId,
            currentState: eState.currentState,
            childState: eState.childStates,
            'incoming trigger': triggerState,
            'incoming visibility': visible,
            'old visibility': eState.visible
        },
        'initial state'
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
            specificAnimateLogger.info(eState.currentState, 'Notifying parent of state');

            animationBinding.notifyParentOfState(id || uuid, eState.currentState);
        }
    }, [eState.currentState]);

    useEffect(() => {
        return () => {
            if (animationBinding) {
                specificAnimateLogger.debug('Unmounting from unmount action');

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
        specificAnimateLogger.debug({actionCount: eState.actionCount}, 'Updated action count');
    }, [eState.actionCount]);

    useEffect(() => {
        if (!refId) {
            specificAnimateLogger.debug({ref: refId}, 'Updated to no ref');
        } else {
            specificAnimateLogger.debug({ref: refId}, 'Update to new ref');
        }
    }, [refId]);

    const parentState = (animationBinding && animationBinding.parentState) || 'initalizing';
    const parentVisible = (animationBinding && animationBinding.parentVisible) || true;

    useEffect(() => {
        specificAnimateLogger.debug({parentState}, 'Update parentState');
    }, [parentState]);

    useEffect(() => {
        specificAnimateLogger.debug({parentVisible}, 'Update parentVisible');
    }, [parentVisible]);

    useEffect(() => {
        specificAnimateLogger.debug({childStates: eState.childStates}, 'Update childStates');
    }, [JSON.stringify(eState.childStates)]);

    /**
     * Run animations whenever there is a state change
     */
    useEffect(() => {
        const animateEffectLogger = specificAnimateLogger.child('animate effect');

        if (eState.currentState === 'restarting') {
            animateEffectLogger.debug({restarting: true}, 'Exiting should animate effect');

            return;
        }
        if (ref == null) {
            animateEffectLogger.debug('No ref found');

            // console.log(name, ': ', 'WOULD PAUSE / STOP IF COULD');
            if (animationControl.cancel) {
                animateEffectLogger.debug('Canceling existing animation');

                animationControl.cancel();
            }
            if (!visible) {
                setCurrentStateToUnmountedForActionCount(setEState);
            }
            animateEffectLogger.debug({refMissing: true}, 'Exiting should animate effect');

            return;
        }

        if (eState.hasRunForCycle === true) {
            animateEffectLogger.debug({hasRunForCycle: true}, 'Exiting should animate effect');

            return;
        }

        if (
            visible &&
            enterAfterParentStart &&
            parentState !== 'running' &&
            parentState !== 'finished'
        ) {
            animateEffectLogger.debug(
                {waitingForParentToStart: true},
                'Exiting should animate effect'
            );

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
            animateEffectLogger.debug(
                {waitingForChildToStart: true},
                'Exiting should animate effect'
            );

            return;
        }

        if (visible && enterAfterParentFinish && parentState !== 'finished') {
            animateEffectLogger.debug(
                {waitingForParentToFinish: true},
                'Exiting should animate effect'
            );

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
            animateEffectLogger.debug(
                {waitingForChildToFinish: true},
                'Exiting should animate effect'
            );

            return;
        }

        setHasRunForActionCount(setEState);

        const {ctx: animationCtx, hasRun, animationResult} = animate(ref);
        animateEffectLogger.debug({hasRun, animationCtx}, 'Running animation');

        if (hasRun) {
            setCurrentStateToRunningForActionCount(setEState);
        }
        if (animationResult && animationResult.finished) {
            animationControl.createOnFinishPromise(animationResult.finished);
        } else {
            animateEffectLogger.debug('No finish promises found. Setting state to finished');

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
        specificAnimateLogger.debug({currentState: eState.currentState}, 'Updated currentState');
    }, [eState.currentState]);

    useEffect(() => {
        if (eState.currentState === 'restarting') {
            specificAnimateLogger.debug(
                {currentState: eState.currentState},
                'Setting currentState to initializing from restarting'
            );

            setCurrentStateToInitializingForActionCount(setEState);
        }
    }, [eState.currentState]);

    const endLogger = specificAnimateLogger.child('end');
    if (eState.currentState === 'restarting') {
        endLogger.debug(
            {currentState: eState.currentState},
            'Returning null for component b/c restarting'
        );
        // Return null to unmount children and allow new animation to be in correct dom position
        // incase an animation applied a transform or similar
        return null;
    }
    if (ref == null && unMountOnHide && visible === false) {
        endLogger.debug({ref, unMountOnHide, visible}, 'Returning null');
        return null;
    }

    const setRefOfAnimateable = (ref: HTMLElement): void => {
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
        ? React.cloneElement(children, {
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
        endLogger.debug('Waiting for parent to start before showing children');
        return null;
    }

    if (visible && enterAfterParentFinish && parentState !== 'finished') {
        endLogger.debug('Waiting for parent to finish before showing children');

        return null;
    }

    if (eState.currentState === 'unmounted') {
        endLogger.debug('Unmounted. Not showing showing children');

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
        endLogger.debug('Unmounted b/c not visible and animation finished');

        if (eState.currentState === 'finished') {
            setCurrentStateToUnmountedForActionCount(setEState);
        }
        return null;
    } else {
        endLogger.debug('Showing children');

        return realChildren;
    }
};

export default Animate;
