import React, {useState, useCallback, useEffect} from 'react';
import {useId} from 'react-id-generator';
// import anime from 'animejs';

import {
    Manager,
    IRouterDeclaration,
    RouterInstance,
    // IManager,
    IRouterTemplates,
    IOutputLocation
} from 'router-primitives';

const moonFeatures = [{name: 'rocket'}];
const sunFeatures = [{name: 'river', defaultAction: ['show']} as IRouterDeclaration<any>];

const routerDeclaration: IRouterDeclaration<any> = {
    name: 'root',
    children: {
        scene: [
            {name: 'sun', children: {feature: sunFeatures}},
            {name: 'moon', defaultAction: ['show'], children: {feature: moonFeatures}}
        ],
        feature: [{name: 'trees'}, {name: 'mountains'}]
    }
};

let manager: Manager<IRouterTemplates<unknown>>;

try {
    manager = new Manager({routerDeclaration}) as Manager<IRouterTemplates<unknown>>;
} catch (e) {
    console.log(e);
}

export const useForceUpdate = (): (() => void) => {
    const [, setTick] = useState(0);
    const update = useCallback(() => {
        setTick(tick => tick + 1);
    }, []);
    return update;
};

interface Props {
    children?: React.ReactNode;
}

interface LinkProps {
    action: 'show' | 'hide';
    children?: React.ReactNode;
}

type Predicates = Array<(route: RouterInstance<any>) => boolean>;

export type AnimationCtx = {
    node: HTMLElement;
    classNames: string[];
    finish: Array<Promise<any>>;
};
type Animations = (ctx: AnimationCtx) => void | AnimationCtx;

interface AnimateProps {
    when?: Array<[Predicates, Animations]>;
    children?: any;
    unMountOnHide?: boolean;
    unMountOnShow?: boolean;
    id?: string;
    animationBinding?: AnimationBinding;
    enterAfterParentStart?: boolean;
    enterAfterParentFinish?: boolean;
    exitAfterChildStart?: string[];
    exitAfterChildFinish?: string[];

    // exitAfterChildStart?: boolean;
    // children?: React.ForwardRefExoticComponent<
    //     AnimateableProps & React.RefAttributes<HTMLDivElement>
    // >;
    // children?: (...args: any[]) => React.ReactElement; // | JSX.Element; //(ctx: AnimationCtx) => any;
    // // | Array<React.ReactElement<AnimationCtx> | JSX.Element>
    // React.ReactElement<AnimationCtx> | JSX.Element; //(ctx: AnimationCtx) => any;
}

// interface HandleVisiblityProps {
//     ctx: AnimationCtx;
//     actionCount: number;
//     children?: ({
//         ctx,
//         hasMounted
//     }: {
//         ctx: AnimationCtx;
//         hasMounted: () => void;
//     }) => React.ReactElement; // | JSX.Element; //(ctx: AnimationCtx) => any;
// }

type AnimationState = 'restarting' | 'initalizing' | 'running' | 'finished' | 'unmounted';

type NotifyParentOfState = (id: string, state: AnimationState) => void;

type AnimationBinding = {
    notifyParentOfState: NotifyParentOfState;
    parentState: AnimationState;
};

type RouterT = React.FC<Props> & {
    Link: React.FC<LinkProps>;
    Animate: React.FC<AnimateProps>;
};

interface AnimateableProps {
    id?: string;
    className?: string;
    animationBinding?: AnimationBinding;
    children?: (animationBinding: AnimationBinding | undefined) => any; //(...args: any[]) => any; //React.ReactElement | JSX.Element | React.Component; //Array<string | React.ReactElement>; // (...args: any[]) => React.ReactElement; //(ctx: AnimationCtx) => any;
}

const Animateable = React.forwardRef<HTMLDivElement, AnimateableProps>(function animateable(
    props,
    ref
) {
    if (!props.id) {
        throw new Error('Missing id');
    }
    return (
        <div id={props.id} ref={ref} className={props.className}>
            {props.children && props.children(props.animationBinding)}
        </div>
    );
});
export {Animateable};

const pendingPromise = Promise.race.bind(Promise, []);

class AnimationControl {
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

type CurrentState = {
    actionCount: number; // The current action count. Each layout change counts as an action
    currentState: AnimationState; // 'restarting', 'initalizing', 'running', 'finished', 'unmounted'
    hasRunForCycle: boolean; // Flag tracking whether this component has an animation is in progress for this action count
    childStates: {
        // The state of each child
        [childId: string]: AnimationState | undefined;
    };
};

const setStateForNewAction = (
    setEState: React.Dispatch<React.SetStateAction<CurrentState>>
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
            hasRunForCycle,
            childStates
        };
    });
};

