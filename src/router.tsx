import React, {useState, useCallback, useEffect, ReactElement} from 'react';
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
type Animations = (id: string) => void;
interface AnimateProps {
    when?: Array<[Predicates, Animations]>;
    children?: ({id}: {id: string}) => any;
}

type RouterT = React.FC<Props> & {
    Link: React.FC<LinkProps>;
    Animate: React.FC<AnimateProps>;
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
            const link = r.link(action);
            return (
                <a href={undefined} title={link}>
                    <a onClick={() => r[action]()}>{children}</a>
                </a>
            );
        };
        // eslint-disable-next-line
        const Animate: React.FC<AnimateProps> = ({when, children}) => {
            const [_state, setState] = useState(r.state);
            useEffect(() => {
                if (r && r.subscribe) {
                    r.subscribe(all => setState(all.current) as any);
                }
                return;
            }, ['startup']);

            const [id] = useId(); // idList: ["id1"]

            const isAnimating = (when || []).reduce((hasRun, predicateAnimation) => {
                if (hasRun) {
                    return hasRun;
                }
                const shouldRun = predicateAnimation[0].reduce((acc, predicate) => {
                    return acc && predicate(r as any);
                }, true);
                console.log('Found a predicte should run', shouldRun, predicateAnimation[0]);
                if (shouldRun) {
                    predicateAnimation[1](id);
                    return true;
                }
                return hasRun;
            }, false);

            console.log('isAnimating', isAnimating);

            console.log('id', id);
            // children ? children({id}) : null;
            return <>{children && children({id})}</>;
        };
        const updated = Object.assign(component, {Link, Animate});
        return {...acc, [routerName]: updated};
    }, {} as Record<string, RouterT>);
};

export const routers = manager.routers;
export const routerComponents = createRouterComponents(routers);
