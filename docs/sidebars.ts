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
        'examples/release-0-23-0-25',
        'examples/release-0-26',
        'examples/release-0-27-0-28',
        'examples/release-0-29-0-31',
        'examples/release-0-32-0-36',
        'examples/molecular',
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