const setStateForFinishedAction = (
    setEState: React.Dispatch<React.SetStateAction<CurrentState>>
): void => {
    setEState(current => ({
        ...current,
        currentState: current.currentState === 'running' ? 'finished' : current.currentState
    }));
};

const setHasRunForActionCount = (
    setEState: React.Dispatch<React.SetStateAction<CurrentState>>
): void => {
    setEState(current => ({
        ...current,
        hasRunForCycle: true
    }));
};

const setCurrentStateToRunningForActionCount = (
    setEState: React.Dispatch<React.SetStateAction<CurrentState>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'running'
    }));
};

const setCurrentStateToFinishedForActionCount = (
    setEState: React.Dispatch<React.SetStateAction<CurrentState>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'finished'
    }));
};

const setCurrentStateToInitializingForActionCount = (
    setEState: React.Dispatch<React.SetStateAction<CurrentState>>
): void => {
    setEState(current => ({
        ...current,
        currentState: 'initalizing'
    }));
};

const setChildStateForActionCount = (
    setEState: React.Dispatch<React.SetStateAction<CurrentState>>
): NotifyParentOfState => (id, state) => {
    setEState(current => ({
        ...current,
        childStates: {
            ...current.childStates,
            [id]: state
        }
    }));
};
const childrenDontMatch = (
    childrenOfInterest: string[],
    statesToNotMatch: Array<AnimationState | undefined>,
    allChildren: {[childId: string]: AnimationState | undefined}
): boolean => {
    return Object.keys(allChildren)
        .filter(childId => childrenOfInterest.includes(childId))
        .reduce((acc, childId) => {
            return acc && statesToNotMatch.includes(allChildren[childId]);
        }, true as boolean);
};

const childrenHaveReportedState = (allChildren: {
    [childId: string]: AnimationState | undefined;
}): boolean => {
    return Object.keys(allChildren).reduce((acc, childId) => {
        return acc && allChildren[childId] !== undefined;
    }, true as boolean);
};

