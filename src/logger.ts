interface ILoggerOptions {
    level?: Levels;
    collapse?: boolean;
}

interface IChildOptions {
    collapse?: boolean;
}

interface ILogger {
    child: ChildScope;
    parent: ParentScope;
    info: LogEvent;
    warn: LogEvent;
    debug: LogEvent;
    error: LogEvent;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

interface Scope {
    collapse?: boolean;
    message?: string;
    mergingObject?: object;
}
type TransportScopeControlFn = () => void;
type ScopeReducerAcc = {
    begin: TransportScopeControlFn[];
    end: TransportScopeControlFn[];
    mergingObject: object;
};

type Levels = 'warn' | 'info' | 'error' | 'debug';
type Console = {
    [level in Levels]: (...params: any[]) => void;
};

type Transport = (level: Levels, scope: Scope[], message?: string, mergingObject?: object) => void;

export const browserTransport: Transport = (level, scope, message, mergingObject) => {
    const log: Console = console;
    const scopeControl = scope.reduce(
        (acc, s) => {
            acc.begin.push(() => {
                s.collapse ? console.groupCollapsed(s.message) : console.group(s.message);
            });
            acc.begin.push(() => {
                console.groupCollapsed();
            });
            return {...acc, mergingObject: {...acc.mergingObject, ...s.mergingObject}};
        },
        {begin: [], end: [], mergingObject: {}} as ScopeReducerAcc
    );
    scopeControl.begin.forEach(f => f());
    log[level](message, {...scopeControl.mergingObject, ...mergingObject});
    scopeControl.end.forEach(f => f());
};

interface LogEvent {
    (mergingObject?: object, message?: string): void;
    (message?: string): void;
}
interface ChildScope {
    (mergingObject?: object, message?: string): ILogger;
    (message?: string): ILogger;
}

interface ParentScope {
    (): ILogger;
}

const tansportCaller = (logLevel: Levels, transports: Transport[], scopes: Scope[]): LogEvent => (
    paramOne?: object | string,
    paramTwo?: string
): void => {
    transports.forEach(t => {
        if (typeof paramOne === 'string') {
            t(logLevel, scopes, paramOne);
        } else {
            t(logLevel, scopes, paramTwo, paramOne);
        }
    });
};

export const createLogger = (
    options: ILoggerOptions,
    transports: Transport[],
    _scopes?: Scope[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ILogger => {
    const scopes = _scopes || [];
    const logLevel = options && options.level ? options.level : 'info';
    return {
        child: (paramOne?: object | string, paramTwo?: string) => {
            if (typeof paramOne === 'string') {
                return {...createLogger(options, transports, [...scopes, {message: paramOne}])};
            }
            const newScope =
                typeof paramTwo === 'string'
                    ? {mergingObject: paramOne, message: paramTwo}
                    : {mergingObject: paramOne};
            return createLogger(options, transports, [...scopes, newScope]);
        },
        parent: () => {
            return createLogger(options, transports, [...scopes.slice(0, -1)]);
        },
        info: ['info', 'warn', 'debug', 'error'].includes(logLevel)
            ? tansportCaller('info', transports, scopes)
            : noop,
        warn: ['warn', 'debug', 'error'].includes(logLevel)
            ? tansportCaller('warn', transports, scopes)
            : noop,
        debug: ['debug', 'error'].includes(logLevel)
            ? tansportCaller('debug', transports, scopes)
            : noop,
        error: ['error'].includes(logLevel) ? tansportCaller('error', transports, scopes) : noop
    };
};
