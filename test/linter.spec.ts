import { Linter } from '../src/Linter';
import * as expect from 'expect';
import { ApiItem, ApiSpec } from '../src/Rule';

function spec(obj: { [ key: string ]: ApiItem }): ApiSpec {
    return {
        openapi: '3.0.0',
        info: {
            title: 'abc',
            version: '1.0.0',
        },

        ...obj,
    };
}

function endpoint(verb: string, content: ApiItem) {
    return spec({
        paths: {
            '/test': {
                [verb]: content
            }
        },
        components: {
            schemas: { }
        }
    });
}

function requestContent(verb: string, content: ApiItem) {
    return endpoint(verb, {
        requestBody: {
            content: content
        },
        responses: {
            '200': {
                description: 'abc'
            }
        }
    });
}

function responseContent(content: ApiItem) {
    return endpoint('get', {
        responses: {
            '200': {
                description: 'abc',
                content
            }
        }
    });
}

function component(content: ApiItem) {
    return spec({
        paths: {
            '/test': { }
        },
        components: {
            schemas: content
        }
    });
}

describe('Linter', () => {
    let linter: Linter;

    beforeEach(() => {
        linter = new Linter({});
    });

    describe('no-nested-type_without-ref', () => {
        it('should throw error when encountering nested type that is not a primitive or reference type', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            type: 'object'
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).toThrow(/Nested type prop1 found in properties.prop1/);
        });

        it('should not throw error when a nested type is string', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            type: 'string'
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should not throw error when a nested type is boolean', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            type: 'boolean'
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should not throw error when a nested type is integer', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            type: 'integer'
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should not throw error when a nested type is a reference type', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            $ref: 'some ref'
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should throw error when a nested type is an array and its item is object', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            description: 'cde',
                            type: 'array',
                            items: {
                                type: 'object'
                            }
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).toThrow(/Nested type prop1 found in properties.prop1/);
        });

        it('should not throw error when a nested type is an array and its item type is a primitive', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should not throw error when a nested type is an array and its item has a reference type', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    properties: {
                        prop1: {
                            type: 'array',
                            items: {
                                $ref: 'some ref'
                            }
                        }
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });
    });

    describe('require-description', () => {
        it('should reject component without description', () => {
            let input = component({
                MyComponent: {
                    type: 'object',
                }
            });
            expect(() => linter.lint(input)).toThrow(/Missing description in components.schemas.MyComponent/);
        });

        it('should accept component with description', () => {
            let input = component({
                MyComponent: {
                    description: 'abc',
                    type: 'object',
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });
    });

    describe('allof', () => {
        it('should reject allOf with extra properties in ref item', () => {
            let input = component({
                Other: {
                    description: 'abc',
                    properties: {}
                },
                MyComponent: {
                    description: 'abc',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Other',
                            properties: {}
                        }
                    ]
                }
            });
            expect(() => linter.lint(input)).toThrow(/\$ref objects can only have a single \$ref property in components.schemas.MyComponent/);
        });

        it('should reject allOf with multiple property items', () => {
            let input = component({
                Other: {
                    description: 'abc',
                    properties: {}
                },
                MyComponent: {
                    description: 'abc',
                    allOf: [
                        {
                            properties: {}
                        },
                        {
                            properties: {}
                        }
                    ]
                }
            });
            expect(() => linter.lint(input)).toThrow(/Too many non-\$ref objects in allOf in components.schemas.MyComponent/);
        });

        it('should reject component with allOf and properties', () => {
            let input = component({
                Other: {
                    description: 'abc',
                    properties: {}
                },
                MyComponent: {
                    description: 'abc',
                    allOf: [
                        {
                            properties: {}
                        }
                    ],
                    properties: {}
                }
            });
            expect(() => linter.lint(input)).toThrow(/Extra property properties in components.schemas.MyComponent/);
        });
    });

    describe('inherit-required', () => {
        it('should reject component with an optional property that overrides a required property', () => {
            let input = component({
                Other: {
                    description: 'abc',
                    required: [
                        'code'
                    ],
                    properties: {
                        code: {
                            type: 'string'
                        }
                    }
                },
                MyComponent: {
                    description: 'abc',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Other',
                        },
                        {
                            properties: {
                                code: {
                                    type: 'string'
                                }
                            }
                        }
                    ]
                }
            });
            expect(() => linter.lint(input)).toThrow(/Property code of components.schemas.MyComponent must be required/);
        });

        it('should accept component with an optional property that overrides an optional property', () => {
            let input = component({
                Other: {
                    description: 'abc',
                    properties: {
                        code: {
                            type: 'string'
                        }
                    }
                },
                MyComponent: {
                    description: 'abc',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Other',
                        },
                        {
                            properties: {
                                code: {
                                    type: 'string'
                                }
                            }
                        }
                    ]
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should accept component with a required property that overrides a required property', () => {
            let input = component({
                Other: {
                    description: 'abc',
                    required: [
                        'code'
                    ],
                    properties: {
                        code: {
                            type: 'string'
                        }
                    }
                },
                MyComponent: {
                    description: 'abc',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Other',
                        },
                        {
                            required: [
                                'code'
                            ],
                            properties: {
                                code: {
                                    type: 'string'
                                }
                            }
                        }
                    ]
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should accept component with a required property that overrides an optional property', () => {
            let input = component({
                Other: {
                    description: 'abc',
                    properties: {
                        code: {
                            type: 'string'
                        }
                    }
                },
                MyComponent: {
                    description: 'abc',
                    allOf: [
                        {
                            $ref: '#/components/schemas/Other',
                        },
                        {
                            required: [
                                'code'
                            ],
                            properties: {
                                code: {
                                    type: 'string'
                                }
                            }
                        }
                    ]
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });
    });

    describe('no-inline-polymorphic-request-bodies', () => {
        it('should reject post with inline polymorphic request body', () => {
            let input = requestContent('post', {
                'application/json': {
                    schema: {
                        oneOf: [
                            {
                                '$ref': '#/components/schemas/BodyA'
                            },
                            {
                                '$ref': '#/components/schemas/BodyB'
                            }
                        ]
                    }
                }
            });
            expect(() => linter.lint(input)).toThrow(/Inline polymorphic body in 'paths.\/test' post. These must be defined as named types./);
        });

        it('should reject put with inline polymorphic request body', () => {
            let input = requestContent('put', {
                'application/json': {
                    schema: {
                        oneOf: [
                            {
                                '$ref': '#/components/schemas/BodyA'
                            },
                            {
                                '$ref': '#/components/schemas/BodyB'
                            }
                        ]
                    }
                }
            });
            expect(() => linter.lint(input)).toThrow(/Inline polymorphic body in 'paths.\/test' put. These must be defined as named types./);
        });

        it('should reject patch with inline polymorphic request body', () => {
            let input = requestContent('patch', {
                'application/json': {
                    schema: {
                        oneOf: [
                            {
                                '$ref': '#/components/schemas/BodyA'
                            },
                            {
                                '$ref': '#/components/schemas/BodyB'
                            }
                        ]
                    }
                }
            });
            expect(() => linter.lint(input)).toThrow(/Inline polymorphic body in 'paths.\/test' patch. These must be defined as named types./);
        });

        it('should accept post with reference to request body', () => {
            let input = requestContent('post', {
                'application/json': {
                    schema: {
                        '$ref': '#/components/schemas/RequestBody'
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should accept put with reference to request body', () => {
            let input = requestContent('put', {
                'application/json': {
                    schema: {
                        '$ref': '#/components/schemas/RequestBody'
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should accept patch with reference to request body', () => {
            let input = requestContent('patch', {
                'application/json': {
                    schema: {
                        '$ref': '#/components/schemas/RequestBody'
                    }
                }
            });
            expect(() => linter.lint(input)).not.toThrow();
        });
    });
});
