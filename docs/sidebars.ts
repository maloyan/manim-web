import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'getting-started',
    'py2ts-converter',
    'examples',
    {
      type: 'link',
      label: 'API Reference',
      href: '/api',
    },
  ],
};

export default sidebars;
