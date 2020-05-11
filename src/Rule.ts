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
