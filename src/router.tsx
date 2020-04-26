import React, {useState, useCallback, useEffect} from 'react';
import {useId} from 'react-id-generator';

import {Manager, IRouterDeclaration, RouterInstance} from 'router-primitives';

const routerDeclaration: IRouterDeclaration<any> = {
    name: 'root',
    children: {
        scene: [{name: 'sun'}, {name: 'moon', defaultAction: ['show']}],
        feature: [{name: 'trees'}, {name: 'mountains'}, {name: 'river'}]
    }
};

const manager = new Manager({routerDeclaration});

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

type RouterT = React.FC<Props> & {
    Link: React.FC<LinkProps>;
    Animate: React.FC<AnimateProps>;
};

interface AnimateableProps {
    id?: string;
    className?: string;
    children?: any; //(...args: any[]) => any; //React.ReactElement | JSX.Element | React.Component; //Array<string | React.ReactElement>; // (...args: any[]) => React.ReactElement; //(ctx: AnimationCtx) => any;
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
            {props.children}
        </div>
    );
});
export {Animateable};

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
            unMountOnShow
        }) => {
            const [_state, setState] = useState(r.state);
            const [animationLifecycle, setAnimationLifecycle] = useState<
                'initalizing' | 'running' | 'finished'
            >('initalizing');

            useEffect(() => {
                if (r && r.subscribe) {
                    setState(r.state);
                    setAnimationLifecycle('initalizing');
                    r.subscribe(all => setState(all.current) as any);
                }
                return;
            }, ['startup']);

            const [id] = useId();

            const animate = (node: HTMLElement) => {
                // console.log(`-----node: `, r.name, node);
                return (when || []).reduce(
                    (acc, predicateAnimation) => {
                        const {hasRun, ctx} = acc;
                        if (hasRun) {
                            return acc;
                        }
                        const shouldRun = predicateAnimation[0].reduce((accc, predicate) => {
                            return accc && predicate(r as any);
                        }, true);

                        // console.log(
                        //     'Found a predicate for: ',
                        //     r.name,
                        //     shouldRun,
                        //     predicateAnimation[0]
                        // );

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

            const refCallback = (node: HTMLDivElement): void => {
                console.log('refCallback triggered', r.name, node);
                // console.log('THIS IS MY NODE', node);
                if (!node) {
                    console.log('refCallback no node found', r.name);

                    // setAnimationLifecycle('finished');
                    return;
                }
                const {ctx: animationCtx, hasRun} = animate(node);
                console.log('refCallback hasRun', r.name, hasRun);

                // if (hasRun) {
                //     setAnimationLifecycle('running');
                // }

                // if (animationCtx.finish.length > 0) {
                //     Promise.all(animationCtx.finish).then(() => {
                //         setAnimationLifecycle('finished');
                //     });
                // } else {
                //     setAnimationLifecycle('finished');
                // }
            };

            console.log('-- ANIMATION LIFECYCLE: ', r.name, animationLifecycle);

            const realChildren = children
                ? React.cloneElement(children as any, {ref: refCallback, id})
                : null;
            if (unMountOnShow && animationLifecycle === 'finished' && r.state.visible) {
                return null;
            } else if (unMountOnHide && animationLifecycle === 'finished' && !r.state.visible) {
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
