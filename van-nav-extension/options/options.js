document.addEventListener('DOMContentLoaded', async () => {
  // 加载保存的配置
  const config = await Storage.getConfig();
  document.getElementById('server').value = config.server;
  document.getElementById('port').value = config.port;
  document.getElementById('token').value = config.token;
  document.getElementById('enableShortcut').checked = config.enableShortcut !== false;
  
  // 绑定事件
  document.getElementById('settingsForm').addEventListener('submit', handleSave);
  document.getElementById('testConnection').addEventListener('click', handleTest);
  document.getElementById('resetBtn').addEventListener('click', handleReset);
});

// 保存设置
async function handleSave(e) {
  e.preventDefault();
  
  const config = {
    server: document.getElementById('server').value.trim(),
    port: document.getElementById('port').value.trim(),
    token: document.getElementById('token').value.trim(),
    enableShortcut: document.getElementById('enableShortcut').checked
  };
  
  await Storage.saveConfig(config);
  showStatus('设置已保存', 'success');
}

// 测试连接
async function handleTest() {
  const config = {
    server: document.getElementById('server').value.trim(),
    port: document.getElementById('port').value.trim(),
    token: document.getElementById('token').value.trim()
  };
  
  const testResult = document.getElementById('testResult');
  testResult.textContent = '测试中...';
  testResult.style.color = '#666';
  
  try {
    const url = `http://${config.server}:${config.port}/api/admin/all`;
    const response = await fetch(url, {
      headers: {
        'Authorization': config.token
      }
    });
    
    if (response.ok) {
      testResult.textContent = '✅ 连接成功';
      testResult.style.color = '#28a745';
    } else {
      testResult.textContent = '❌ 连接失败：' + response.status;
      testResult.style.color = '#dc3545';
    }
  } catch (error) {
    testResult.textContent = '❌ 连接失败：' + error.message;
    testResult.style.color = '#dc3545';
  }
}

// 恢复默认
async function handleReset() {
  if (confirm('确定要恢复默认设置吗？')) {
    await Storage.saveConfig(Storage.defaultConfig);
    document.getElementById('server').value = Storage.defaultConfig.server;
    document.getElementById('port').value = Storage.defaultConfig.port;
    document.getElementById('token').value = Storage.defaultConfig.token;
    document.getElementById('enableShortcut').checked = Storage.defaultConfig.enableShortcut;
    showStatus('已恢复默认设置', 'success');
  }
}

// 显示状态
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

