import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'getting-started',
    'py2ts-converter',
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/animations',
        'examples/graphing',
        'examples/3d-scenes',
        'examples/new',
        'examples/release-0-11-0-12',
        'examples/release-0-16-0-17',
        'examples/release-0-18-0-19',
        'examples/release-0-20-0-22',
      ],
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/api',
    },
  ],
};

export default sidebars;
