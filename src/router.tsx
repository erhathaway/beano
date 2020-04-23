import React, {useState, useCallback, useEffect} from 'react';

import {Manager, IRouterDeclaration} from 'router-primitives';

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

type RouterT = React.FC<Props> & {
    Link: React.FC<LinkProps>;
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
        const Link: React.FC<LinkProps> = ({children, action}) => {
            const link = r.link(action);
            return (
                <a href={undefined} title={link}>
                    <a onClick={() => r[action]()}>{children}</a>
                </a>
            );
        };
        const updated = Object.assign(component, {Link});
        return {...acc, [routerName]: updated};
    }, {} as Record<string, RouterT>);
};

export const routers = manager.routers;
export const routerComponents = createRouterComponents(routers);
