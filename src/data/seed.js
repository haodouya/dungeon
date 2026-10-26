// 初始内容包：全部为本项目自研文案，仅借用通用奇幻概念。
// 后续 M2 会用脚本把 D&D 5.1 SRD（CC-BY-4.0）内容导入为更大的内容包。

export const seedContent = {
  schemaVersion: 1,
  meta: {
    name: { zh: '初始内容包', en: 'Starter Pack' },
    version: '0.1.0',
    updatedAt: '2026-10-25'
  },
  entities: {
    races: [
      {
        id: 'race-borderfolk',
        name: { zh: '边塞人', en: 'Borderfolk' },
        desc: {
          zh: '常年在边境要塞生活的族群，习惯了匮乏与突袭。',
          en: 'A people raised in frontier keeps, hardened by scarcity and raids.'
        },
        attrMods: { st: 1, co: 1, in: 0, dx: 0, ch: 0, ag: 0, pe: 0, wi: 1 },
        traits: { zh: '面对恐惧时意志 +1。', en: 'Gain +1 Willpower when resisting fear.' },
        allowedClassIds: ['class-gladiator', 'class-marksman', 'class-priest', 'class-mage'],
        tags: ['humanoid']
      },
      {
        id: 'race-hill-dwarf',
        name: { zh: '丘陵矮人', en: 'Hill Dwarf' },
        desc: {
          zh: '世代开凿山腹的工匠，对石料与矿脉有近乎本能的直觉。',
          en: 'Stoneworkers whose families have carved the same hills for generations.'
        },
        attrMods: { st: 1, co: 2, in: 0, dx: 0, ch: 0, ag: -1, pe: 0, wi: 0 },
        traits: { zh: '在地下环境中感知 +1。', en: 'Gain +1 Perception underground.' },
        allowedClassIds: ['class-gladiator', 'class-marksman', 'class-priest'],
        tags: ['dwarf', 'humanoid']
      },
      {
        id: 'race-woodfolk',
        name: { zh: '林地人', en: 'Woodfolk' },
        desc: {
          zh: '生活在密林边缘的猎手与采集者，行动轻捷，善于隐蔽。',
          en: 'Hunters and foragers of the forest edge, light-footed and hard to spot.'
        },
        attrMods: { st: -1, co: 0, in: 0, dx: 1, ch: 0, ag: 2, pe: 1, wi: 0 },
        traits: { zh: '在林地中先攻 +1。', en: 'Gain +1 initiative in woodland.' },
        allowedClassIds: ['class-gladiator', 'class-marksman', 'class-priest', 'class-mage'],
        tags: ['humanoid']
      },
      {
        id: 'race-mistkin',
        name: { zh: '雾精', en: 'Mistkin' },
        desc: {
          zh: '从海雾中走出的神秘种族，擅长符文与低语。',
          en: 'A veiled people said to have stepped out of the sea mist, versed in runes and whispers.'
        },
        attrMods: { st: 0, co: -1, in: 1, dx: 0, ch: 1, ag: 0, pe: 0, wi: 2 },
        traits: { zh: '施放法术时意志 +1。', en: 'Gain +1 Willpower when casting spells.' },
        allowedClassIds: ['class-priest', 'class-mage'],
        tags: ['fey']
      }
    ],
    classes: [
      {
        id: 'class-gladiator',
        name: { zh: '角斗士', en: 'Gladiator' },
        desc: {
          zh: '以拳套与短兵近身缠斗的职业，靠身体强度压制对手。',
          en: 'A close-quarters fighter who wins by strength, grit, and a good gauntlet.'
        },
        primaryAttr: 'st',
        secondaryAttr: 'dx',
        baseHp: 11,
        baseResource: 6,
        skillIds: ['skill-brawling', 'skill-dodge'],
        allowedRaceIds: ['race-borderfolk', 'race-hill-dwarf', 'race-woodfolk'],
        startingItemIds: ['item-gladiator-gauntlet', 'item-healing-potion'],
        tags: ['melee']
      },
      {
        id: 'class-marksman',
        name: { zh: '射手', en: 'Marksman' },
        desc: {
          zh: '远程压制的专家，依靠灵巧与感知在安全距离解决战斗。',
          en: 'A ranged specialist who ends fights from a safe distance with steady hands.'
        },
        primaryAttr: 'dx',
        secondaryAttr: 'pe',
        baseHp: 9,
        baseResource: 6,
        skillIds: ['skill-archery', 'skill-dodge'],
        allowedRaceIds: ['race-borderfolk', 'race-hill-dwarf', 'race-woodfolk'],
        startingItemIds: ['item-shortbow', 'item-leather-armor'],
        tags: ['ranged']
      },
      {
        id: 'class-priest',
        name: { zh: '祭司', en: 'Priest' },
        desc: {
          zh: '以信念维系队伍的支援者，能治疗也能以言语动摇敌人。',
          en: 'A support calling on conviction to mend allies and unsettle foes.'
        },
        primaryAttr: 'wi',
        secondaryAttr: 'ch',
        baseHp: 9,
        baseResource: 8,
        skillIds: ['skill-healing', 'skill-alertness'],
        allowedRaceIds: ['race-borderfolk', 'race-hill-dwarf', 'race-woodfolk', 'race-mistkin'],
        startingItemIds: ['item-healing-potion', 'item-wooden-shield'],
        tags: ['support']
      },
      {
        id: 'class-mage',
        name: { zh: '法师', en: 'Mage' },
        desc: {
          zh: '研习符文与元素的施法者，伤害高但身板脆弱。',
          en: 'A student of runes and elements: devastating at range, fragile up close.'
        },
        primaryAttr: 'wi',
        secondaryAttr: 'in',
        baseHp: 8,
        baseResource: 10,
        skillIds: ['skill-fireball', 'skill-alertness'],
        allowedRaceIds: ['race-borderfolk', 'race-woodfolk', 'race-mistkin'],
        startingItemIds: ['item-healing-potion'],
        tags: ['spell']
      }
    ],
    skills: [
      {
        id: 'skill-brawling',
        name: { zh: '肉搏', en: 'Brawling' },
        desc: { zh: '徒手或拳套近身攻击。', en: 'Close-quarters attacks with fists or gauntlets.' },
        category: 'combat',
        maxLevel: 10,
        costEp: 300,
        costGold: 5,
        formula: 'attack = 2*DX + AG + 2*level',
        tags: ['melee']
      },
      {
        id: 'skill-dodge',
        name: { zh: '闪避', en: 'Dodge' },
        desc: { zh: '提升近战防御。', en: 'Improves melee defense.' },
        category: 'combat',
        maxLevel: 10,
        costEp: 300,
        costGold: 5,
        formula: 'defense = (2*DX + AG + 2*level) * 1.1',
        tags: ['defense']
      },
      {
        id: 'skill-archery',
        name: { zh: '弓术', en: 'Archery' },
        desc: { zh: '使用弓弩进行远程攻击。', en: 'Ranged attacks with bows and crossbows.' },
        category: 'combat',
        maxLevel: 10,
        costEp: 350,
        costGold: 6,
        formula: 'attack = 2*DX + PE + 2*level',
        tags: ['ranged']
      },
      {
        id: 'skill-healing',
        name: { zh: '治疗', en: 'Healing' },
        desc: { zh: '恢复队友体力。', en: 'Restores an ally’s HP.' },
        category: 'basic',
        maxLevel: 10,
        costEp: 320,
        costGold: 8,
        formula: 'heal = WI/2 + CH/3 + level/2',
        tags: ['support']
      },
      {
        id: 'skill-fireball',
        name: { zh: '火球术', en: 'Fireball' },
        desc: { zh: '向指定位置投掷火焰。', en: 'Hurls fire at a chosen position.' },
        category: 'combat',
        maxLevel: 10,
        costEp: 400,
        costGold: 10,
        formula: 'attack = 2*WI + IN + 2*level; damage = WI/2 + IN/3 + level/2',
        tags: ['spell', 'fire']
      },
      {
        id: 'skill-alertness',
        name: { zh: '警觉', en: 'Alertness' },
        desc: { zh: '提高先攻与发现陷阱的概率。', en: 'Improves initiative and trap detection.' },
        category: 'basic',
        maxLevel: 10,
        costEp: 280,
        costGold: 4,
        formula: 'initiative = 2*PE + AG + 2*level',
        tags: ['utility']
      }
    ],
    items: [
      {
        id: 'item-gladiator-gauntlet',
        name: { zh: '小型角斗士拳套', en: 'Small Gladiator Gauntlet' },
        desc: { zh: '缠着旧皮条的金属拳套，适合初出茅庐的角斗士。', en: 'A metal gauntlet wrapped in worn leather straps.' },
        slot: 'hands',
        type: 'weapon',
        levelReq: 1,
        weight: 1,
        value: 12,
        attackBonus: 1,
        damageType: 'bludgeoning',
        damageNormal: 1,
        damageGood: 2,
        damageCritical: 3,
        tags: ['melee']
      },
      {
        id: 'item-healing-potion',
        name: { zh: '治疗药水', en: 'Healing Potion' },
        desc: { zh: '带着草药苦味的红色药水。', en: 'A red draught with a bitter herbal aftertaste.' },
        slot: 'pocket',
        type: 'consumable',
        levelReq: 1,
        weight: 1,
        value: 20,
        consumable: true,
        charges: 3,
        useEffect: 'heal',
        effectAmount: 8,
        tags: ['healing']
      },
      {
        id: 'item-shortbow',
        name: { zh: '短弓', en: 'Shortbow' },
        desc: { zh: '轻便的猎弓，适合林地与狭窄巷道。', en: 'A light hunting bow suited to woods and narrow alleys.' },
        slot: 'bothHands',
        type: 'weapon',
        levelReq: 1,
        weight: 2,
        value: 25,
        damageType: 'piercing',
        damageNormal: 2,
        damageGood: 3,
        damageCritical: 4,
        attackBonus: 1,
        tags: ['ranged']
      },
      {
        id: 'item-leather-armor',
        name: { zh: '皮甲', en: 'Leather Armor' },
        desc: { zh: '多层鞣制皮革，轻便而不妨碍动作。', en: 'Layered cured leather that barely restricts movement.' },
        slot: 'body',
        type: 'armor',
        levelReq: 1,
        weight: 4,
        value: 30,
        absorbNormal: 2,
        absorbGood: 1,
        absorbCritical: 0,
        tags: ['armor']
      },
      {
        id: 'item-wooden-shield',
        name: { zh: '木盾', en: 'Wooden Shield' },
        desc: { zh: '包铁边的圆木盾。', en: 'A round wooden shield with an iron rim.' },
        slot: 'leftHand',
        type: 'armor',
        levelReq: 1,
        weight: 3,
        value: 18,
        defenseBonus: 3,
        tags: ['shield']
      },
      {
        id: 'item-iron-sword',
        name: { zh: '铁剑', en: 'Iron Sword' },
        desc: { zh: '没有花纹的实用短剑。', en: 'A plain, practical short sword.' },
        slot: 'rightHand',
        type: 'weapon',
        levelReq: 1,
        weight: 2,
        value: 35,
        attackBonus: 2,
        damageType: 'slashing',
        damageNormal: 2,
        damageGood: 3,
        damageCritical: 4,
        tags: ['blade']
      },
      {
        id: 'item-travel-cloak',
        name: { zh: '旅行斗篷', en: 'Traveler’s Cloak' },
        desc: { zh: '沾满尘土但依旧挡风的厚斗篷。', en: 'A dusty cloak that still keeps the wind out.' },
        slot: 'cloak',
        type: 'accessory',
        levelReq: 1,
        weight: 1,
        value: 10,
        initiativeBonus: 1,
        absorbNormal: 1,
        tags: ['travel']
      },
      {
        id: 'item-hunter-snare',
        name: { zh: '猎人陷阱', en: 'Hunter’s Snare' },
        desc: { zh: '一截细绳与弯曲铁片，能迟滞追击者。', en: 'Cord and bent iron that can slow a pursuer.' },
        slot: 'pocket',
        type: 'tool',
        levelReq: 1,
        weight: 1,
        value: 15,
        consumable: true,
        charges: 1,
        useEffect: 'none',
        effectAmount: 0,
        tags: ['trap']
      }
    ],
    monsters: [
      {
        id: 'monster-dockhand',
        name: { zh: '码头工', en: 'Dockhand' },
        desc: { zh: '本该在卸货，却被地城里的低语激怒。', en: 'Should be unloading crates, but the whispers below have whipped him into a rage.' },
        level: 1,
        hp: 7,
        resource: 5,
        position: 'front',
        attackType: 'melee',
        attackBonus: 8,
        defense: 6,
        damageType: 'bludgeoning',
        damageAvg: 3,
        lootTableId: 'loot-dock-junk',
        tags: ['humanoid']
      },
      {
        id: 'monster-bandit',
        name: { zh: '林中强盗', en: 'Forest Bandit' },
        desc: { zh: '在磨坊附近徘徊的亡命徒。', en: 'A desperate outlaw lurking near the old mill.' },
        level: 2,
        hp: 12,
        resource: 6,
        position: 'left',
        attackType: 'melee',
        attackBonus: 12,
        defense: 9,
        damageType: 'slashing',
        damageAvg: 4,
        lootTableId: 'loot-mill-stash',
        tags: ['humanoid']
      },
      {
        id: 'monster-cave-bat',
        name: { zh: '洞穴蝙蝠', en: 'Cave Bat' },
        desc: { zh: '从潮湿的岩缝里扑出的黑影。', en: 'A black shape bursting from damp crevices.' },
        level: 1,
        hp: 4,
        resource: 3,
        position: 'right',
        attackType: 'sneak',
        attackBonus: 7,
        defense: 8,
        damageType: 'piercing',
        damageAvg: 2,
        lootTableId: 'loot-dock-junk',
        tags: ['beast']
      },
      {
        id: 'monster-marsh-toad',
        name: { zh: '泥沼蟾蜍', en: 'Marsh Toad' },
        desc: { zh: '鼓噪的巨蟾，唾液带有麻痹性毒素。', en: 'A croaking giant toad with numbing venom.' },
        level: 2,
        hp: 14,
        resource: 4,
        position: 'center',
        attackType: 'disease',
        attackBonus: 10,
        defense: 7,
        damageType: 'poison',
        damageAvg: 3,
        lootTableId: 'loot-mill-stash',
        tags: ['beast']
      }
    ],
    dungeons: [
      {
        id: 'dungeon-greyhaven',
        name: { zh: '抵达灰港', en: 'Arrival at Greyhaven' },
        desc: {
          zh: '新手的第一场冒险：在灰港码头清出一条路。',
          en: 'A first adventure: clear a path through the docks of Greyhaven.'
        },
        story: {
          zh: '雨落在灰港的码头上。你的雇主说只要走到仓库尽头，报酬就能到手；可他没提码头工眼里的那股怪劲。',
          en: 'Rain falls on the Greyhaven docks. Your employer promised payment if you reach the far warehouse — but said nothing about the strange look in the dockhands’ eyes.'
        },
        author: { zh: '地城冒险项目组', en: 'Dungeon Quest Team' },
        minLevel: 1,
        recLevel: 1,
        partySize: 1,
        apCost: 6,
        durationMinutes: 3,
        cooldownHours: 10,
        dailyLimit: 4,
        attackType: 'melee',
        defenseType: 'melee',
        notes: { zh: '最初的冒险地城。', en: 'The first adventure dungeon.' },
        tags: ['starter']
      },
      {
        id: 'dungeon-old-mill',
        name: { zh: '废弃磨坊', en: 'The Abandoned Mill' },
        desc: {
          zh: '城外磨坊停转多年，最近却夜夜亮灯。',
          en: 'The mill outside town stopped years ago, yet its lights come on every night.'
        },
        story: {
          zh: '磨坊的风车早已不转，但河岸上仍能看到新鲜的脚印。',
          en: 'The mill wheel has not turned in years, but fresh footprints still mark the riverbank.'
        },
        author: { zh: '地城冒险项目组', en: 'Dungeon Quest Team' },
        minLevel: 2,
        recLevel: 3,
        partySize: 2,
        apCost: 8,
        durationMinutes: 6,
        cooldownHours: 10,
        dailyLimit: 4,
        attackType: 'melee',
        defenseType: 'melee',
        notes: { zh: '适合 2~3 级队伍。', en: 'Suited to level 2–3 parties.' },
        tags: ['starter', 'outdoor']
      }
    ],
    layers: [
      {
        id: 'layer-greyhaven-docks',
        name: { zh: '码头', en: 'The Docks' },
        desc: { zh: '湿滑的石阶与堆叠的木箱。', en: 'Slick stone steps and stacked crates.' },
        dungeonId: 'dungeon-greyhaven',
        index: 1
      },
      {
        id: 'layer-mill-yard',
        name: { zh: '磨坊前院', en: 'Mill Yard' },
        desc: { zh: '杂草丛生的空地，散落着断裂的磨盘。', en: 'An overgrown yard strewn with broken millstones.' },
        dungeonId: 'dungeon-old-mill',
        index: 1
      }
    ],
    rooms: [
      {
        id: 'room-greyhaven-pier',
        name: { zh: '卸货码头', en: 'Offloading Pier' },
        desc: { zh: '栈桥尽头堆着无人认领的货箱。', en: 'Unclaimed crates pile at the end of the pier.' },
        story: {
          zh: '你踏上湿滑的木板，一个码头工缓缓转过身来。',
          en: 'You step onto the wet boards. A dockhand turns slowly to face you.'
        },
        layerId: 'layer-greyhaven-docks',
        index: 1,
        monsterIds: ['monster-dockhand'],
        lootTableId: 'loot-dock-junk',
        nextRoomIds: ['room-greyhaven-warehouse']
      },
      {
        id: 'room-greyhaven-warehouse',
        name: { zh: '潮湿的仓库', en: 'Damp Warehouse' },
        desc: { zh: '盐味浓重的仓库，梁上挂着旧渔网。', en: 'A salt-soaked warehouse hung with old fishing nets.' },
        story: {
          zh: '仓库深处传来绳索摩擦的声音，还有翅膀拍打的回响。',
          en: 'Deep inside, rope creaks and wings beat against the rafters.'
        },
        layerId: 'layer-greyhaven-docks',
        index: 2,
        monsterIds: ['monster-cave-bat'],
        lootTableId: 'loot-dock-junk',
        nextRoomIds: []
      },
      {
        id: 'room-mill-yard',
        name: { zh: '磨坊前院', en: 'Mill Yard' },
        desc: { zh: '断裂的磨盘半埋在泥里。', en: 'A cracked millstone lies half-buried in mud.' },
        story: {
          zh: '两名强盗守在门口，脚边的水洼里蹲着一只巨蟾。',
          en: 'Two bandits guard the door, and a giant toad squats in the puddle beside them.'
        },
        layerId: 'layer-mill-yard',
        index: 1,
        monsterIds: ['monster-bandit', 'monster-marsh-toad'],
        lootTableId: 'loot-mill-stash',
        nextRoomIds: ['room-mill-interior']
      },
      {
        id: 'room-mill-interior',
        name: { zh: '磨坊内室', en: 'Mill Interior' },
        desc: { zh: '灰尘中能看到新鲜的血迹。', en: 'Fresh bloodstains cut through the dust.' },
        story: {
          zh: '最后的强盗退到磨盘后面，手里攥着一把铁剑。',
          en: 'The last bandit backs behind the millstone, clutching an iron sword.'
        },
        layerId: 'layer-mill-yard',
        index: 2,
        monsterIds: ['monster-bandit'],
        lootTableId: 'loot-mill-stash',
        nextRoomIds: []
      }
    ],
    lootTables: [
      {
        id: 'loot-dock-junk',
        name: { zh: '码头杂物', en: 'Dock Junk' },
        desc: { zh: '码头工人身上常见的零碎。', en: 'Common odds and ends carried by dock workers.' },
        itemIds: ['item-travel-cloak', 'item-healing-potion', 'item-hunter-snare'],
        rollsMin: 1,
        rollsMax: 2
      },
      {
        id: 'loot-mill-stash',
        name: { zh: '磨坊藏货', en: 'Mill Stash' },
        desc: { zh: '强盗藏在磨坊里的装备。', en: 'Gear cached by the bandits in the mill.' },
        itemIds: ['item-iron-sword', 'item-leather-armor', 'item-wooden-shield'],
        rollsMin: 1,
        rollsMax: 1
      }
    ]
  }
}
