import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // مشروعنا ما بيستخدم React Compiler، وهاي القاعدة (من نفس الحزمة) بتعتبر
      // أي fetch عادي جوا useEffect خطأ حتى لو هو النمط الصحيح لمزامنة بيانات
      // خارجية (API). منعطلها بدل ما نلف الكود حولها بشكل مصطنع.
      'react-hooks/set-state-in-effect': 'off',
      // اتفاقية شائعة: بادئة _ تعني "متعمد الإهمال" (زي [_, value] بالـ destructuring)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
])
