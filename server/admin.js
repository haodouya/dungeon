// 管理员后台工具：管理员账号只能在这里设置，前端没有任何管理员注册入口。
// 用法：
//   node server/admin.js set <用户名> <密码>   新建或更新管理员
//   node server/admin.js list                  列出管理员（不含密码）
import * as store from './db.js'
import { validatePassword, validateUsername } from './auth.js'

const [command, username, password] = process.argv.slice(2)

function usage() {
  console.log('用法：')
  console.log('  node server/admin.js set <用户名> <密码>')
  console.log('  node server/admin.js list')
}

if (command === 'set') {
  if (!validateUsername(username) || !validatePassword(password)) {
    console.error('用户名需为 3~24 个字母/数字/下划线/中文，密码需为 8~72 个字符。')
    process.exit(1)
  }
  const result = store.ensureAdminAccount({ username, password })
  console.log(result.created ? '已创建管理员：' : '已更新管理员：')
  console.log(`  用户名：${result.username}`)
  console.log(`  密码：${password}`)
  console.log(`  数据库：${store.DB_PATH}`)
} else if (command === 'list') {
  const admins = store.listAdmins()
  if (!admins.length) {
    console.log('当前没有管理员。用 node server/admin.js set <用户名> <密码> 创建。')
  } else {
    console.log(`共 ${admins.length} 个管理员：`)
    for (const admin of admins) console.log(`  #${admin.id} ${admin.username}（创建于 ${admin.created_at}）`)
  }
} else {
  usage()
}
