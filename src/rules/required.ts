import { Rule, ValidationError, ApiSpec, getAllObjectProperties, hasProperty, getAllArrayItems } from '../Rule';

export default class Required implements Rule {
  describe() {
    return 'All required properties must be part of the properties of the object';
  }

  validate(json: ApiSpec) {
    getAllObjectProperties(json, 'components.schemas').forEach(({ path, object }) => {
      getAllArrayItems(object, 'required').forEach(({ object: required }) => {
        if (typeof required !== 'string') {
          throw new ValidationError(`Property ${path} must be of type string`);
        }
        if (!hasProperty(object, `properties.${required}`)) {
          throw new ValidationError(`Missing required property ${required} in ${path}`);
        }
      });
    });
  }
}
