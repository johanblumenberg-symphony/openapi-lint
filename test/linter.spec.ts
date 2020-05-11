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

describe('Linter', () => {
    describe('allof-only-ref', () => {
        let linter: Linter;

        beforeEach(() => {
            linter = new Linter({});
        });

        it('should accept an allOf declaration that has only ref elements', () => {
            let input = spec(responseContent({
                'application/json': {
                    schema: {
                        allOf: [
                            { '$ref': 'ref1' },
                            { '$ref': 'ref2' },
                        ]
                    }
                }
            }));
            expect(() => linter.lint(input)).not.toThrow();
        });

        it('should fail if an allOf declaration has something else but a ref', () => {
            let input = spec(responseContent({
                'application/json': {
                    schema: {
                        allOf: [
                            { '$ref': 'ref' },
                            { description: 'abc' }
                        ]
                    }
                }
            }));
            expect(() => linter.lint(input)).toThrow(/allOf: should only contain \$ref elements/);
        });
    });
});
