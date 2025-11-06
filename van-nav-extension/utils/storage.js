const Storage = {
  // 默认配置
  defaultConfig: {
    server: '119.91.23.95',
    port: '6412',
    token: '',
    enableShortcut: true
  },
  
  // 获取配置
  async getConfig() {
    const result = await chrome.storage.sync.get(['config']);
    return result.config || this.defaultConfig;
  },
  
  // 保存配置
  async saveConfig(config) {
    await chrome.storage.sync.set({ config });
  }
};

