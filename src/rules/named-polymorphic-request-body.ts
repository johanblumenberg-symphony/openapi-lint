import { Rule, ValidationError, ApiSpec, getAllObjectProperties, hasProperty, getItem } from '../Rule';

export default class NamedPolymorphicRequestBody implements Rule {
    describe() {
        return 'Polymorphic (oneOf) request bodies must be defined as named types, as opposed to being defined' +
            'inline. The Java code generator wont be able to handle them otherwise.';
    }

    validate(json: ApiSpec) {
        getAllObjectProperties(json, 'paths').forEach(({ path, object }) => {
            ['post', 'put', 'patch'].forEach(verb => {
                if (hasProperty(object, verb)) {
                    if (getItem(object, verb + '.requestBody.content.application/json.schema.oneOf')) {
                        throw new ValidationError(`Inline polymorphic body in '${path}' ${verb}. These must be defined as named types.`);
                    }
                }
            });
        });
    }
}
