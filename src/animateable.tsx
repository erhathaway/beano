/* eslint-disable react/prop-types */

import React from 'react';
import {AnimationBinding} from './types';

interface AnimateableProps {
    id?: string;
    className?: string;
    animationBinding?: AnimationBinding;
    children?: (animationBinding: AnimationBinding | undefined) => React.ReactElement;
}

const Animateable = React.forwardRef<HTMLDivElement, AnimateableProps>(function animateable(
    props,
    ref
) {
    if (!props.id) {
        throw new Error('Missing id');
    }
    if (!props.animationBinding) {
        throw new Error(
            'No animation binding prop found. This usually means this component (the animateable component) is not directly mounted under an animation component'
        );
    }
    return (
        <div id={props.id} ref={ref} className={props.className}>
            {props.children && props.animationBinding
                ? props.children(props.animationBinding)
                : props.children
                ? props.children
                : null}
        </div>
    );
});

export default Animateable;
