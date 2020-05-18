import {Levels, MergingObject, LogEvent} from './types';

const transportCaller = (logLevel: Levels, mergeObject: MergingObject): LogEvent => (
    paramOne?: object | string,
    paramTwo?: string
): void => {
    const newMergeObject =
        typeof paramOne === 'object' ? {...mergeObject, ...paramOne} : mergeObject;

    if (newMergeObject.transports === undefined) {
        throw new Error('Missing transports');
    }
    newMergeObject.transports.forEach((t) => {
        if (typeof paramOne === 'string') {
            t(logLevel, newMergeObject, paramOne);
        } else {
            t(logLevel, newMergeObject, paramTwo);
        }
    });
};

export default transportCaller;