export const createRouterComponents = (
    routers: typeof manager['routers']
): Record<string, RouterT> => {
    return Object.keys(routers).reduce((acc, routerName) => {
        const r = routers[routerName];

        // eslint-disable-next-line
        const component: React.FC<Props> = ({children}) => {
            const [state, setState] = useState(r.state);
            useEffect(() => {
                if (r && r.subscribe) {
                    r.subscribe(all => setState(all.current) as any);
                }
                return;
            }, ['startup']);
            return state.visible ? <>{children}</> : null;
        };
        // eslint-disable-next-line
        const Link: React.FC<LinkProps> = ({children, action}) => {
            /**
             * Subscribe to all state changes
             */
            const [_, setRouterState] = useState<IOutputLocation>();
            useEffect(() => {
                if (r.manager.serializedStateStore) {
                    r.manager.serializedStateStore.subscribeToStateChanges(all =>
                        setRouterState(all)
                    );
                }
                return;
            }, ['startup']);

            const link = r.link(action);
            return (
                <a href={undefined} title={link}>
                    <a onClick={() => r[action]()}>{children}</a>
                </a>
            );
        };

        // eslint-disable-next-line
        const Animate: React.FC<AnimateProps> = ({
            when,
            children,
            unMountOnHide,
            id,
            // unMountOnShow,
            enterAfterParentStart,
            enterAfterParentFinish,
            exitAfterChildStart,
            exitAfterChildFinish,
            // exitAfterChildStart,

            animationBinding
        }) => {
            // const [shouldUnmountNode, setShouldUnmountNode] = useState<boolean>(false);

            const [eState, setEState] = useState<CurrentState>({
                actionCount: 0,
                currentState: 'initalizing',
                hasRunForCycle: false,
                childStates: {}
            });

            const [uuid] = useId();

            const [routerState, setRouterState] = useState(r.state);
            // const [hasRunForCycle, setHasRunForCycle] = useState<boolean>(false);
            // const [childState, setChildState] = useState<AnimationState>();
            const [ref, setRef] = useState<HTMLElement | null>();

            const refId = ref ? ref.id : undefined;

            const visible = r.state.visible || false;

            // const [currentState, setCurrentState] = useState<AnimationState>('initalizing');
            console.log(
                r.name,
                ': ',
                'START------------ref',
                refId,
                'currentState:',
                eState.currentState
            );

            const createAnimationControl = (): AnimationControl => {
                const ac = new AnimationControl();
                ac.setOnFinishAction(() => {
                    setStateForFinishedAction(setEState);
                    // setCurrentState(currentState =>
                    //     currentState === 'running' ? 'finished' : currentState
                    // );
                });
                return ac;
            };

            // TODO enable setting of animation control
            const [animationControl, setAnimationControl] = useState<AnimationControl>(
                createAnimationControl()
            );

            useEffect(() => {
                if (animationBinding) {
                    console.log(r.name, ': ', 'Notifying parent of state', eState.currentState);

                    animationBinding.notifyParentOfState(id || uuid, eState.currentState);
                }
                return () => {
                    if (animationBinding) {
                        console.log(r.name, ': ', 'Unmounting from unmount action');

                        animationBinding.notifyParentOfState(id || uuid, 'unmounted');
                    }
                };
            }, [eState.currentState]);
            /**
             * Subscribe to router state changes
             */
            useEffect(() => {
                if (r && r.subscribe) {
                    r.subscribe(all => {
                        setAnimationControl(c => {
                            c.cancel();
                            return createAnimationControl();
                        });
                        setStateForNewAction(setEState);
                        // setCurrentState(current => {
                        //     if (current === 'running') {
                        //         console.log(
                        //             r.name,
                        //             ': ',
                        //             'Setting state to restarting in subscribe fn'
                        //         );
                        //         return 'restarting';
                        //     } else {
                        //         // if (!all.current.visible && ref === undefined) {
                        //         //     console.log(
                        //         //         r.name,
                        //         //         ': ',
                        //         //         'Setting state to unmounted in subscribe fn'
                        //         //     );
                        //         //     return 'unmounted';
                        //         // } else {
                        //         console.log(
                        //             r.name,
                        //             ': ',
                        //             'Setting state to initializing in subscribe fn'
                        //         );
                        //         return 'initalizing';
                        //     }
                        // });

                        // setHasRunForCycle(false);

                        setRouterState(all.current) as any;
                    });
                }
                return;
            }, ['startup']);

            const animate = (node: HTMLElement) => {
                return (when || []).reduce(
                    (acc, predicateAnimation) => {
                        const {hasRun, ctx} = acc;
                        if (hasRun) {
                            return acc;
                        }
                        const shouldRun = predicateAnimation[0].reduce((accc, predicate) => {
                            return accc && predicate(r as any);
                        }, true);

                        if (shouldRun) {
                            const newCtx = predicateAnimation[1](ctx);
                            if (newCtx) {
                                return {hasRun: true, ctx: newCtx};
                            } else {
                                return {hasRun: true, ctx};
                            }
                        }
                        return acc;
                    },
                    {hasRun: false, ctx: {node, classNames: [], finish: []}} as {
                        hasRun: boolean;
                        ctx: AnimationCtx;
                    }
                );
            };

            useEffect(() => {
                console.log(r.name, ': ', 'Updated action count', routerState.actionCount);
            }, [routerState.actionCount]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated eState action count', eState.actionCount);
            }, [eState.actionCount]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated ref', refId);
                if (!refId) {
                    console.log(r.name, ': ', 'Updated to no ref', refId);
                }
            }, [refId]);

            const parentState = (animationBinding && animationBinding.parentState) || 'initalizing';

            useEffect(() => {
                console.log(r.name, ': ', 'Updated parentState', parentState);
            }, [parentState]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated children states', eState.childStates);
            }, [JSON.stringify(eState.childStates)]);

            /**
             * Run animations whenever there is a state change
             */
            useEffect(() => {
                console.log(r.name, ': ', 'Child states:', eState.childStates);

                if (eState.currentState === 'restarting') {
                    return;
                }
                // console.log('Action count or ref updated', r.name, ref);
                if (ref == null) {
                    console.log(r.name, ': ', 'WOULD PAUSE / STOP IF COULD');
                    if (animationControl.cancel) {
                        console.log(r.name, ': ', 'Canceling animation');

                        animationControl.cancel();
                    }
                    // if (eState.currentState !== 'initalizing') {
                    //     console.log(r.name, ': ', 'Setting Animation lifecycle to: initalizing');
                    //     // setCurrentState('initalizing');
                    // }
                    console.log(r.name, ': ', 'Skipping running of animation b/c ref missing');

                    return;
                }
                if (
                    visible &&
                    enterAfterParentStart &&
                    parentState !== 'running' &&
                    parentState !== 'finished'
                ) {
                    console.log(r.name, ': ', 'Waiting for parent to start');

                    return;
                }

                // if (
                //     !visible &&
                //     (exitAfterChildStart || exitAfterChildFinish) &&
                //     childrenOfInterestHaveReportedState(eState.childStates)
                // ) {
                //     console.log(r.name, ': ', 'Waiting for all children to have reported states');
                //     return;
                // }

                if (
                    !visible &&
                    exitAfterChildStart &&
                    exitAfterChildStart.length > 0 &&
                    childrenDontMatch(
                        exitAfterChildStart,
                        ['running', 'finished'],
                        eState.childStates
                    )
                    // childState !== 'running' &&
                    // childState !== 'finished'
                ) {
                    console.log(r.name, ': ', 'Waiting for child to start');
                    return;
                }

                if (visible && enterAfterParentFinish && parentState !== 'finished') {
                    console.log(r.name, ': ', 'Waiting for parent to finish');
                    return;
                }

                if (
                    !visible &&
                    exitAfterChildFinish &&
                    exitAfterChildFinish.length > 0 &&
                    childrenDontMatch(
                        exitAfterChildFinish,
                        ['finished', 'unmounted'],
                        eState.childStates
                    )
                    // childState !== 'finished' &&
                    // childState !== 'unmounted' // will change to undefined if unmounted
                ) {
                    console.log(r.name, ': ', 'Waiting for child to finish');
                    return;
                }

                // animate(ref);
                if (eState.hasRunForCycle === true) {
                    console.log(r.name, ': ', 'Has already run for cycle. Not running animation');

                    return;
                }
                console.log(r.name, ': ', 'Running animation');
                setHasRunForActionCount(setEState);
                // setHasRunForCycle(true);
                const {ctx: animationCtx, hasRun} = animate(ref);
                console.log(r.name, ': ', 'Animation running with', hasRun, animationCtx);
                if (hasRun) {
                    setCurrentStateToRunningForActionCount(setEState);
                    // setCurrentState('running');
                }
                if (animationCtx.finish.length > 0) {
                    animationControl.createOnFinishPromise(animationCtx.finish);
                } else {
                    console.log(
                        r.name,
                        ': ',
                        'No finish promises found. Setting state to finished'
                    );
                    setCurrentStateToFinishedForActionCount(setEState);
                    // setCurrentState('finished');
                }
            }, [
                eState.currentState,
                eState.actionCount,
                refId,
                parentState,
                JSON.stringify(eState.childStates)
            ]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated currentState', eState.currentState);
            }, [eState.currentState]);

            useEffect(() => {
                if (eState.currentState === 'restarting') {
                    console.log(r.name, 'Lifecycle ohhhh maybe');
                    setCurrentStateToInitializingForActionCount(setEState);
                    // setCurrentState('initalizing');
                    // return null;
                }
            }, [eState.currentState]);

            if (eState.currentState === 'restarting') {
                console.log(r.name, 'Lifecycle ohhhh yeah');
                // setCurrentState('initalizing');
                // Return null to unmount children and allow new animation to be in correct dom position
                // incase an animation applied a transform or similar
                return null;
            }
            if (ref == null && unMountOnHide && visible === false) {
                return null;
            }
            // if (ref == null && visible === false) {
            //     return null;
            // }

            const setRefOfAnimateable = (ref: HTMLElement) => {
                // console.log(r.name, 'SETTING REF TO:', ref);
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
                      id: id ? id : uuid,
                      animationBinding: {
                          notifyParentOfState: setChildStateForActionCount(setEState),
                          parentState: eState.currentState
                      }
                  })
                : null;

            if (
                visible &&
                enterAfterParentStart &&
                parentState !== 'running' &&
                parentState !== 'finished'
            ) {
                console.log(r.name, ': ', 'Waiting for parent to start before entering');
                return null;
            }

            if (visible && enterAfterParentFinish && parentState !== 'finished') {
                console.log(r.name, ': ', 'Waiting for parent to finish before entering');
                return null;
            }

            // if (visible && unMountOnShow && currentState === 'finished') {
            //     console.log(r.name, ': ', 'Unmounting b/c finished');
            //     return null;
            // } else
            if (
                !visible &&
                unMountOnHide &&
                eState.currentState === 'finished' // &&
                // r.state.actionCount === routerState.actionCount
            ) {
                console.log(r.name, ': ', 'Unmounting b/c finished', r.state, routerState);
                return null;
            } else {
                console.log(r.name, ': ', 'Showing children');
                return realChildren;
            }
        };
        const updated = Object.assign(component, {Link, Animate});
        return {...acc, [routerName]: updated};
    }, {} as Record<string, RouterT>);
};

export const routers = manager.routers;
export const routerComponents = createRouterComponents(routers);
