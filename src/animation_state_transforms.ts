/* eslint-disable @typescript-eslint/no-explicit-any */

import {CurrentState, AnimationState, NotifyParentOfState} from './types';

export const setStateForNewAction = <TriggerState extends any>(
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

export const setStateForFinishedAction = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: current.currentState === 'running' ? 'finished' : current.currentState
    }));
};

export const setHasRunForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        hasRunForCycle: true
    }));
};

export const setCurrentStateToRunningForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'running'
    }));
};

export const setCurrentStateToFinishedForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'finished'
    }));
};

export const setCurrentStateToUnmountedForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'unmounted'
    }));
};

export const setCurrentStateToInitializingForActionCount = <TriggerState extends any>(
    setEState: React.Dispatch<React.SetStateAction<CurrentState<TriggerState>>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'initalizing'
    }));
};

export const setChildStateForActionCount = <TriggerState extends any>(
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
