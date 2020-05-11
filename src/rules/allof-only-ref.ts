import { Rule, walk, ObserverBase, Observer, ApiItem, ValidationError, ApiSpec } from '../Rule';

export default class AllOfOnlyRef extends ObserverBase implements Rule, Observer {
    describe() {
        return 'allOf: should only specify $ref elements';
    }

    validate(json: ApiSpec) {
        walk(json, this);
    }

    onObjectEntry(object: string, key: string, _entry: ApiItem) {
        if (object === 'allOf' && key !== '$ref') {
            throw new ValidationError('allOf: should only contain $ref elements');
        }
    }
}
