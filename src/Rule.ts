import { pathExistsSync } from "fs-extra";

export type ApiItem = { [ key: string ]: ApiItem } | ApiItem[] | string | number;

export interface ApiSpec {
    [ key: string ]: ApiItem;
}

export interface Rule {
    validate(json: ApiSpec): void;
    describe(): string;
}

export interface Observer {
    onObjectEntry(object: string, key: string, entry: ApiItem): void;
    onArrayItem(array: string, index: number, item: ApiItem): void;
}

export class ObserverBase implements Observer {
    onObjectEntry(_object: string, _key: string, _entry: ApiItem) {}
    onArrayItem(_array: string, _index: number, _item: ApiItem) {}
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

function _walk(path: string, object: string, json: ApiItem, observer: Observer) {
    if (Array.isArray(json)) {
        json.forEach((item, index) => {
            const p = `${path}[${index}]`;
            try {
                observer.onArrayItem(object, index, item);
            } catch (e) {
                if (e.name === 'ValidationError') {
                    throw new Error(`Error in "${p}": ${e.message}`);
                } else {
                    throw e;
                }
            }
            _walk(p, object, item, observer);
        });
    } else if (typeof json === 'object') {
        Object.keys(json).forEach(key => {
            const p = `${path}.${key}`;
            try {
                observer.onObjectEntry(object, key, json[key]);
            } catch (e) {
                if (e.name === 'ValidationError') {
                    throw new Error(`Error in "${p}": ${e.message}`);
                } else {
                    throw e;
                }
            }
            _walk(p, key, json[key], observer);
        });
    }
}

export function walk(json: ApiSpec, observer: Observer) {
    Object.keys(json).forEach(key => {
        _walk('<root>', key, json[key], observer);
    });
}

export function isObject(json: ApiItem): json is { [ key: string ]: ApiItem }  {
    return !!json && !Array.isArray(json) && typeof json === 'object';
}

export function isArray(json: ApiItem): json is ApiItem[] {
    return Array.isArray(json);
}

export function hasProperty(json: ApiItem, prop: string): boolean {
    return isObject(json) && json[prop] !== undefined;
}

export function getProperty(json: ApiItem, prop: string): ApiItem | undefined {
    return isObject(json) ? json[prop] : undefined;
}

export function isRequired(json: ApiItem, prop: string): boolean {
    return getAllArrayItems(json, 'required').some(({ object }) => object === prop);
}

export function getItem(json: ApiItem, path: string): ApiItem | undefined {
    let obj: ApiItem | undefined = json;

    path.split('.').forEach(p => {
        if (obj && isObject(obj)) {
            obj = obj[p];
        } else {
            obj = undefined;
        }
    });
    return obj;
}

export function getAllObjectProperties(json: ApiItem, path: string): { path: string, name: string, object: ApiItem }[] {
    const obj = getItem(json, path);

    if (obj && isObject(obj)) {
        return Object.keys(obj).map(prop => ({
            path: `${path}.${prop}`,
            name: prop,
            object: obj[prop],
        }));
    } else {
        return [];
    }
}

export function getAllArrayItems(json: ApiItem, path: string): { path: string, object: ApiItem }[] {
    const arr = getItem(json, path);

    if (arr && isArray(arr)) {
        return arr.map((item, index) => ({
            path: `${path}[${index}]`,
            object: item,
        }));
    } else {
        return [];
    }
}

export function lookupRef(json: ApiSpec, path: string): ApiItem {
    if (path.startsWith('#/')) {
        let obj: ApiItem = json;

        path.substring(2).split('/').forEach(p => {
            if (isObject(obj)) {
                obj = obj[p];
            } else {
                throw new Error(`unknown ref: ${path}`);
            }
        });

        return obj;
    } else {
        throw new Error(`Unknown $ref format: ${path}`);
    }
}
