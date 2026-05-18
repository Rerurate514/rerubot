import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    importPlugin.flatConfigs.recommended,
    prettierConfig,
    {
        languageOptions: {
            parserOptions: {
                project: true,
            },
        },
        rules: {
            // 命名規則
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variable',
                    format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
                    leadingUnderscore: 'allow',
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
            ],
            // any型の禁止
            '@typescript-eslint/no-explicit-any': 'error',
            // 未使用変数
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            // import順の整列
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc' },
                },
            ],
            // console.logの制限
            'no-console': ['warn', { allow: ['error', 'warn'] }],
        },
    }
);
