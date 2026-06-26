/**
 * MetaGO Skills SDK - 生成器
 * 生成 Kit 的 package.json 与 README.md 内容
 *
 * 注意：本模块只依赖 Skill 类型，不依赖 SkillPack 类，
 * 以避免与 skill-pack.ts 形成循环依赖。
 */

import { Skill } from './skill';

/** 生成器所需选项（与 SkillPack 的核心字段一一对应） */
export interface GenerateOptions {
  /** 包名称 */
  name: string;
  /** 包版本 */
  version: string;
  /** 包描述 */
  description: string;
  /** 技能列表 */
  skills: Skill[];
  /** 可选作者 */
  author?: string;
  /** 可选许可证 */
  license?: string;
}

/** SDK 版本号，写入生成物的 metago 元信息中（动态读取 package.json，避免硬编码） */
const SDK_VERSION = require('../package.json').version;

/**
 * 生成 Kit 的 package.json 内容
 *
 * @param opts 生成器选项
 * @returns package.json 字符串
 */
export function generatePackageJson(opts: GenerateOptions): string {
  const pkg = {
    name: opts.name,
    version: opts.version,
    description: opts.description,
    main: 'index.js',
    author: opts.author || '',
    license: opts.license || 'MIT',
    metago: {
      type: 'skill-kit' as const,
      sdkVersion: SDK_VERSION,
      skillsCount: opts.skills.length,
      skills: opts.skills.map((s) => s.name),
    },
    keywords: ['metago', 'skills', 'kit'],
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

/**
 * 生成 Kit 的 README.md 内容
 *
 * @param opts 生成器选项
 * @returns README.md 字符串
 */
export function generateReadme(opts: GenerateOptions): string {
  const lines: string[] = [];

  lines.push(`# ${opts.name}`);
  lines.push('');
  lines.push(`> ${opts.description}`);
  lines.push('');
  lines.push('| 字段 | 值 |');
  lines.push('| --- | --- |');
  lines.push(`| 版本 | ${opts.version} |`);
  lines.push(`| 技能数量 | ${opts.skills.length} |`);
  if (opts.author) lines.push(`| 作者 | ${opts.author} |`);
  lines.push(`| 许可证 | ${opts.license || 'MIT'} |`);
  lines.push(`| 构建 SDK | @metago-ai/skills-sdk@${SDK_VERSION} |`);
  lines.push('');

  lines.push('## 包含技能');
  lines.push('');
  if (opts.skills.length === 0) {
    lines.push('_（暂无技能）_');
    lines.push('');
  } else {
    for (const skill of opts.skills) {
      lines.push(`### \`${skill.name}\``);
      lines.push('');
      lines.push(skill.description);
      lines.push('');
    }
  }

  lines.push('## 安装');
  lines.push('');
  lines.push('```bash');
  lines.push(`metago kit install ${opts.name}`);
  lines.push('```');
  lines.push('');

  lines.push('## 目录结构');
  lines.push('');
  lines.push('```');
  lines.push(`${opts.name}/`);
  lines.push('├── package.json');
  lines.push('├── README.md');
  lines.push('└── skills/');
  for (const skill of opts.skills) {
    lines.push(`    └── ${skill.name}/SKILL.md`);
  }
  lines.push('```');
  lines.push('');

  lines.push('## 许可证');
  lines.push('');
  lines.push(opts.license || 'MIT');
  lines.push('');

  return lines.join('\n');
}
