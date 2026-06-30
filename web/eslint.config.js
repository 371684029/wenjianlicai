import pluginVue from 'eslint-plugin-vue';
import vueTsConfigs from '@vue/eslint-config-typescript';

export default [
  ...pluginVue.configs['flat/recommended'],
  ...vueTsConfigs(),
  {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
];
