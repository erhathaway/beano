/**
 * General types
 */
export type Levels = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export type Console = {
    // eslint-disable-next-line
    [level in Levels]: (...params: any[]) => void;
};

/**
 * Argument types
 */
export interface ILoggerOptions {
    level?: Levels;
    collapse?: boolean;
    groupByMessage?: boolean;
}

export interface ILoggerConfig {
    transports?: Transport[];
    scopes?: Scope[];
}

export interface ILoggerBuilderOptions {
    _skipAddingScope?: boolean;
}

// eslint-disable-next-line
export type MergingObject = {[key: string]: any} & ILoggerOptions & ILoggerConfig;
export type Message = string | undefined;

/**
 * Event interface
 */
export interface LogEvent {
    (mergingObject?: MergingObject | Message, message?: Message): void;
    (message?: Message): void;
}

/**
 * Child interface
 */
export interface ChildScope {
    (mergingObject?: MergingObject | Message, message?: Message): ILogger;
    (message?: Message): ILogger;
}

export interface ParentScope {
    (): ILogger;
}

/**
 * Logger interface
 */
export interface ILogger {
    child: ChildScope;
    // parent: ParentScope;
    trace: LogEvent;
    debug: LogEvent;
    info: LogEvent;
    warn: LogEvent;
    error: LogEvent;
    silent: LogEvent;
}

/**
 * Scope passed along to child loggers
 */
export interface Scope {
    message?: string;
    mergingObject?: MergingObject;
}

export type TransportScopeControlFn = () => void;

/**
 * Transport interface
 */
export type Transport = (level: Levels, mergingObject: MergingObject, message?: Message) => void;

/**
 * Browser transport types
 */
export type ScopeReducerAcc = {
    begin: TransportScopeControlFn[];
    end: TransportScopeControlFn[];
    mergingObject: MergingObject;
};
