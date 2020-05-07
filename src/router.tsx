/* eslint-disable react/prop-types */

import React, {useState, useEffect} from 'react';

import {
    Manager,
    IRouterDeclaration,
    RouterInstance,
    IRouterTemplates,
    IOutputLocation
} from 'router-primitives';
import {AnimationBinding} from './types';
import BaseAnimate from './animate';

const rocketFeatures = [{name: 'engine'}];
const moonFeatures = [{name: 'rocket', children: {feature: rocketFeatures}}];
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

interface RouterAnimateProps {
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
}

type RouterT = React.FC<Props> & {
    Link: React.FC<LinkProps>;
    Animate: React.FC<RouterAnimateProps>;
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
        const Animate: React.FC<RouterAnimateProps> = ({
            when,
            children,
            unMountOnHide,
            id,

            enterAfterParentStart,
            enterAfterParentFinish,
            exitAfterChildStart,
            exitAfterChildFinish,

            animationBinding
        }) => {
            const [_triggerState, setTriggerState] = useState<typeof r.state>({
                visible: r.state.visible,
                data: r.state.data,
                actionCount: r.state.actionCount
            });

            useEffect(() => {
                // console.log(r.name, 'new router state');
                if (r && r.subscribe) {
                    r.subscribe(all => {
                        const state = all.current;
                        setTriggerState({
                            visible: state.visible,
                            data: state.data,
                            actionCount: state.actionCount
                        });
                    });
                }
                return;
            }, ['startup']);

            // console.log(
            //     'hurrrr',
            //     r.name,
            //     _triggerState.visible
            //     // _triggerState,
            //     // r,
            //     // '******',
            //     // children
            // );
            return (
                <BaseAnimate
                    name={r.name}
                    visible={_triggerState.visible}
                    triggerState={_triggerState}
                    predicateState={r as any}
                    when={when}
                    unMountOnHide={unMountOnHide}
                    id={id}
                    enterAfterParentStart={enterAfterParentStart}
                    enterAfterParentFinish={enterAfterParentFinish}
                    exitAfterChildStart={exitAfterChildStart}
                    exitAfterChildFinish={exitAfterChildFinish}
                    animationBinding={animationBinding}
                >
                    {children}
                </BaseAnimate>
            );
        };
        const updated = Object.assign(component, {Link, Animate});
        return {...acc, [routerName]: updated};
    }, {} as Record<string, RouterT>);
};

export const routers = manager.routers;
export const routerComponents = createRouterComponents(routers);
