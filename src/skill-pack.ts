/**
 * MetaGO Skills SDK - SkillPack 技能包类
 * 将多个 Skill 聚合为可分发的 Kit
 */

import * as fs from 'fs';
import * as path from 'path';
import { Skill } from './skill';
import { generatePackageJson, generateReadme } from './generator';

/** SkillPack 构造选项 */
export interface SkillPackOptions {
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
  /** 可选许可证（默认 MIT） */
  license?: string;
}

/**
 * SkillPack 技能包
 *
 * 聚合多个 Skill，生成 package.json / README.md，
 * 并可一键构建为符合 MetaGO Kit 约定的目录结构：
 *
 *   <output>/
 *   ├── package.json
 *   ├── README.md
 *   └── skills/
 *       └── <skill-name>/SKILL.md
 */
export class SkillPack {
  /** 包名称 */
  public name: string;
  /** 包版本 */
  public version: string;
  /** 包描述 */
  public description: string;
  /** 技能列表 */
  public skills: Skill[];
  /** 可选作者 */
  public author?: string;
  /** 可选许可证 */
  public license?: string;

  constructor(opts: SkillPackOptions) {
    this.name = opts.name;
    this.version = opts.version;
    this.description = opts.description;
    // 拷贝一份数组，避免外部引用被意外修改
    this.skills = [...opts.skills];
    this.author = opts.author;
    this.license = opts.license;
  }

  /**
   * 生成 package.json 内容
   */
  generatePackageJson(): string {
    return generatePackageJson({
      name: this.name,
      version: this.version,
      description: this.description,
      skills: this.skills,
      author: this.author,
      license: this.license,
    });
  }

  /**
   * 生成 README.md 内容
   */
  generateReadme(): string {
    return generateReadme({
      name: this.name,
      version: this.version,
      description: this.description,
      skills: this.skills,
      author: this.author,
      license: this.license,
    });
  }

  /**
   * 追加一个技能
   */
  addSkill(skill: Skill): void {
    this.skills.push(skill);
  }

  /**
   * 构建为目录结构（递归创建目录）
   *
   * @param outputDir 输出目录
   */
  async buildToDirectory(outputDir: string): Promise<void> {
    fs.mkdirSync(outputDir, { recursive: true });
    const skillsDir = path.join(outputDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });

    // 写入 package.json
    fs.writeFileSync(
      path.join(outputDir, 'package.json'),
      this.generatePackageJson(),
      'utf-8'
    );

    // 写入 README.md
    fs.writeFileSync(
      path.join(outputDir, 'README.md'),
      this.generateReadme(),
      'utf-8'
    );

    // 写入每个技能
    for (const skill of this.skills) {
      const skillDir = path.join(skillsDir, skill.name);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        skill.toMarkdown(),
        'utf-8'
      );
    }
  }

  /**
   * 转为纯对象（便于 JSON 序列化）
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      skills: this.skills.map((s) => s.toJSON()),
      author: this.author,
      license: this.license,
    };
  }
}
