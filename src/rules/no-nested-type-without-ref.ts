import {
    Rule,
    ValidationError,
    ApiSpec,
    getAllObjectProperties,
    hasProperty,
    getProperty
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
                            const itemType = Object.keys(getProperty(object, 'items') as any)[0];
                            if (itemType === 'object') {
                                throw new ValidationError(`Invalid nested type ${name} found in ${path}`);
                            }
                        }
                        if (type === 'object') {
                            throw new ValidationError(`Invalid nested type ${name} found in ${path}`);
                        }
                    }
                });
            }
        });
    }
}
