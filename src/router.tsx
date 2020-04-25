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
    id: string;
    classNames: string[];
    finish: Array<Promise<any>>;
};
type Animations = (ctx: AnimationCtx) => void | AnimationCtx;

interface AnimateProps {
    when?: Array<[Predicates, Animations]>;
    children?: (...args: any[]) => React.ReactElement; // | JSX.Element; //(ctx: AnimationCtx) => any;
    // // | Array<React.ReactElement<AnimationCtx> | JSX.Element>
    // React.ReactElement<AnimationCtx> | JSX.Element; //(ctx: AnimationCtx) => any;
}

interface HandleVisiblityProps {
    ctx: AnimationCtx;
    actionCount: number;
    children?: ({
        ctx,
        hasMounted
    }: {
        ctx: AnimationCtx;
        hasMounted: () => void;
    }) => React.ReactElement; // | JSX.Element; //(ctx: AnimationCtx) => any;
}

type RouterT = React.FC<Props> & {
    Link: React.FC<LinkProps>;
    Animate: React.FC<AnimateProps>;
};

interface AnimateableProps {
    // id: string;
    ctx: AnimationCtx;
    id: string;
    hasMounted: () => void;
    children?: Array<string | React.ReactElement>; // (...args: any[]) => React.ReactElement; //(ctx: AnimationCtx) => any;
}

class Animateable extends React.Component<AnimateableProps> {
    static routerPrimitivesType = 'Animateable';
    componentDidMount(): void {
        this.props.hasMounted();
    }
    render() {
        if (this.props.children) {
            return <div id={this.props.id}>{this.props.children}</div>;
        }
        return null;
    }
}
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
        const HandleVisiblity: React.FC<HandleVisiblityProps> = ({ctx, children, actionCount}) => {
            const [state, setState] = useState({ctx, actionCount, transitionState: 'start'});
            // const [state, setState] = useState('start');

            if (
                JSON.stringify(state.ctx) !== JSON.stringify(ctx) ||
                state.actionCount !== actionCount
            ) {
                console.log('setting new state');
                setState({ctx, actionCount, transitionState: 'start'});
            }

            useEffect(() => {
                if (ctx.finish && ctx.finish.length > 0) {
                    Promise.all(ctx.finish).then(() => {
                        console.log('All transistions finished');
                        setState({ctx, actionCount, transitionState: 'end'});
                    });
                }
            }, [actionCount]);

            if (state.transitionState === 'start' || r.state.visible) {
                console.log('SHOWING CHILDREN', r.name, children);
                if ((children as any).routerPrimitivesType) {
                    console.log('OHHH yeah');
                }
                const hasMounted = () => {
                    console.log('Mounted', r.name);
                };
                const stuff = children && children({ctx, hasMounted});
                // console.log('rendering children');
                return <>{stuff}</>;
            }
            console.log('HIDING CHILDREN', r.name);

            return null;
        };

        // eslint-disable-next-line
        const Animate: React.FC<AnimateProps> = ({when, children}) => {
            const [_state, setState] = useState(r.state);
            // const forceUpdate = useForceUpdate();
            useEffect(() => {
                if (r && r.subscribe) {
                    r.subscribe(all => setState(all.current) as any);
                }
                return;
            }, ['startup']);

            const [id] = useId(); // idList: ["id1"]

            const {ctx: animationCtx} = (when || []).reduce(
                (acc, predicateAnimation) => {
                    const {hasRun, ctx} = acc;
                    if (hasRun) {
                        return acc;
                    }
                    const shouldRun = predicateAnimation[0].reduce((accc, predicate) => {
                        return accc && predicate(r as any);
                    }, true);

                    console.log(
                        'Found a predicate for: ',
                        r.name,
                        shouldRun,
                        predicateAnimation[0]
                    );

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
                {hasRun: false, ctx: {id, classNames: [], finish: []}} as {
                    hasRun: boolean;
                    ctx: AnimationCtx;
                }
            );

            console.log('isAnimating', r.name, animationCtx);

            console.log('id', id);
            // children ? children({id}) : null;
            // return <>{children && children(animationCtx)}</>;
            return (
                <HandleVisiblity ctx={animationCtx} actionCount={r.state.actionCount || 0}>
                    {children}
                </HandleVisiblity>
            );
        };
        const updated = Object.assign(component, {Link, Animate});
        return {...acc, [routerName]: updated};
    }, {} as Record<string, RouterT>);
};

export const routers = manager.routers;
export const routerComponents = createRouterComponents(routers);
