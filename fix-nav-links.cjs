const fs = require('fs');
const path = 'd:/0Z/SimpleFaka/src/views/components/Header.ts';

let content = fs.readFileSync(path, 'utf8');

// 修改桌面端导航链接
content = content.replace(
  '<a href="/purchase"',
  '<a :href="\'/\' + lang + \'/purchase\'"'
);

content = content.replace(
  '<a href="/receive"',
  '<a :href="\'/\' + lang + \'/receive\'"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Header.ts 导航链接已修复');