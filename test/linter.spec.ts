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
    }
}

function responseContent(content: ApiItem) {
    return spec({
        paths: {
            '/test': {
                get: {
                    responses: {
                        '200': {
                            description: 'abc',
                            content
                        }
                    }
                }
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
});
