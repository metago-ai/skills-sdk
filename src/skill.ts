/**
 * MetaGO Skills SDK - Skill 类
 * 提供技能的创建、序列化、解析、验证、保存能力
 */

import * as fs from 'fs';
import * as path from 'path';
import { SkillDefinition } from './types';
import { parseSkillMarkdown, stringifySimpleYaml } from './parser';
import { validateSkill } from './validator';

/**
 * Skill 技能类
 *
 * 一个 Skill 实例对应一个 SKILL.md 文件：
 *   - frontmatter（name / description / 可选元数据）
 *   - body（Markdown 正文）
 */
export class Skill implements SkillDefinition {
  /** 技能名称 */
  public name: string;
  /** 技能描述 */
  public description: string;
  /** 技能正文（Markdown） */
  public body: string;
  /** 可选版本号 */
  public version?: string;
  /** 可选作者 */
  public author?: string;
  /** 可选标签 */
  public tags?: string[];

  constructor(def: SkillDefinition) {
    this.name = def.name;
    this.description = def.description;
    this.body = def.body;
    this.version = def.version;
    this.author = def.author;
    // 拷贝一份数组，避免外部引用被意外修改
    this.tags = def.tags ? [...def.tags] : undefined;
  }

  /**
   * 序列化为 SKILL.md 格式（YAML frontmatter + Markdown 正文）
 *
   * @returns SKILL.md 内容字符串
   */
  toMarkdown(): string {
    const frontmatter: Record<string, unknown> = {
      name: this.name,
      description: this.description,
    };
    if (this.version) frontmatter.version = this.version;
    if (this.author) frontmatter.author = this.author;
    if (this.tags && this.tags.length > 0) frontmatter.tags = this.tags;

    const yaml = stringifySimpleYaml(frontmatter);
    return `---\n${yaml}\n---\n\n${this.body.trim()}\n`;
  }

  /**
   * 验证当前技能定义
   *
   * @returns 错误信息数组，空数组表示有效
   */
  validate(): string[] {
    return validateSkill(this).errors;
  }

  /**
   * 保存为 SKILL.md 文件（自动创建父目录）
   *
   * @param filePath 目标文件路径
   */
  save(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, this.toMarkdown(), 'utf-8');
  }

  /**
   * 转为纯对象（便于 JSON 序列化）
   */
  toJSON(): SkillDefinition {
    return {
      name: this.name,
      description: this.description,
      body: this.body,
      version: this.version,
      author: this.author,
      tags: this.tags,
    };
  }

  /**
   * 从 SKILL.md 文件解析为 Skill 实例
   *
   * @param filePath SKILL.md 文件路径
   * @returns Skill 实例
   */
  static fromFile(filePath: string): Skill {
    const content = fs.readFileSync(filePath, 'utf-8');
    return Skill.fromMarkdown(content);
  }

  /**
   * 从 SKILL.md 内容字符串解析为 Skill 实例
   *
   * @param content SKILL.md 内容
   * @returns Skill 实例
   */
  static fromMarkdown(content: string): Skill {
    const { frontmatter, body } = parseSkillMarkdown(content);
    return new Skill({
      name: String(frontmatter.name ?? ''),
      description: String(frontmatter.description ?? ''),
      body,
      version: frontmatter.version ? String(frontmatter.version) : undefined,
      author: frontmatter.author ? String(frontmatter.author) : undefined,
      tags: Array.isArray(frontmatter.tags)
        ? (frontmatter.tags as string[])
        : undefined,
    });
  }
}
