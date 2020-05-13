import {
    Rule,
    ValidationError,
    ApiSpec,
    getAllObjectProperties,
    hasProperty,
    getProperty, ApiItem
} from '../Rule';

export default class NoNestedTypeWithoutRef implements Rule {
    describe() {
        return 'When nesting types, the nested type must either be a primitive type or a reference type';
    }

    validate(json: ApiSpec) {
        getAllObjectProperties(json, 'components.schemas').forEach(({ object }) => {
            if (hasProperty(object, 'properties')) {
               getAllObjectProperties(object, 'properties').forEach(({path, name, object}) => {
                    if (hasProperty(object, 'type')) {
                        const type = getProperty(object, 'type');
                        if (type === 'array' && hasProperty(object, 'items')) {
                            const items = getProperty(object, 'items');
                            if (items && getProperty(items, 'type') === 'object') {
                                throw new ValidationError(`Nested type ${name} found in ${path}`);
                            }
                        }
                        if (type === 'object') {
                            throw new ValidationError(`Nested type ${name} found in ${path}`);
                        }
                    }
                });
            }
        });
    }
}
