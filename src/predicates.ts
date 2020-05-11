import {Predicate} from './types';

const isVisible: Predicate = (_, {visible}) => visible;
const isHidden: Predicate = (_, {visible}) => !visible;

export default {
    isVisible,
    isHidden
};
