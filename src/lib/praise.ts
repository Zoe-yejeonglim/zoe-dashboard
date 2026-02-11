// 真诚的称赞语 - 根据不同场景给予温暖的鼓励

export const praiseMessages = {
  // 记账相关
  expense: [
    "记录下来就是进步的第一步，你做得很好",
    "有意识地管理开支，这份自律很珍贵",
    "每一笔记录都是对未来的投资",
    "保持记录的习惯，你比想象中更有毅力",
  ],

  // 储蓄相关
  savings: [
    "又向目标迈进了一步，为你感到骄傲",
    "坚持储蓄不容易，你真的很棒",
    "你的努力终将开花结果",
    "每一分积累都是对自己的承诺",
  ],

  // 工作成就
  work: [
    "这份成就值得被记住，你很优秀",
    "能够总结自己的价值，本身就是一种能力",
    "你的努力和才华都在这里了",
    "每一次突破都让你更强大",
  ],

  // 学习相关
  study: [
    "坚持学习的你，闪闪发光",
    "今天的努力，是明天的底气",
    "知识的积累永远不会辜负你",
    "学习的路上，你从不孤单",
  ],

  // 副业收入
  sidejob: [
    "你的付出得到了回报，这很美好",
    "能力被认可的感觉真好，你值得",
    "斜杠生活的你，真的很酷",
    "每一份收入都是实力的证明",
  ],

  // 目标达成
  goalReached: [
    "目标达成！你证明了自己可以做到",
    "说到做到，这就是你",
    "今天的你，比昨天更强",
    "这份成就感，你值得拥有",
  ],

  // 连续打卡
  streak: [
    "连续坚持的你，有着了不起的意志力",
    "习惯的力量正在你身上显现",
    "每一天的坚持都在塑造更好的你",
    "不积跬步无以至千里，你正在证明这句话",
  ],

  // 通用鼓励
  general: [
    "今天也辛苦了",
    "你做得比自己想象的要好",
    "慢慢来，比较快",
    "相信过程，相信自己",
  ],
}

// 获取随机称赞
export function getPraise(category: keyof typeof praiseMessages): string {
  const messages = praiseMessages[category]
  return messages[Math.floor(Math.random() * messages.length)]
}

// 根据数值给出特定称赞
export function getAchievementPraise(type: 'savings' | 'streak' | 'income', value: number): string {
  if (type === 'savings') {
    if (value >= 1000000) return "一百万！你的坚持让梦想成真"
    if (value >= 500000) return "五十万了！你正走在正确的路上"
    if (value >= 100000) return "十万的里程碑！继续加油"
    return getPraise('savings')
  }

  if (type === 'streak') {
    if (value >= 30) return "30天！一个月的坚持，你太厉害了"
    if (value >= 14) return "两周了！习惯正在养成"
    if (value >= 7) return "一周打卡成功！这是个好的开始"
    return getPraise('streak')
  }

  if (type === 'income') {
    if (value >= 500000) return "五十万收入！你的能力得到了充分认可"
    if (value >= 100000) return "十万收入！副业做得真不错"
    return getPraise('sidejob')
  }

  return getPraise('general')
}
