import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'getting-started',
    'py2ts-converter',
    {
      type: 'category',
      label: 'Examples',
      items: ['examples/animations', 'examples/graphing', 'examples/3d-scenes'],
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/api',
    },
  ],
};

export default sidebars;
