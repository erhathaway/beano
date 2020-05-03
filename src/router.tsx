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

    animationBinding?: AnimationBinding;
    enterAfterParentStart?: boolean;
    enterAfterParentFinish?: boolean;
    exitAfterChildStart?: boolean;
    exitAfterChildFinish?: boolean;

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

type AnimationBinding = {
    notifyParentOfState: (state: AnimationState | undefined) => void;
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

// export interface AnimationControl {
//     finished?: Promise<any>;
//     pause?: (...args: any[]) => any;
// }

export type ChildrenState = Record<string, AnimationState>;

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
            unMountOnShow,
            enterAfterParentStart,
            enterAfterParentFinish,
            exitAfterChildStart,
            exitAfterChildFinish,
            // exitAfterChildStart,

            animationBinding
        }) => {
            // const [shouldUnmountNode, setShouldUnmountNode] = useState<boolean>(false);

            const [routerState, setRouterState] = useState(r.state);
            const [hasRunForCycle, setHasRunForCycle] = useState<boolean>(false);
            const [childState, setChildState] = useState<AnimationState>();
            const [ref, setRef] = useState<HTMLElement | null>();

            const refId = ref ? ref.id : undefined;

            const visible = r.state.visible || false;
            '';
            const [currentState, setCurrentState] = useState<AnimationState>('initalizing');
            console.log(r.name, ': ', 'START------------ref', refId, 'currentState:', currentState);

            const createAnimationControl = () => {
                const ac = new AnimationControl();
                ac.setOnFinishAction(() => {
                    // console.log(r.name, ': OHHHHHH yeah resolving');
                    // console.log(r.name, ': ', 'Promise resolved. Setting state to finished');
                    setCurrentState(currentState =>
                        currentState === 'running' ? 'finished' : currentState
                    );
                });
                return ac;
            };

            // TODO enable setting of animation control
            const [animationControl, setAnimationControl] = useState<AnimationControl>(
                createAnimationControl()
            );

            // setCurrentState((s) => {

            // })
            // 'initalizing'

            useEffect(() => {
                if (animationBinding) {
                    console.log(r.name, ': ', 'Notifying parent of state', currentState);

                    animationBinding.notifyParentOfState(currentState);
                }
                return () => {
                    if (animationBinding) {
                        console.log(r.name, ': ', 'Unmounting from unmount action');

                        animationBinding.notifyParentOfState('unmounted');
                    }
                };
            }, [currentState]);
            /**
             * Subscribe to router state changes
             */
            useEffect(() => {
                if (r && r.subscribe) {
                    // setRouterState(r.state);
                    // setCurrentState('initalizing');
                    r.subscribe(all => {
                        // ref && anime.remove(ref);
                        // console.log('Lifecycle: new animation: ', currentState);
                        // if (currentState === 'running') {
                        setAnimationControl(c => {
                            // c.cancel();
                            // return c;
                            c.cancel();
                            return createAnimationControl();
                        });
                        setCurrentState(current => {
                            if (current === 'running') {
                                console.log(
                                    r.name,
                                    ': ',
                                    'Setting state to restarting in subscribe fn'
                                );
                                return 'restarting';
                            } else {
                                if (!all.current.visible && ref === undefined) {
                                    console.log(
                                        r.name,
                                        ': ',
                                        'Setting state to unmounted in subscribe fn'
                                    );
                                    return 'unmounted';
                                } else {
                                    console.log(
                                        r.name,
                                        ': ',
                                        'Setting state to initializing in subscribe fn'
                                    );
                                    return 'initalizing';
                                }
                                // TODO keep changing the initial state away from 'iniatlizing' to 'undefined'
                                // if the component is mounted change it to initalizing
                                // if the component is visible and unmouunted change it to initalizing
                                // otherwise, keep it as undefined
                                // TOOD change from undefined to 'unmounted'
                                // unmounted -> restarting -> initalizing -> running -> finished

                                // return 'unmounted';
                            }
                        });
                        // } else {
                        //     setCurrentState('initalizing');
                        // }

                        setHasRunForCycle(false);

                        setRouterState(all.current) as any;
                    });
                }
                return;
            }, ['startup']);

            // if (shouldUnmountNode) {
            //     console.log(r.name, ':************ ', 'Node unmountting');
            //     setShouldUnmountNode(false);
            //     return null;
            // }
            // useEffect(() => {
            //     console.log(r.name, ': ', 'Node unmounted');

            //     setShouldUnmountNode(false);
            //     // setCurrentState('initalizing');
            //     // setHasRunForCycle(false);
            //     console.log(r.name, ': ', 'Updated action count', routerState.actionCount);
            // }, [shouldUnmountNode]);

            const animate = (node: HTMLElement) => {
                // console.log(`-----node: `, r.name, node);
                return (when || []).reduce(
                    (acc, predicateAnimation) => {
                        // console.log('checking predicateAnimations');
                        const {hasRun, ctx} = acc;
                        if (hasRun) {
                            return acc;
                        }
                        const shouldRun = predicateAnimation[0].reduce((accc, predicate) => {
                            return accc && predicate(r as any);
                        }, true);
                        // console.log('shouldRun', shouldRun);

                        // console.log(
                        //     'Found a predicate for: ',
                        //     r.name,
                        //     shouldRun,
                        //     predicateAnimation[0]
                        // );

                        if (shouldRun) {
                            // console.log('Found predicate animation to run');
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
                // setCurrentState('initalizing');
                // setHasRunForCycle(false);
                console.log(r.name, ': ', 'Updated action count', routerState.actionCount);
            }, [routerState.actionCount]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated ref', refId);
                if (!refId) {
                    console.log(r.name, ': ', 'Updated to no ref', refId);

                    // setCurrentState('initalizing');
                }
            }, [refId]);

            const parentState = (animationBinding && animationBinding.parentState) || 'initalizing';

            useEffect(() => {
                console.log(r.name, ': ', 'Updated parentState', parentState);
            }, [parentState]);
            /**
             * Run animations whenever there is a state change
             */
            useEffect(() => {
                console.log(r.name, ': ', 'Child state:', childState);

                if (currentState === 'restarting') {
                    return;
                }
                // console.log('Action count or ref updated', r.name, ref);
                if (ref == null) {
                    console.log(r.name, ': ', 'WOULD PAUSE / STOP IF COULD');
                    if (animationControl.cancel) {
                        console.log(r.name, ': ', 'Canceling animation');

                        animationControl.cancel();
                    }
                    if (currentState !== 'initalizing') {
                        console.log(r.name, ': ', 'Setting Animation lifecycle to: initalizing');
                        // setCurrentState('initalizing');
                    }
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

                if (
                    !visible &&
                    exitAfterChildStart &&
                    childState !== 'running' &&
                    childState !== 'finished'
                ) {
                    console.log(r.name, ': ', 'Waiting for child to start');
                    return;
                }

                // if (enterAfterParentStart && parentState === 'finished') {
                //     return;
                // }

                if (visible && enterAfterParentFinish && parentState !== 'finished') {
                    console.log(r.name, ': ', 'Waiting for parent to finish');
                    return;
                }

                if (
                    !visible &&
                    exitAfterChildFinish &&
                    childState !== 'finished' &&
                    childState !== 'unmounted' // will change to undefined if unmounted
                ) {
                    console.log(r.name, ': ', 'Waiting for child to finish');
                    return;
                }

                // if (
                //     exitAfterChildStart &&
                //     childState !== 'running' &&
                //     childState !== 'finished'
                // ) {
                //     console.log(r.name, ': ', 'Waiting for child to start');
                //     return;
                // }

                // animate(ref);
                if (hasRunForCycle === true) {
                    console.log(r.name, ': ', 'Has already run for cycle. Not running animation');

                    return;
                }
                console.log(r.name, ': ', 'Running animation');

                // if (shouldUnmountNode === false) {
                //     setShouldUnmountNode(true);
                //     return;
                // }
                setHasRunForCycle(true);
                const {ctx: animationCtx, hasRun} = animate(ref);
                console.log(r.name, ': ', 'Animation running with', hasRun, animationCtx);
                // console.log('refCallback hasRun', r.name, hasRun);
                if (hasRun) {
                    setCurrentState('running');
                }
                if (animationCtx.finish.length > 0) {
                    animationControl.createOnFinishPromise(animationCtx.finish);
                    // Promise.all(animationCtx.finish).then(() => {
                    //     console.log(r.name, ': ', 'Promise resolved. Setting state to finished');
                    //     setCurrentState('finished');
                    // });
                } else {
                    console.log(
                        r.name,
                        ': ',
                        'No finish promises found. Setting state to finished'
                    );
                    setCurrentState('finished');
                }
            }, [routerState.actionCount, refId, parentState, childState, hasRunForCycle]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated currentState', currentState);
            }, [currentState]);
            const [id] = useId();

            // const refCallback = (node: HTMLDivElement): void => {
            //     console.log('refCallback triggered', r.name, node);
            //     // console.log('THIS IS MY NODE', node);
            //     if (!node) {
            //         console.log('refCallback no node found', r.name);

            //         // setCurrentState('finished');
            //         return;
            //     }
            //     const {ctx: animationCtx, hasRun} = animate(node);
            //     console.log('refCallback hasRun', r.name, hasRun);

            //     // if (hasRun) {
            //     //     setCurrentState('running');
            //     // }

            //     // if (animationCtx.finish.length > 0) {
            //     //     Promise.all(animationCtx.finish).then(() => {
            //     //         setCurrentState('finished');
            //     //     });
            //     // } else {
            //     //     setCurrentState('finished');
            //     // }
            // };

            // console.log('-- ANIMATION LIFECYCLE: ', r.name, currentState);

            // if (ref == null && routerState.visible === false) {
            //     return null;
            // }
            useEffect(() => {
                if (currentState === 'restarting') {
                    console.log(r.name, 'Lifecycle ohhhh maybe');
                    setCurrentState('initalizing');
                    // return null;
                }
            }, [currentState]);

            if (currentState === 'restarting') {
                console.log(r.name, 'Lifecycle ohhhh yeah');
                // setCurrentState('initalizing');
                return null;
            }
            if (ref == null && unMountOnHide && visible === false) {
                return null;
            }
            if (ref == null && visible === false) {
                return null;
            }

            const setRefTest = (ref: HTMLElement) => {
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
                      ref: setRefTest,
                      id,
                      animationBinding: {
                          notifyParentOfState: setChildState,
                          parentState: currentState
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
            // if (
            //     !visible &&
            //     exitAfterChildStart &&
            //     childState !== 'running' &&
            //     childState !== 'finished'
            // ) {
            //     console.log(r.name, ': ', 'Waiting for child to start');
            //     return null;
            // }
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
                currentState === 'finished' &&
                r.state.actionCount === routerState.actionCount
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
