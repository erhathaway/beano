import React from 'react';
import {AnimationBinding} from './types';

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

export default Animateable;
