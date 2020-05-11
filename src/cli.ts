#!/usr/bin/env node

import { Linter } from './Linter';
import * as yargs from 'yargs';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';

let args = yargs
    .argv;

const linter = new Linter({});

args._.forEach(file => {
    const ext = path.extname(file);

    if (ext === '.json') {
        linter.lint(fs.readJSONSync(file) as any);
    } else if (ext === '.yaml' || ext === '.yml') {
        const json = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
        linter.lint(json as any);
    } else {
        throw new Error(`Unknown file extension: ${ext}`);
    }
});
