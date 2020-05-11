import { Validator } from 'jsonschema';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Rule, ApiSpec } from './Rule';

type RuleCtor = new () => Rule;

function loadRules(folder: string): RuleCtor[] {
    return fs.readdirSync(folder)
        .filter(f => path.extname(f) === '.js')
        .map(f => path.join(folder, f))
        .filter(f => fs.statSync(f).isFile())
        .map(f => (require(f) as any).default as any);
}

export interface LinterOptions {
}

export class Linter {
    private _schema: object;
    private _rules: RuleCtor[];

    constructor(
        _options: LinterOptions,
    ) {
        this._schema = require('../schema/openapi-3.0.json') as any;
        this._rules = loadRules(path.join(__dirname, '../dist/rules'));
    }

    public lint(json: ApiSpec) {
        const v = new Validator();
        const result = v.validate(json, this._schema);

        if (result.errors.length > 0) {
            result.errors.forEach(e => {
                console.error(`Error: Property ${e.property} ${e.message}\nSchema: ${JSON.stringify(e.schema, null, 2)}\nInstance: ${JSON.stringify(e.instance, null, 2)}`);
            });
            throw result.throwError;
        }

        this._rules.map(Rule => new Rule()).forEach(rule => rule.validate(json));
    }
}
