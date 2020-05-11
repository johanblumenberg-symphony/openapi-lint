import { Rule, ValidationError, ApiSpec, getAllObjectProperties, hasProperty, getAllArrayItems } from '../Rule';
import { partition } from 'lodash';

export default class AllOfOnlyRef implements Rule {
    describe() {
        return 'When using allOf, there can be only one allOf item that is not a $ref item, and all properties must be specified in that allOf item';
    }

    validate(json: ApiSpec) {
        getAllObjectProperties(json, 'components.schemas').forEach(({ path, name, object }) => {
            if (hasProperty(object, 'allOf')) {
                const disallowedProps = Object.keys(object)
                    .filter(prop => prop !== 'description' && prop !== 'allOf');
                if (disallowedProps.length > 1) {
                    throw new ValidationError(`Extra properties ${disallowedProps.join(',')} in ${path}`);
                } else if (disallowedProps.length === 1) {
                    throw new ValidationError(`Extra property ${disallowedProps[0]} in ${path}`);
                }

                const allOfItems = getAllArrayItems(object, 'allOf');
                let [ refs, other ] = partition(allOfItems, ({ object }) => Object.keys(object).includes('$ref'));

                if (other.length > 1) {
                    throw new ValidationError(`Too many non-$ref objects in allOf in ${path}`);
                }
                refs.forEach(({ object}) => {
                    if (Object.keys(object).length !== 1) {
                        throw new ValidationError(`$ref objects can only have a single $ref property in ${path}`);
                    }
                });
            }
        });
    }
}
