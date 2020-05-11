/* eslint-disable react/prop-types */

import React, {useState, useEffect} from 'react';
import {IOutputLocation, IManager} from 'router-primitives';

import {AnimationBinding, When} from './types';
import BaseAnimate from './animate';

interface Props {
    children?: React.ReactNode;
}

interface LinkProps {
    action: 'show' | 'hide';
    children?: React.ReactNode;
}

interface RouterAnimateProps {
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

type RouterT = React.FC<Props> & {
    Link: React.FC<LinkProps>;
    Animate: React.FC<RouterAnimateProps>;
};

export const createRouterComponents = (routers: IManager['routers']): Record<string, RouterT> => {
    return Object.keys(routers).reduce((acc, routerName) => {
        const r = routers[routerName];

        // eslint-disable-next-line
        const component: React.FC<Props> = ({children}) => {
            const [state, setState] = useState(r.state);
            useEffect(() => {
                if (r && r.subscribe) {
                    r.subscribe(all => setState(all.current));
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
            // eslint-disable-next-line
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

            return (
                <BaseAnimate
                    name={r.name}
                    visible={_triggerState.visible}
                    triggerState={_triggerState}
                    predicateState={r}
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
