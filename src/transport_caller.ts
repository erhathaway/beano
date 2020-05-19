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
    newMergeObject.transports.forEach(t => {
        if (typeof paramOne === 'string') {
            t(logLevel, newMergeObject, paramOne);
        } else if (typeof paramOne === 'object') {
            t(logLevel, newMergeObject, paramTwo);
        } else {
            throw new Error('Missing merging object');
        }
    });
};

export default transportCaller;
