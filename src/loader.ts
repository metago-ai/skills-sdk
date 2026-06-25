/**
 * MetaGO Skills SDK - 加载器
 * 从文件系统加载技能
 *
 * 约定两种目录形态：
 *   1. 子目录模式：<dir>/<skill-name>/SKILL.md（推荐，符合 Kit 约定）
 *   2. 平铺模式：<dir>/SKILL.md（单技能目录直接放置）
 */

import * as fs from 'fs';
import * as path from 'path';
import { Skill } from './skill';

/** 技能文件名 */
const SKILL_FILE_NAME = 'SKILL.md';

/**
 * 从单个目录加载所有技能
 *
 * @param dirPath 目录路径
 * @returns Skill[] 数组（解析失败的文件会被跳过并告警）
 */
export function loadSkillsFromDirectory(dirPath: string): Skill[] {
  const skills: Skill[] = [];

  if (!fs.existsSync(dirPath)) {
    return skills;
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    return skills;
  }

  const entries = fs.readdirSync(dirPath);
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry);
    const entryStat = fs.statSync(entryPath);

    if (entryStat.isDirectory()) {
      // 子目录模式：./<dir>/<name>/SKILL.md
      const skillFile = path.join(entryPath, SKILL_FILE_NAME);
      if (fs.existsSync(skillFile)) {
        try {
          skills.push(Skill.fromFile(skillFile));
        } catch (err) {
          console.warn(
            `[MetaGO SDK] 跳过无法解析的技能文件: ${skillFile} - ${
              err instanceof Error ? err.message : err
            }`
          );
        }
      }
    } else if (entry.toLowerCase() === SKILL_FILE_NAME.toLowerCase()) {
      // 平铺模式：./<dir>/SKILL.md
      try {
        skills.push(Skill.fromFile(entryPath));
      } catch (err) {
        console.warn(
          `[MetaGO SDK] 跳过无法解析的技能文件: ${entryPath} - ${
            err instanceof Error ? err.message : err
          }`
        );
      }
    }
  }

  return skills;
}

/**
 * 从多个目录加载所有技能（按 name 去重，先到先得）
 *
 * @param dirPaths 目录路径数组
 * @returns Skill[] 数组
 */
export function loadSkills(dirPaths: string[]): Skill[] {
  const allSkills: Skill[] = [];
  const seenNames = new Set<string>();

  for (const dirPath of dirPaths) {
    const skills = loadSkillsFromDirectory(dirPath);
    for (const skill of skills) {
      if (seenNames.has(skill.name)) {
        console.warn(
          `[MetaGO SDK] 检测到重复技能名 "${skill.name}"，已跳过`
        );
        continue;
      }
      seenNames.add(skill.name);
      allSkills.push(skill);
    }
  }

  return allSkills;
}
