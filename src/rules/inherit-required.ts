import { Rule, ValidationError, ApiSpec, getAllObjectProperties, getAllArrayItems, isRequired, lookupRef } from '../Rule';
import { partition } from 'lodash';

export default class AllOfOnlyRef implements Rule {
    describe() {
        return 'When overriding an inherited property, it must be required if the inherited property is required';
    }

    validate(json: ApiSpec) {
        getAllObjectProperties(json, 'components.schemas').forEach(({ path, object }) => {
            let allOfItems = getAllArrayItems(object, 'allOf');
            let [ refs, other ] = partition(allOfItems, ({ object }) => Object.keys(object).includes('$ref'));

            let refObjs = refs.map(({ object }) => lookupRef(json, (object as any).$ref));

            if (other.length) {
                getAllObjectProperties(other[0].object, 'properties').forEach(({ name }) => {
                    const req = isRequired(other[0].object, name);
                    const inheritReq = refObjs.some(ref => isRequired(ref, name));

                    if (!req && inheritReq) {
                        throw new ValidationError(`Property ${name} of ${path} must be required`);
                    }
                });
            }
        });
    }
}
