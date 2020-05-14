/* eslint-disable @typescript-eslint/no-explicit-any */

export type AnimationState = 'restarting' | 'initalizing' | 'running' | 'finished' | 'unmounted';

export type NotifyParentOfState = (id: string, state: AnimationState) => void;

export type AnimationBinding = {
    notifyParentOfState: NotifyParentOfState;
    parentState: AnimationState;
    parentVisible: boolean;
};

/**
 * The state of the animation control component
 */
export type CurrentState<TriggerState> = {
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

export type Predicate = <PS extends any, TS extends any>(
    predicateState: any, // TODO replace with PS once excessively deep type problem is fixed
    {triggerState, visible}: {triggerState: any; visible: boolean} // TODO replace with PS once excessively deep type problem is fixed
) => boolean;

export type Predicates = Array<Predicate>;

export type AnimationCtx = {
    node: HTMLElement;
};

export interface IAnimationResult {
    finished: Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type AnimationRun = {hasRun: boolean; ctx: AnimationCtx; animationResult: AnimationResult};

export type AnimationResult = IAnimationResult | null;

export type PredicateAnimation = (ctx: AnimationCtx) => AnimationResult;

export type When = Array<[Predicates | Predicate, PredicateAnimation]>;

export interface AnimateProps<PS, TS> {
    name: string; // TODO make me optional in the future
    visible: boolean;
    triggerState?: TS;
    predicateState?: PS;

    when?: When;
    children?: React.ReactElement;

    unMountOnHide?: boolean;
    unMountOnShow?: boolean;

    id?: string;

    animationBinding?: AnimationBinding;
    enterAfterParentStart?: boolean;
    enterAfterParentFinish?: boolean;
    exitAfterChildStart?: string[];
    exitAfterChildFinish?: string[];
}

export interface AnimateableProps {
    id?: string;
    className?: string;
    animationBinding?: AnimationBinding;
    children?: <P, T extends string>(animationBinding: AnimationBinding | undefined) => any; //React.ReactElement<P, T>;
}
