import { lang, tx } from './store/ui'

const messages = {
  'app.title': { zh: '地城冒险', en: 'Dungeon Quest' },
  'app.subtitle': {
    zh: '异步文字 RPG · 内容驱动 · 中英双语',
    en: 'Asynchronous text RPG · content-driven · bilingual'
  },
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.game': { zh: '游戏', en: 'Game' },
  'nav.editor': { zh: '内容编辑器', en: 'Content editor' },
  'nav.data': { zh: '数据包', en: 'Data packs' },
  'nav.login': { zh: '登录', en: 'Sign in' },
  'nav.logout': { zh: '退出', en: 'Sign out' },
  'nav.admin': { zh: '管理员', en: 'Admin' },
  'lang.toggle': { zh: 'English', en: '中文' },

  'auth.kicker': { zh: '账号', en: 'Account' },
  'auth.title': { zh: '登录或注册', en: 'Sign in or register' },
  'auth.desc': {
    zh: '英雄存档与战报保存在服务器数据库，登录后才能继续冒险。',
    en: 'Heroes and reports live in the server database; sign in to continue your adventure.'
  },
  'auth.login': { zh: '登录', en: 'Sign in' },
  'auth.register': { zh: '注册', en: 'Register' },
  'auth.username': { zh: '用户名', en: 'Username' },
  'auth.usernamePlaceholder': { zh: '3~24 个字母、数字或中文', en: '3–24 letters, digits or Chinese' },
  'auth.password': { zh: '密码', en: 'Password' },
  'auth.passwordPlaceholder': { zh: '至少 8 个字符', en: 'At least 8 characters' },
  'auth.confirm': { zh: '确认密码', en: 'Confirm password' },
  'auth.loginSubmit': { zh: '登录', en: 'Sign in' },
  'auth.registerSubmit': { zh: '创建账号', en: 'Create account' },
  'auth.working': { zh: '处理中…', en: 'Working…' },
  'auth.required': { zh: '请填写用户名与密码。', en: 'Enter a username and password.' },
  'auth.passwordShort': { zh: '密码至少需要 8 个字符。', en: 'The password needs at least 8 characters.' },
  'auth.passwordMismatch': { zh: '两次输入的密码不一致。', en: 'The two passwords do not match.' },
  'auth.failed': { zh: '登录失败，请稍后再试。', en: 'Sign-in failed. Try again later.' },
  'auth.adminNote': {
    zh: '这里只提供普通账号注册；管理员账号只能在服务器后台设置。',
    en: 'Only regular accounts can register here; admin accounts are configured on the server.'
  },

  'home.action.game': { zh: '进入游戏', en: 'Play now' },
  'game.title': { zh: '游戏', en: 'Game' },
  'game.subtitle': {
    zh: '创建英雄，进入地城，自动战斗并查看战报。',
    en: 'Create a hero, enter a dungeon, fight automatically, and read the report.'
  },
  'game.create.title': { zh: '创建英雄', en: 'Create a hero' },
  'game.create.desc': {
    zh: '初始属性为 4，种族修正会叠加；职业决定主副属性、技能与初始装备。',
    en: 'Base attributes start at 4, racial modifiers apply, and the class sets primary attributes, skills and gear.'
  },
  'game.create.name': { zh: '英雄名字', en: 'Hero name' },
  'game.create.namePlaceholder': { zh: '例如：灰港的艾琳', en: 'e.g. Elyn of Greyhaven' },
  'game.create.gender': { zh: '性别', en: 'Gender' },
  'game.create.race': { zh: '种族', en: 'Race' },
  'game.create.class': { zh: '职业', en: 'Class' },
  'game.create.submit': { zh: '创建英雄', en: 'Create hero' },
  'game.create.required': { zh: '请填写名字并选择种族与职业。', en: 'Enter a name and choose a race and class.' },
  'game.create.noData': {
    zh: '内容库为空，请先让管理员在内容编辑器中创建种族与职业。',
    en: 'The content library is empty. Ask an admin to create races and classes in the editor first.'
  },
  'game.create.failed': { zh: '操作失败，请稍后再试。', en: 'The action failed. Try again later.' },
  'game.gender.female': { zh: '女', en: 'Female' },
  'game.gender.male': { zh: '男', en: 'Male' },
  'game.hero.title': { zh: '我的英雄', en: 'My hero' },
  'game.hero.level': { zh: '等级', en: 'Level' },
  'game.hero.ep': { zh: '经验', en: 'EP' },
  'game.hero.gold': { zh: '金币', en: 'Gold' },
  'game.hero.race': { zh: '种族', en: 'Race' },
  'game.hero.class': { zh: '职业', en: 'Class' },
  'game.hero.attrs': { zh: '属性', en: 'Attributes' },
  'game.hero.skills': { zh: '技能', en: 'Skills' },
  'game.hero.inventory': { zh: '背包', en: 'Backpack' },
  'game.hero.emptyInventory': { zh: '背包是空的。', en: 'The backpack is empty.' },
  'game.hero.reset': { zh: '删除英雄', en: 'Delete hero' },
  'game.hero.resetConfirm': {
    zh: '删除英雄与全部战报？此操作不可撤销。',
    en: 'Delete this hero and all reports? This cannot be undone.'
  },
  'game.hero.nextLevel': { zh: '升级还需', en: 'To next level' },
  'game.dungeons.title': { zh: '地城', en: 'Dungeons' },
  'game.dungeons.desc': {
    zh: '选择一处地城出发。战斗自动进行，完整战报会保存下来。',
    en: 'Pick a dungeon. Combat resolves automatically and the full report is saved.'
  },
  'game.dungeons.rooms': { zh: '房间', en: 'rooms' },
  'game.dungeons.layers': { zh: '层', en: 'layers' },
  'game.dungeons.minLevel': { zh: '最低等级', en: 'Min level' },
  'game.dungeons.go': { zh: '出发', en: 'Embark' },
  'game.dungeons.locked': { zh: '等级不足', en: 'Level too low' },
  'game.dungeons.dailyLeft': { zh: '今日剩余', en: 'Runs left today' },
  'game.dungeons.dailyNone': { zh: '今日次数已用完', en: 'No runs left today' },
  'game.dungeons.none': {
    zh: '编辑器里还没有地城。先去创建地城、层和房间。',
    en: 'No dungeons yet. Create a dungeon, layers and rooms in the editor.'
  },
  'game.latest.title': { zh: '最近战报', en: 'Latest report' },
  'game.latest.none': { zh: '还没有战报，先去打一场。', en: 'No reports yet — run a dungeon.' },
  'game.latest.open': { zh: '查看战报', en: 'Open report' },
  'game.running': { zh: '战斗中…', en: 'Resolving…' },
  'game.reward.ep': { zh: '经验', en: 'EP' },
  'game.reward.gold': { zh: '金币', en: 'Gold' },
  'game.reward.items': { zh: '掉落', en: 'Loot' },
  'game.reward.none': { zh: '无掉落', en: 'No loot' },

  'report.title': { zh: '战报', en: 'Report' },
  'report.back': { zh: '返回游戏', en: 'Back to game' },
  'report.again': { zh: '再次出发', en: 'Run again' },
  'report.victory': { zh: '胜利', en: 'Victory' },
  'report.defeat': { zh: '失败', en: 'Defeat' },
  'report.clear': { zh: '无遭遇', en: 'Empty room' },
  'report.layer': { zh: '层', en: 'Layer' },
  'report.room': { zh: '房间', en: 'Room' },
  'report.round': { zh: '回合', en: 'Round' },
  'report.attack': { zh: '攻击', en: 'Attack' },
  'report.down': { zh: '击倒', en: 'Down' },
  'report.reward': { zh: '结算', en: 'Rewards' },
  'report.hit.miss': { zh: '未命中', en: 'Miss' },
  'report.hit.normal': { zh: '普通命中', en: 'Normal hit' },
  'report.hit.good': { zh: '好命中', en: 'Good hit' },
  'report.hit.critical': { zh: '暴击', en: 'Critical' },
  'report.notFound': { zh: '找不到这条战报。', en: 'Report not found.' },
  'report.levelUp': { zh: '升级', en: 'Level up' },
  'report.stats': { zh: '战斗统计', en: 'Statistics' },
  'report.stats.rounds': { zh: '总回合', en: 'Rounds' },
  'report.stats.damageDealt': { zh: '造成伤害', en: 'Damage dealt' },
  'report.stats.damageTaken': { zh: '承受伤害', en: 'Damage taken' },
  'report.stats.attacks': { zh: '出手次数', en: 'Attacks' },
  'report.stats.hitRate': { zh: '命中率', en: 'Hit rate' },
  'report.stats.criticals': { zh: '暴击次数', en: 'Critical hits' },
  'report.stats.kills': { zh: '击倒', en: 'Kills' },
  'report.stats.absorbed': { zh: '护甲减伤', en: 'Absorbed' },
  'report.stats.bestHit': { zh: '最重一击', en: 'Best hit' },
  'report.stats.vitality': { zh: '体力变化', en: 'Vitality' },
  'report.loadout': { zh: '装备与战术', en: 'Loadout & tactics' },
  'report.loadout.weapon': { zh: '武器', en: 'Weapon' },
  'report.loadout.items': { zh: '装备', en: 'Gear' },
  'report.loadout.none': { zh: '无', en: 'None' },
  'report.order': { zh: '先攻顺序', en: 'Initiative order' },
  'report.rawDamage': { zh: '原始伤害', en: 'Raw' },
  'report.absorbed': { zh: '减伤', en: 'Absorb' },
  'report.positionModifier': { zh: '站位修正', en: 'Position' },
  'report.defend': { zh: '首回合防御', en: 'First-round defense' },
  'report.defendDetail': {
    zh: '放弃本回合出手，防御 +50%。',
    en: 'Skips attacking this round for +50% defense.'
  },
  'report.duration': { zh: '冒险时长', en: 'Duration' },
  'report.minutes': { zh: '分钟', en: 'min' },
  'report.heroLevel': { zh: '英雄等级', en: 'Hero level' },
  'report.tactics': { zh: '战术', en: 'Tactics' },
  'report.disclaimer': {
    zh: '战报由服务器结算并保存；战术设置与装备快照在出发时锁定。技能资源与受伤分级将在后续里程碑补齐。',
    en: 'Reports are resolved and stored on the server; tactics and gear snapshots are locked at departure. Skill resources and wound tiers come in later milestones.'
  },

  'home.hero.title': { zh: '先能玩，再逐步补齐', en: 'Playable first, then deeper' },
  'home.hero.desc': {
    zh: '注册账号后即可创建英雄、进入地城、自动战斗并查看结构化战报；英雄与战报保存在服务器数据库。内容编辑器与数据包只对管理员开放，所有修改直接写入 SQLite。',
    en: 'Register, create a hero, enter dungeons, fight automatically and read structured reports. Heroes and reports live in the server database. The content editor and data packs are admin-only, and every change is written to SQLite.'
  },
  'home.stat.entities': { zh: '实体总数', en: 'Entities' },
  'home.stat.types': { zh: '实体类型', en: 'Entity types' },
  'home.stat.issues': { zh: '校验问题', en: 'Validation issues' },
  'home.stat.version': { zh: '数据结构版本', en: 'Schema version' },
  'home.action.editor': { zh: '打开内容编辑器', en: 'Open content editor' },
  'home.action.data': { zh: '管理数据包', en: 'Manage data packs' },
  'home.modules.title': { zh: '里程碑', en: 'Milestones' },
  'home.types.title': { zh: '当前内容概览', en: 'Content overview' },
  'home.types.empty': { zh: '暂无内容', en: 'No content yet' },
  'home.locale.title': { zh: '双语规则', en: 'Bilingual rules' },
  'home.locale.desc': {
    zh: '所有可显示文本都是 { en, zh } 对象；ID、数值、枚举与公式保持单值。中文缺失时回退英文并标记未翻译，导出时不会丢失任何语言。',
    en: 'Every display string is an { en, zh } object; IDs, numbers, enums and formulas stay single-valued. Missing Chinese falls back to English and is flagged as untranslated — exports never lose a language.'
  },

  'editor.title': { zh: '内容编辑器', en: 'Content editor' },
  'editor.subtitle': {
    zh: '维护全部文案、数值与引用关系。保存会直接写入服务器 SQLite 数据库。',
    en: 'Maintain all text, numbers and references. Saving writes straight to the server SQLite database.'
  },
  'editor.types': { zh: '实体类型', en: 'Entity types' },
  'editor.search': { zh: '搜索名称或 ID', en: 'Search name or ID' },
  'editor.new': { zh: '新建', en: 'New' },
  'editor.emptyList': { zh: '没有匹配的条目', en: 'No matching entries' },
  'editor.noSelection': {
    zh: '从中间列表选择一个条目开始编辑，或点击「新建」。',
    en: 'Select an entry from the list to start editing, or click New.'
  },
  'editor.save': { zh: '保存', en: 'Save' },
  'editor.cancel': { zh: '取消', en: 'Cancel' },
  'editor.duplicate': { zh: '复制', en: 'Duplicate' },
  'editor.delete': { zh: '删除', en: 'Delete' },
  'editor.dirty': { zh: '有未保存的修改', en: 'Unsaved changes' },
  'editor.saved': { zh: '已保存', en: 'Saved' },
  'editor.confirmDiscard': {
    zh: '当前修改尚未保存，确定放弃吗？',
    en: 'Discard the unsaved changes?'
  },
  'editor.confirmDelete': {
    zh: '确定删除该条目？引用它的内容会校验失败。',
    en: 'Delete this entry? References to it will fail validation.'
  },
  'editor.idLabel': { zh: 'ID', en: 'ID' },
  'editor.idHint': {
    zh: '小写字母、数字、连字符。保存后不建议再改。',
    en: 'Lowercase letters, digits and hyphens. Avoid changing it after saving.'
  },
  'editor.nameFallback': { zh: '未命名', en: 'Untitled' },
  'editor.issuesForEntry': { zh: '该条目问题', en: 'Issues in this entry' },
  'editor.noIssues': { zh: '没有发现问题', en: 'No issues found' },
  'editor.saveBlocked': { zh: '存在错误，请先修正后再保存。', en: 'Fix the errors before saving.' },
  'editor.saveFailed': { zh: '保存失败', en: 'Save failed' },
  'editor.idDuplicated': { zh: '该 ID 已被同类型条目占用。', en: 'This ID is already used by another entry of the same type.' },
  'editor.newEntry': { zh: '新条目', en: 'New entry' },
  'editor.copySuffix': { zh: '（副本）', en: ' (copy)' },
  'editor.bilingualHint': {
    zh: '双语字段需分别填写英文与中文；中文留空时会回退英文。',
    en: 'Bilingual fields need both English and Chinese; empty Chinese falls back to English.'
  },
  'editor.entries': { zh: '条目', en: 'entries' },
  'editor.required': { zh: '必填', en: 'required' },
  'editor.currentType': { zh: '当前类型', en: 'Current type' },
  'editor.newDraft': { zh: '新条目（未保存）', en: 'New entry (unsaved)' },

  'data.title': { zh: '数据包管理', en: 'Data packs' },
  'data.desc': {
    zh: '导出备份、导入内容包、恢复初始数据。内容包是纯 JSON，可直接纳入版本管理。',
    en: 'Export backups, import content packs, or restore the starter pack. Packs are plain JSON, ready for version control.'
  },
  'data.export': { zh: '导出 JSON', en: 'Export JSON' },
  'data.import': { zh: '导入 JSON', en: 'Import JSON' },
  'data.importHint': {
    zh: '选择由本编辑器导出的 JSON 内容包，导入会覆盖当前全部内容。',
    en: 'Choose a JSON pack exported from this editor. Importing replaces all current content.'
  },
  'data.reset': { zh: '恢复初始内容', en: 'Reset to starter pack' },
  'data.resetConfirm': {
    zh: '这会覆盖当前全部内容，确定继续？',
    en: 'This replaces all current content. Continue?'
  },
  'data.importSuccess': { zh: '导入成功', en: 'Import complete' },
  'data.importError': { zh: '导入失败', en: 'Import failed' },
  'data.invalidFile': { zh: '文件不是有效的内容包', en: 'File is not a valid content pack' },
  'data.versionNewer': {
    zh: '内容包的数据结构版本高于当前应用，请先升级应用。',
    en: 'Pack schema version is newer than this app. Update the app first.'
  },
  'data.schemaVersion': { zh: '数据结构版本', en: 'Schema version' },
  'data.packName': { zh: '内容包名称', en: 'Pack name' },
  'data.packVersion': { zh: '内容包版本', en: 'Pack version' },
  'data.updatedAt': { zh: '更新时间', en: 'Updated at' },
  'data.currentStats': { zh: '当前内容', en: 'Current content' },
  'data.issues': { zh: '校验结果', en: 'Validation' },
  'data.noIssues': { zh: '全部内容通过校验', en: 'Everything passes validation' },
  'data.errors': { zh: '个错误', en: 'errors' },
  'data.warnings': { zh: '个警告', en: 'warnings' },
  'data.locate': { zh: '定位', en: 'Locate' },
  'data.storageNote': {
    zh: '全部内容保存在服务器 SQLite 数据库；编辑器保存、导入、重置都会立即落库，换浏览器也不会丢失。',
    en: 'All content lives in the server SQLite database. Editor saves, imports and resets are written immediately and survive a browser change.'
  },
  'data.exportDone': { zh: '已导出', en: 'Exported' },

  'common.error': { zh: '错误', en: 'Error' },
  'common.warn': { zh: '警告', en: 'Warning' },
  'common.confirm': { zh: '确定', en: 'OK' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.unknown': { zh: '未知', en: 'Unknown' },
  'common.items': { zh: '项', en: 'items' },
  'common.loading': { zh: '加载中…', en: 'Loading…' },
  'common.backHome': { zh: '返回首页', en: 'Back to home' },

  'nav.hero': { zh: '英雄', en: 'Hero' },
  'nav.shop': { zh: '商店', en: 'Shop' },
  'status.serverTime': { zh: '服务器时间', en: 'Server time' },

  'hero.title': { zh: '英雄与背包', en: 'Hero & backpack' },
  'hero.subtitle': {
    zh: '装备会直接改变战斗中的攻防与减伤；消耗品可以立即使用。每次操作都会写入服务器数据库。',
    en: 'Gear changes attack, defense and damage reduction in combat; consumables apply immediately. Every action is written to the server database.'
  },
  'hero.hp': { zh: '体力', en: 'Vitality' },
  'hero.regenHint': {
    zh: '每 10 分钟恢复 1 点体力（按服务器时间）。',
    en: 'Recover 1 vitality every 10 minutes (server time).'
  },
  'hero.downed': {
    zh: '体力耗尽，使用治疗物品或等待恢复后才能出发。',
    en: 'Vitality is empty. Use a healing item or wait for recovery before embarking.'
  },
  'hero.attributes': { zh: '属性', en: 'Attributes' },
  'hero.skills': { zh: '技能', en: 'Skills' },
  'hero.equipment': { zh: '装备槽', en: 'Equipment' },
  'hero.emptySlot': { zh: '空', en: 'Empty' },
  'hero.backpack': { zh: '背包', en: 'Backpack' },
  'hero.emptyBackpack': { zh: '背包是空的。', en: 'The backpack is empty.' },
  'hero.equip': { zh: '装备', en: 'Equip' },
  'hero.unequip': { zh: '卸下', en: 'Unequip' },
  'hero.use': { zh: '使用', en: 'Use' },
  'hero.equipped': { zh: '已装备', en: 'Equipped' },
  'hero.qty': { zh: '数量', en: 'Qty' },
  'hero.noHero': { zh: '还没有英雄。', en: 'No hero yet.' },
  'hero.goCreate': { zh: '去创建英雄', en: 'Create a hero' },
  'hero.actionFailed': { zh: '操作失败', en: 'Action failed' },
  'hero.useSuccess': { zh: '使用成功', en: 'Item used' },
  'hero.effect.heal': { zh: '恢复体力', en: 'Heal' },
  'hero.effect.ep': { zh: '获得经验', en: 'Gain EP' },
  'hero.effect.gold': { zh: '获得金币', en: 'Gain gold' },
  'hero.effect.none': { zh: '没有可使用效果', en: 'No usable effect' },
  'hero.summary': { zh: '当前战斗数值', en: 'Combat stats' },
  'hero.attack': { zh: '攻击', en: 'Attack' },
  'hero.defense': { zh: '防御', en: 'Defense' },
  'hero.absorb': { zh: '减伤', en: 'Absorb' },
  'hero.weapon': { zh: '武器', en: 'Weapon' },
  'hero.noWeapon': { zh: '徒手', en: 'Unarmed' },
  'hero.damageTiers': { zh: '伤害段', en: 'Damage tiers' },
  'hero.damage.normal': { zh: '普通', en: 'Normal' },
  'hero.damage.good': { zh: '好命中', en: 'Good' },
  'hero.damage.critical': { zh: '暴击', en: 'Critical' },
  'hero.initiative': { zh: '先攻', en: 'Initiative' },
  'hero.bonus': { zh: '装备加成', en: 'Gear bonuses' },
  'hero.bonusAttack': { zh: '攻击加成', en: 'Attack bonus' },
  'hero.bonusDefense': { zh: '防御加成', en: 'Defense bonus' },
  'hero.bonusInit': { zh: '先攻加成', en: 'Initiative bonus' },
  'hero.locked': {
    zh: '冒险进行中：装备与物品已锁定，等倒计时结束后再操作。',
    en: 'Adventure in progress: gear and items are locked until the countdown ends.'
  },
  'hero.tactics.title': { zh: '战斗设置', en: 'Combat settings' },
  'hero.tactics.hint': {
    zh: '设置从下一次出发开始生效；当前冒险使用出发时的快照。',
    en: 'Settings apply from your next departure; the current adventure uses the snapshot taken at departure.'
  },
  'hero.tactics.stance': { zh: '姿态', en: 'Stance' },
  'hero.tactics.position': { zh: '站位', en: 'Position' },
  'hero.tactics.targetPriority': { zh: '目标优先级', en: 'Target priority' },
  'hero.tactics.firstRound': { zh: '首回合', en: 'First round' },
  'hero.tactics.save': { zh: '保存设置', en: 'Save settings' },
  'hero.tactics.saved': { zh: '战斗设置已保存。', en: 'Combat settings saved.' },
  'hero.tactics.effect': {
    zh: '进攻姿态：攻击 +10%、防御 -10%；防守姿态反之。站位会修正对不同位置的命中。',
    en: 'Aggressive: +10% attack and -10% defense; defensive is the reverse. Position modifies accuracy against each position.'
  },

  'game.adventure.title': { zh: '冒险进行中', en: 'Adventure in progress' },
  'game.adventure.remaining': { zh: '剩余', en: 'Remaining' },
  'game.adventure.serverNote': {
    zh: '计时由服务器控制，修改本地时间不会提前完成。',
    en: 'Timing is controlled by the server; changing your local clock will not finish it early.'
  },
  'game.adventure.started': { zh: '已出发，等待倒计时结束。', en: 'Departed — wait for the countdown.' },
  'game.adventure.active': { zh: '已有一场冒险正在进行', en: 'An adventure is already running' },
  'game.adventure.wait': { zh: '等待倒计时结束', en: 'Waiting for countdown' },
  'game.adventure.resolving': { zh: '正在结算…', en: 'Resolving…' },
  'game.dungeons.duration': { zh: '时长', en: 'Duration' },
  'game.dungeons.minutes': { zh: '分钟', en: 'min' },
  'game.dungeons.noHp': { zh: '体力不足', en: 'Low vitality' },
  'game.hero.hp': { zh: '体力', en: 'Vitality' },
  'game.hero.openHero': { zh: '打开英雄与背包', en: 'Open hero & backpack' },

  'shop.title': { zh: '商店', en: 'Shop' },
  'shop.subtitle': {
    zh: '用金币购买装备与消耗品；冒险进行中无法交易。金币来自地城结算与出售物品。',
    en: 'Spend gold on gear and consumables. Trading is locked during an adventure; gold comes from dungeon rewards and selling items.'
  },
  'shop.gold': { zh: '金币', en: 'Gold' },
  'shop.buy': { zh: '购买', en: 'Buy' },
  'shop.sell': { zh: '出售', en: 'Sell' },
  'shop.price': { zh: '价格', en: 'Price' },
  'shop.sellPrice': { zh: '售价', en: 'Sell price' },
  'shop.buySuccess': { zh: '购买成功', en: 'Purchased' },
  'shop.sellSuccess': { zh: '出售成功', en: 'Sold' },
  'shop.empty': { zh: '商店暂时没有商品。', en: 'The shop has no goods.' },
  'shop.backpack': { zh: '出售背包物品', en: 'Sell from backpack' },
  'shop.emptyBackpack': { zh: '背包里没有可出售的物品。', en: 'Nothing to sell in the backpack.' },
  'shop.locked': {
    zh: '冒险进行中：商店交易已锁定。',
    en: 'Adventure in progress — trading is locked.'
  },
  'shop.levelReq': { zh: '等级要求', en: 'Level requirement' },
  'shop.charges': { zh: '可使用次数', en: 'Charges' },
  'shop.notEnoughGold': { zh: '金币不足', en: 'Not enough gold' },
  'shop.noHero': { zh: '还没有英雄。', en: 'No hero yet.' },
  'shop.goHero': { zh: '去创建英雄', en: 'Create a hero' },
  'report.embarkQueued': {
    zh: '已再次出发，返回游戏等待倒计时结束。',
    en: 'Departed again — return to the game and wait for the countdown.'
  }
}

export function t(key, language = lang.value) {
  const entry = messages[key]
  if (!entry) return key
  return entry[language] || entry.en || entry.zh || key
}

export { tx }
