import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';
import {eslint} from 'rollup-plugin-eslint';
import externalGlobals from 'rollup-plugin-external-globals';

import react from 'react';

const dependencies = Object.keys({
    ...pkg.dependencies,
    ...pkg.peerDependencies
});

export default {
    input: 'src/index.tsx',
    output: [
        {
            file: pkg.browser,
            format: 'umd',
            name: pkg.name
        },
        {
            file: pkg.main,
            format: 'cjs'
        },
        {
            file: pkg.module,
            format: 'es'
        }
    ],
    plugins: [
        eslint({throwOnError: true}),
        typescript({
            typescript: require('typescript')
        }),
        resolve({
            customResolveOptions: {
                moduleDirectory: 'node_modules'
            }
        }),
        commonjs({
            include: 'node_modules/**',
            namedExports: {
                react: Object.keys(react)
            }
        }),
        externalGlobals({
            perf_hooks: 'window' // eslint-disable-line
        })
    ],
    external: dependencies
};
