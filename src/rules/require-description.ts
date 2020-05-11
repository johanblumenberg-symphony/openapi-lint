import { Rule, ValidationError, ApiSpec, getAllObjectProperties, hasProperty } from '../Rule';

export default class AllOfOnlyRef implements Rule {
    describe() {
        return 'All component definitions must have a description';
    }

    validate(json: ApiSpec) {
        getAllObjectProperties(json, 'components.schemas').forEach(({ path, object }) => {
            if (!hasProperty(object, 'description')) {
                throw new ValidationError(`Missing description in ${path}`);
            }
        });
    }
}
