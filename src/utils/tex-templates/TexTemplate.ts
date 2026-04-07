export interface TexTemplateOptions {
  /** TeX compiler to use. Default: 'latex' */
  texCompiler?: string;
  /** Output format. Default: 'dvi' */
  outputFormat?: string;
  /** Preamble lines to include */
  preamble?: string[];
  /** Post-document setup commands */
  postDocPackages?: string[];
}

/**
 * TexTemplate - Configuration class for LaTeX templates
 *
 * Stores LaTeX configuration: compiler, preamble, packages.
 * Used to customize how LaTeX expressions are rendered.
 */
export class TexTemplate {
  private _texCompiler: string;
  private _outputFormat: string;
  private _preamble: string[];
  private _postDocPackages: string[];
  private _description: string;

  constructor(options: TexTemplateOptions = {}) {
    this._texCompiler = options.texCompiler ?? 'latex';
    this._outputFormat = options.outputFormat ?? 'dvi';
    this._preamble = options.preamble ?? [
      '\\usepackage[english]{babel}',
      '\\usepackage{amsmath}',
      '\\usepackage{amssymb}',
    ];
    this._postDocPackages = options.postDocPackages ?? [];
    this._description = '';
  }

  get texCompiler(): string {
    return this._texCompiler;
  }
  set texCompiler(value: string) {
    this._texCompiler = value;
  }

  get outputFormat(): string {
    return this._outputFormat;
  }
  set outputFormat(value: string) {
    this._outputFormat = value;
  }

  get description(): string {
    return this._description;
  }
  set description(value: string) {
    this._description = value;
  }

  addToPreamble(line: string): this {
    this._preamble.push(line);
    return this;
  }

  addPackage(packageName: string, options?: string): this {
    const line = options
      ? `\\usepackage[${options}]{${packageName}}`
      : `\\usepackage{${packageName}}`;
    this._preamble.push(line);
    return this;
  }

  getPreamble(): string {
    return this._preamble.join('\n');
  }

  getBody(expression: string): string {
    return [
      '\\documentclass[preview]{standalone}',
      ...this._preamble,
      '\\begin{document}',
      ...this._postDocPackages,
      expression,
      '\\end{document}',
    ].join('\n');
  }

  copy(): TexTemplate {
    const t = new TexTemplate({
      texCompiler: this._texCompiler,
      outputFormat: this._outputFormat,
      preamble: [...this._preamble],
      postDocPackages: [...this._postDocPackages],
    });
    t._description = this._description;
    return t;
  }
}

function createFontTemplate(
  description: string,
  encoding: string,
  packageName: string,
): TexTemplate {
  const template = new TexTemplate({
    preamble: [
      `\\usepackage[${encoding}]{fontenc}`,
      `\\usepackage{${packageName}}`,
      '\\usepackage{amsmath}',
      '\\usepackage{amssymb}',
    ],
  });
  template.description = description;
  return template;
}

/**
 * Pre-built font templates for LaTeX
 */
export const TexFontTemplates = {
  americanTypewriter: createFontTemplate('American Typewriter', 'T1', 'american-typewriter'),
  antykwa: createFontTemplate('Antykwa Poltawskiego', 'T1', 'antpolt'),
  baskervald: createFontTemplate('Baskervald ADF', 'T1', 'Baskervaldx'),
  caladea: createFontTemplate('Caladea', 'T1', 'caladea'),
  courier: createFontTemplate('Courier', 'T1', 'courier'),
  cursive: createFontTemplate('Zapf Chancery', 'T1', 'chancery'),
  dejavu: createFontTemplate('DejaVu', 'T1', 'dejavu'),
  ebGaramond: createFontTemplate('EB Garamond', 'T1', 'ebgaramond'),
  fira: createFontTemplate('FiraSans', 'T1', 'FiraSans'),
  fourier: createFontTemplate('Fourier', 'T1', 'fourier'),
  francoisOne: createFontTemplate('Francois One', 'T1', 'FrancoisOne'),
  helvetica: createFontTemplate('Helvetica', 'T1', 'helvet'),
  latin: createFontTemplate('Computer Modern', 'T1', 'lmodern'),
  newCenturySchoolbook: createFontTemplate('New Century Schoolbook', 'T1', 'newcent'),
  palatino: createFontTemplate('Palatino', 'T1', 'palatino'),
  timesNewRoman: createFontTemplate('Times New Roman', 'T1', 'mathptmx'),
} as const;

/**
 * Library of common LaTeX templates
 */
export const TexTemplateLibrary = {
  /** Default template with AMS packages */
  default: new TexTemplate(),

  /** Template with all common math packages */
  fullMath: new TexTemplate({
    preamble: [
      '\\usepackage{amsmath}',
      '\\usepackage{amssymb}',
      '\\usepackage{amsthm}',
      '\\usepackage{mathtools}',
      '\\usepackage{physics}',
    ],
  }),

  /** Template for chemistry */
  chemistry: new TexTemplate({
    preamble: ['\\usepackage{amsmath}', '\\usepackage{chemfig}', '\\usepackage{mhchem}'],
  }),

  /** Template for music */
  music: new TexTemplate({
    preamble: ['\\usepackage{amsmath}', '\\usepackage{musixtex}'],
  }),
} as const;
