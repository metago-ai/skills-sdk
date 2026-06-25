/**
 * MetaGO Skills SDK - 基础测试
 * 使用 Node.js 内置 assert 模块，无外部测试框架依赖
 *
 * 运行方式：
 *   npm test
 *   （等价于 ts-node tests/basic.test.ts）
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  Skill,
  SkillPack,
  validateSkill,
  validateSkillFile,
  loadSkills,
  loadSkillsFromDirectory,
  parseSkillMarkdown,
} from '../src/index';

let passed = 0;

/**
 * 测试包装器：支持同步与异步用例
 */
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

/** 创建临时目录 */
function tmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `metago-sdk-${prefix}-`));
}

async function main(): Promise<void> {
  console.log('MetaGO Skills SDK - 基础测试\n');

  // ===== Skill 类 =====
  await test('Skill.toMarkdown 生成合法 frontmatter', () => {
    const skill = new Skill({
      name: 'metago-test',
      description: '这是一个用于测试的技能描述',
      body: '# 测试技能\n\n## 步骤\n执行测试',
    });
    const md = skill.toMarkdown();
    assert.ok(md.startsWith('---'), '应以 --- 开头');
    assert.ok(md.includes('name: metago-test'));
    assert.ok(md.includes('description: 这是一个用于测试的技能描述'));
    assert.ok(md.includes('# 测试技能'));
  });

  await test('Skill.toMarkdown 包含可选元数据', () => {
    const skill = new Skill({
      name: 'metago-meta',
      description: '测试可选元数据字段的序列化',
      body: '# 标题',
      version: '2.1.0',
      author: 'MetaGO',
      tags: ['a', 'b'],
    });
    const md = skill.toMarkdown();
    assert.ok(md.includes('version: 2.1.0'));
    assert.ok(md.includes('author: MetaGO'));
    assert.ok(md.includes('tags:'));
    assert.ok(md.includes('- a'));
    assert.ok(md.includes('- b'));
  });

  await test('Skill.fromMarkdown 往返一致', () => {
    const original = new Skill({
      name: 'metago-roundtrip',
      description: '往返一致性测试用例描述',
      body: '# 标题\n\n正文内容',
    });
    const md = original.toMarkdown();
    const parsed = Skill.fromMarkdown(md);
    assert.strictEqual(parsed.name, 'metago-roundtrip');
    assert.strictEqual(parsed.description, '往返一致性测试用例描述');
    assert.ok(parsed.body.includes('# 标题'));
  });

  await test('Skill.save / Skill.fromFile 文件往返', async () => {
    const dir = tmpDir('save');
    const file = path.join(dir, 'SKILL.md');
    const skill = new Skill({
      name: 'metago-file',
      description: '文件读写往返测试用例描述',
      body: '# 文件测试\n正文',
    });
    skill.save(file);
    const loaded = Skill.fromFile(file);
    assert.strictEqual(loaded.name, 'metago-file');
    assert.strictEqual(loaded.description, '文件读写往返测试用例描述');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // ===== 验证器 =====
  await test('validateSkill 通过合法技能', () => {
    const r = validateSkill({
      name: 'metago-good',
      description: '这是一个合法的技能描述',
      body: '# 标题\n正文',
    });
    assert.strictEqual(r.valid, true);
    assert.strictEqual(r.errors.length, 0);
  });

  await test('validateSkill 拒绝非法 name（缺少 metago- 前缀）', () => {
    const r = validateSkill({
      name: 'bad-name',
      description: '描述长度合法的示例内容',
      body: '# 标题',
    });
    assert.strictEqual(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes('metago-')));
  });

  await test('validateSkill 拒绝非法 name（大写字母）', () => {
    const r = validateSkill({
      name: 'metago-Bad',
      description: '描述长度合法的示例内容',
      body: '# 标题',
    });
    assert.strictEqual(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes('小写字母')));
  });

  await test('validateSkill 拒绝过短 description', () => {
    const r = validateSkill({
      name: 'metago-x',
      description: '短',
      body: '# 标题',
    });
    assert.strictEqual(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes('description')));
  });

  await test('validateSkill 拒绝无标题 body', () => {
    const r = validateSkill({
      name: 'metago-x',
      description: '描述长度合法的示例内容',
      body: '只有正文没有标题',
    });
    assert.strictEqual(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes('标题')));
  });

  await test('validateSkill 拒绝空 body', () => {
    const r = validateSkill({
      name: 'metago-x',
      description: '描述长度合法的示例内容',
      body: '   ',
    });
    assert.strictEqual(r.valid, false);
  });

  await test('Skill.validate() 返回错误数组', () => {
    const skill = new Skill({
      name: 'wrong',
      description: '短',
      body: 'no heading',
    });
    const errors = skill.validate();
    assert.ok(errors.length > 0);
  });

  await test('validateSkillFile 验证真实文件', async () => {
    const dir = tmpDir('file');
    const file = path.join(dir, 'SKILL.md');
    new Skill({
      name: 'metago-vfile',
      description: '文件验证测试用例的描述',
      body: '# 文件测试\n正文',
    }).save(file);
    const r = validateSkillFile(file);
    assert.strictEqual(r.valid, true);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await test('validateSkillFile 文件不存在时返回错误', () => {
    const r = validateSkillFile(path.join(tmpDir('none'), 'no-such.md'));
    assert.strictEqual(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes('不存在')));
  });

  // ===== SkillPack =====
  await test('SkillPack 生成 package.json 与 README', () => {
    const pack = new SkillPack({
      name: 'my-kit',
      version: '1.0.0',
      description: '测试 Kit',
      skills: [
        new Skill({
          name: 'metago-a',
          description: '技能 A 的描述说明',
          body: '# A',
        }),
        new Skill({
          name: 'metago-b',
          description: '技能 B 的描述说明',
          body: '# B',
        }),
      ],
    });
    const pkg = JSON.parse(pack.generatePackageJson());
    assert.strictEqual(pkg.name, 'my-kit');
    assert.strictEqual(pkg.metago.skillsCount, 2);
    assert.deepStrictEqual(pkg.metago.skills, ['metago-a', 'metago-b']);
    const readme = pack.generateReadme();
    assert.ok(readme.includes('# my-kit'));
    assert.ok(readme.includes('metago-a'));
    assert.ok(readme.includes('metago-b'));
  });

  await test('SkillPack.buildToDirectory 写出目录结构', async () => {
    const dir = tmpDir('build');
    const pack = new SkillPack({
      name: 'build-kit',
      version: '1.0.0',
      description: '构建测试 Kit',
      skills: [
        new Skill({
          name: 'metago-c',
          description: '技能 C 的描述说明',
          body: '# C',
        }),
      ],
    });
    await pack.buildToDirectory(dir);
    assert.ok(fs.existsSync(path.join(dir, 'package.json')));
    assert.ok(fs.existsSync(path.join(dir, 'README.md')));
    assert.ok(fs.existsSync(path.join(dir, 'skills', 'metago-c', 'SKILL.md')));
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await test('SkillPack.addSkill 追加技能', () => {
    const pack = new SkillPack({
      name: 'add-kit',
      version: '1.0.0',
      description: '追加测试 Kit',
      skills: [],
    });
    assert.strictEqual(pack.skills.length, 0);
    pack.addSkill(
      new Skill({
        name: 'metago-add',
        description: '被追加的技能描述说明',
        body: '# 新增',
      })
    );
    assert.strictEqual(pack.skills.length, 1);
  });

  // ===== 加载器 =====
  await test('loadSkillsFromDirectory 加载子目录模式', async () => {
    const dir = tmpDir('load');
    const s1 = new Skill({
      name: 'metago-load-1',
      description: '加载测试技能一的描述',
      body: '# 一',
    });
    const s2 = new Skill({
      name: 'metago-load-2',
      description: '加载测试技能二的描述',
      body: '# 二',
    });
    fs.mkdirSync(path.join(dir, 'metago-load-1'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'metago-load-2'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'metago-load-1', 'SKILL.md'),
      s1.toMarkdown()
    );
    fs.writeFileSync(
      path.join(dir, 'metago-load-2', 'SKILL.md'),
      s2.toMarkdown()
    );
    const skills = loadSkillsFromDirectory(dir);
    assert.strictEqual(skills.length, 2);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await test('loadSkillsFromDirectory 加载平铺模式', async () => {
    const dir = tmpDir('flat');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'SKILL.md'),
      new Skill({
        name: 'metago-flat',
        description: '平铺模式加载测试用例描述',
        body: '# 平铺',
      }).toMarkdown()
    );
    const skills = loadSkillsFromDirectory(dir);
    assert.strictEqual(skills.length, 1);
    assert.strictEqual(skills[0].name, 'metago-flat');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  await test('loadSkills 从多目录加载并去重', async () => {
    const dir1 = tmpDir('multi1');
    const dir2 = tmpDir('multi2');
    fs.mkdirSync(path.join(dir1, 'metago-shared'), { recursive: true });
    fs.mkdirSync(path.join(dir2, 'metago-shared'), { recursive: true });
    fs.mkdirSync(path.join(dir2, 'metago-only2'), { recursive: true });
    fs.writeFileSync(
      path.join(dir1, 'metago-shared', 'SKILL.md'),
      new Skill({
        name: 'metago-shared',
        description: '目录一中的共享技能描述',
        body: '# shared',
      }).toMarkdown()
    );
    fs.writeFileSync(
      path.join(dir2, 'metago-shared', 'SKILL.md'),
      new Skill({
        name: 'metago-shared',
        description: '目录二中的共享技能描述',
        body: '# shared2',
      }).toMarkdown()
    );
    fs.writeFileSync(
      path.join(dir2, 'metago-only2', 'SKILL.md'),
      new Skill({
        name: 'metago-only2',
        description: '目录二独占技能描述说明',
        body: '# only2',
      }).toMarkdown()
    );
    const skills = loadSkills([dir1, dir2]);
    // 共享技能应去重，只保留 1 个 + only2 = 2 个
    assert.strictEqual(skills.length, 2);
    fs.rmSync(dir1, { recursive: true, force: true });
    fs.rmSync(dir2, { recursive: true, force: true });
  });

  await test('loadSkillsFromDirectory 目录不存在返回空数组', () => {
    const skills = loadSkillsFromDirectory(
      path.join(os.tmpdir(), 'metago-no-such-dir-' + Date.now())
    );
    assert.strictEqual(skills.length, 0);
  });

  // ===== 解析器边界 =====
  await test('parseSkillMarkdown 处理 BOM', () => {
    const withBom =
      '\uFEFF---\nname: metago-bom\ndescription: BOM 测试用例描述\n---\n# 标题';
    const parsed = parseSkillMarkdown(withBom);
    assert.strictEqual(parsed.frontmatter.name, 'metago-bom');
  });

  await test('parseSkillMarkdown 无 frontmatter 时整体作为 body', () => {
    const parsed = parseSkillMarkdown('纯正文内容没有 frontmatter');
    assert.strictEqual(Object.keys(parsed.frontmatter).length, 0);
    assert.strictEqual(parsed.body, '纯正文内容没有 frontmatter');
  });

  await test('parseSkillMarkdown 解析内联数组', () => {
    const md =
      '---\nname: metago-inline\ndescription: 内联数组解析测试用例\ntags: [x, y, z]\n---\n# 内联';
    const parsed = parseSkillMarkdown(md);
    assert.deepStrictEqual(parsed.frontmatter.tags, ['x', 'y', 'z']);
  });

  console.log(`\n全部 ${passed} 项测试通过。`);
}

main().catch((err) => {
  console.error('\n测试失败：', err);
  process.exit(1);
});
