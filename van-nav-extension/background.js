// 安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Van Nav 扩展已安装');
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'addToVanNav',
    title: '添加到 Van Nav',
    contexts: ['page', 'link']
  });
});

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToVanNav') {
    // 打开 popup（注意：contextMenus 不能直接打开 popup）
    // 可以在这里打开一个新的标签页或者执行其他操作
    chrome.action.openPopup();
  }
});

// 监听快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-extension') {
    // 获取用户配置
    const result = await chrome.storage.sync.get(['config']);
    const config = result.config || { enableShortcut: true };
    
    // 检查是否启用快捷键
    if (config.enableShortcut !== false) {
      // 打开扩展popup
      chrome.action.openPopup();
    }
  }
});

