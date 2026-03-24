const fs = require('fs');
const path = 'd:/0Z/SimpleFaka/src/views/components/Header.ts';

let content = fs.readFileSync(path, 'utf8');

// 替换中文按钮
content = content.replace(
  /lang = 'zh'; langOpen = false; setTimeout\(\(\) => location\.reload\(\), 50\);/g,
  "switchToLanguage('zh')"
);

// 替换英文按钮
content = content.replace(
  /lang = 'en'; langOpen = false; setTimeout\(\(\) => location\.reload\(\), 50\);/g,
  "switchToLanguage('en')"
);

// 添加 switchToLanguage 方法
content = content.replace(
  /(console\.error\('Logout failed:', error\);\s+}\s+})\s+}\s+}\s+<\/script>/,
  `$1,
        
        switchToLanguage(newLang) {
          localStorage.setItem('lang', newLang);
          const currentPath = window.location.pathname;
          let newPath;
          if (currentPath.startsWith('/zh/')) {
            newPath = '/' + newLang + currentPath.substring(3);
          } else if (currentPath.startsWith('/en/')) {
            newPath = '/' + newLang + currentPath.substring(3);
          } else if (currentPath === '/zh' || currentPath === '/en') {
            newPath = '/' + newLang;
          } else {
            newPath = '/' + newLang + currentPath;
          }
          window.location.href = newPath;
        }
      }
    }
  </script>`
);

fs.writeFileSync(path, content, 'utf8');
console.log('✅ Header.ts 已成功修改，保持UTF-8 编码');