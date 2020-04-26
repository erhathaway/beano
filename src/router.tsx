import React, {useState, useCallback, useEffect} from 'react';
import {useId} from 'react-id-generator';

import {
    Manager,
    IRouterDeclaration,
    RouterInstance,
    IManager,
    IRouterTemplates,
    IOutputLocation
} from 'router-primitives';

const moonFeatures = [{name: 'rocket'}];
const sunFeatures = [{name: 'river', defaultAction: ['show']}];

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
    waitForParentToStart?: boolean;
    waitForParentToFinish?: boolean;
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

type AnimationState = 'initalizing' | 'running' | 'finished';

type AnimationBinding = {
    notifyParentOfState: (state: AnimationState) => void;
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
    children?: (animationBinding: AnimationBinding) => any; //(...args: any[]) => any; //React.ReactElement | JSX.Element | React.Component; //Array<string | React.ReactElement>; // (...args: any[]) => React.ReactElement; //(ctx: AnimationCtx) => any;
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
            {props.children(props.animationBinding)}
        </div>
    );
});
export {Animateable};

export interface AnimationControl {
    finished?: Promise<any>;
    pause?: (...args: any[]) => any;
}

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
            waitForParentToStart,
            waitForParentToFinish,
            animationBinding
        }) => {
            const [routerState, setRouterState] = useState(r.state);
            const [hasRunForCycle, setHasRunForCycle] = useState<boolean>(false);
            const [childAnimationState, setChildAnimationState] = useState<AnimationState>(
                undefined
            );
            const [ref, setRef] = useState<HTMLElement | null>();
            const [animationControl, setAnimationControl] = useState<AnimationControl>({
                finished: Promise.resolve(null)
                // pause: () => {}
            });
            const [animationLifecycle, setAnimationLifecycle] = useState<AnimationState>(
                'initalizing'
            );

            /**
             * Subscribe to router state changes
             */
            useEffect(() => {
                if (r && r.subscribe) {
                    // setRouterState(r.state);
                    // setAnimationLifecycle('initalizing');
                    r.subscribe(all => setRouterState(all.current) as any);
                }
                return;
            }, ['startup']);

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
                setHasRunForCycle(false);
                console.log(r.name, ': ', 'Updated action count', routerState.actionCount);
            }, [routerState.actionCount]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated ref', ref);
                if (!ref) {
                    // setAnimationLifecycle('initalizing');
                }
            }, [ref]);

            const parentState = (animationBinding && animationBinding.parentState) || 'inializing';

            useEffect(() => {
                console.log(r.name, ': ', 'Updated parentState', parentState);
            }, [parentState]);
            /**
             * Run animations whenever there is a state change
             */
            useEffect(() => {
                // console.log('Action count or ref updated', r.name, ref);
                if (ref == null) {
                    console.log(r.name, ': ', 'Skipping running of animation b/c ref missing');
                    if (animationControl.pause) {
                        animationControl.pause();
                    }
                    if (animationLifecycle !== 'initalizing') {
                        console.log(r.name, ': ', 'Setting Animation lifecycle to: initalizing');
                        // setAnimationLifecycle('initalizing');
                    }
                    return;
                }
                if (
                    waitForParentToStart &&
                    parentState !== 'running' &&
                    parentState !== 'finished'
                ) {
                    console.log(r.name, ': ', 'Waiting for parent to finish');

                    return;
                }

                // if (waitForParentToStart && parentState === 'finished') {
                //     return;
                // }

                if (waitForParentToFinish && parentState !== 'finished') {
                    console.log(r.name, ': ', 'Waiting for parent to finish');
                    return;
                }

                // animate(ref);
                console.log(r.name, ': ', 'Running animation');
                if (hasRunForCycle === true) {
                    return;
                }

                setHasRunForCycle(true);
                const {ctx: animationCtx, hasRun} = animate(ref);
                // console.log('refCallback hasRun', r.name, hasRun);
                if (hasRun) {
                    setAnimationLifecycle('running');
                }
                if (animationCtx.finish.length > 0) {
                    Promise.all(animationCtx.finish).then(() => {
                        setAnimationLifecycle('finished');
                    });
                } else {
                    setAnimationLifecycle('finished');
                }
            }, [routerState.actionCount, ref, parentState, hasRunForCycle]);

            useEffect(() => {
                console.log(r.name, ': ', 'Updated animationLifecycle', animationLifecycle);
            }, [animationLifecycle]);
            const [id] = useId();

            // const refCallback = (node: HTMLDivElement): void => {
            //     console.log('refCallback triggered', r.name, node);
            //     // console.log('THIS IS MY NODE', node);
            //     if (!node) {
            //         console.log('refCallback no node found', r.name);

            //         // setAnimationLifecycle('finished');
            //         return;
            //     }
            //     const {ctx: animationCtx, hasRun} = animate(node);
            //     console.log('refCallback hasRun', r.name, hasRun);

            //     // if (hasRun) {
            //     //     setAnimationLifecycle('running');
            //     // }

            //     // if (animationCtx.finish.length > 0) {
            //     //     Promise.all(animationCtx.finish).then(() => {
            //     //         setAnimationLifecycle('finished');
            //     //     });
            //     // } else {
            //     //     setAnimationLifecycle('finished');
            //     // }
            // };

            // console.log('-- ANIMATION LIFECYCLE: ', r.name, animationLifecycle);

            if (ref == null && routerState.visible === false) {
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
                          notifyParentOfState: setChildAnimationState,
                          parentState: animationLifecycle
                      }
                  })
                : null;
            if (waitForParentToStart && parentState !== 'running' && parentState !== 'finished') {
                console.log(r.name, ': ', 'Waiting for parent');
                return null;
            }
            if (waitForParentToFinish && parentState !== 'finished') {
                console.log(r.name, ': ', 'Waiting for parent');
                return null;
            }
            if (unMountOnShow && animationLifecycle === 'finished' && r.state.visible) {
                console.log('Unmounting children');
                return null;
            } else if (unMountOnHide && animationLifecycle === 'finished' && !r.state.visible) {
                console.log('Unmounting children');
                return null;
            } else {
                return realChildren;
            }
        };
        const updated = Object.assign(component, {Link, Animate});
        return {...acc, [routerName]: updated};
    }, {} as Record<string, RouterT>);
};

export const routers = manager.routers;
export const routerComponents = createRouterComponents(routers);
