export type AnimationState = 'restarting' | 'initalizing' | 'running' | 'finished' | 'unmounted';

export type NotifyParentOfState = (id: string, state: AnimationState) => void;

export type AnimationBinding = {
    notifyParentOfState: NotifyParentOfState;
    parentState: AnimationState;
    parentVisible: boolean;
};
