// 全局变量
let catelogs = [];
let subCatelogs = {};
let currentConfig = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 获取配置
  currentConfig = await Storage.getConfig();
  
  // 2. 获取当前标签页信息（无论是否有token都要执行）
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // 3. 自动填充页面信息（无论是否有token都要执行）
  document.getElementById('name').value = tab.title;
  document.getElementById('url').value = cleanUrl(tab.url);
  
  // 4. 自动获取图标（无论是否有token都要执行）
  await autoLoadIcon(tab.url);
  
  // 5. 绑定事件（必须执行，包括设置按钮）
  bindEvents();
  
  // 6. 检查token
  if (!currentConfig.token) {
    showStatus('⚠️ 请先在设置中配置 API Token', 'error');
    document.getElementById('settingsBtn').style.background = '#ff9800';
    document.getElementById('settingsBtn').style.color = 'white';
    
    // 禁用大分类和子分类的下拉框
    document.getElementById('category').disabled = true;
    document.getElementById('subCategory').disabled = true;
    document.getElementById('addCategoryBtn').disabled = true;
    document.getElementById('addSubCategoryBtn').disabled = true;
    
    return; // 不加载分类列表
  }
  
  // 7. 加载分类列表（需要token）
  await loadCatelogs();
});

// 清理URL（移除参数）
function cleanUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch (e) {
    return url;
  }
}

// 加载分类列表
async function loadCatelogs() {
  try {
    const data = await API.getCatelogs(currentConfig);
    catelogs = data.data || [];
    
    // 填充大分类下拉框
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">请选择大分类</option>';
    
    catelogs.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('加载分类失败:', error);
    showStatus('⚠️ 加载分类失败，请检查网络和配置', 'error');
  }
}

// 加载子分类列表
async function loadSubCatelogs(catelogId) {
  try {
    const data = await API.getSubCatelogs(currentConfig, catelogId);
    subCatelogs[catelogId] = data.data || [];
    
    // 填充子分类下拉框
    const subCategorySelect = document.getElementById('subCategory');
    subCategorySelect.innerHTML = '<option value="">不设置子分类</option>';
    
    subCatelogs[catelogId].forEach(sub => {
      const option = document.createElement('option');
      option.value = sub.id;
      option.textContent = sub.name;
      subCategorySelect.appendChild(option);
    });
    
    // 启用子分类选择和新增按钮
    subCategorySelect.disabled = false;
    document.getElementById('addSubCategoryBtn').disabled = false;
  } catch (error) {
    console.error('加载子分类失败:', error);
    showStatus('加载子分类失败', 'error');
  }
}

// 自动加载图标
async function autoLoadIcon(pageUrl) {
  const iconUrl = document.getElementById('iconUrl');
  const iconImage = document.getElementById('iconImage');
  const iconLoading = document.getElementById('iconLoading');
  const iconPlaceholder = document.getElementById('iconPlaceholder');
  
  // 显示加载状态
  iconPlaceholder.style.display = 'none';
  iconLoading.style.display = 'block';
  
  try {
    // 方法1: 尝试从页面获取 favicon
    let favicon = await getFaviconFromPage();
    
    if (!favicon) {
      // 方法2: 使用 API 获取
      favicon = IconProvider.generateFromUrl(pageUrl);
    }
    
    iconUrl.value = favicon;
    await loadIconPreview(favicon);
  } catch (error) {
    console.error('加载图标失败:', error);
    iconLoading.style.display = 'none';
    iconPlaceholder.style.display = 'flex';
  }
}

// 从页面获取 favicon
async function getFaviconFromPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 执行脚本获取页面的 favicon
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const links = document.querySelectorAll('link[rel*="icon"]');
        for (let link of links) {
          if (link.href) return link.href;
        }
        return null;
      }
    });
    
    return results[0]?.result;
  } catch (error) {
    console.error('无法从页面获取favicon:', error);
    return null;
  }
}

// 加载图标预览
async function loadIconPreview(url) {
  const iconImage = document.getElementById('iconImage');
  const iconLoading = document.getElementById('iconLoading');
  const iconPlaceholder = document.getElementById('iconPlaceholder');
  
  if (!url) {
    iconLoading.style.display = 'none';
    iconPlaceholder.style.display = 'flex';
    return;
  }
  
  iconImage.onload = () => {
    iconLoading.style.display = 'none';
    iconPlaceholder.style.display = 'none';
    iconImage.style.display = 'block';
  };
  
  iconImage.onerror = () => {
    iconLoading.style.display = 'none';
    iconImage.style.display = 'none';
    iconPlaceholder.style.display = 'flex';
  };
  
  iconImage.src = url;
}

// 绑定所有事件
function bindEvents() {
  // 选择本地图片
  document.getElementById('selectIcon').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  
  document.getElementById('fileInput').addEventListener('change', handleFileSelect);
  
  // 上传图片
  document.getElementById('uploadIcon').addEventListener('click', handleUpload);
  
  // API 获取
  document.getElementById('apiIcon').addEventListener('click', handleApiIcon);
  
  // 随机图标
  document.getElementById('randomIcon').addEventListener('click', handleRandomIcon);
  
  // 刷新图标
  document.getElementById('refreshIcon').addEventListener('click', handleRefreshIcon);
  
  // 大分类选择变化
  document.getElementById('category').addEventListener('change', async (e) => {
    const catelogId = e.target.value;
    const subCategorySelect = document.getElementById('subCategory');
    const addSubCategoryBtn = document.getElementById('addSubCategoryBtn');
    
    if (catelogId) {
      // 加载对应的子分类
      await loadSubCatelogs(catelogId);
    } else {
      // 清空并禁用子分类
      subCategorySelect.innerHTML = '<option value="">请先选择大分类</option>';
      subCategorySelect.disabled = true;
      addSubCategoryBtn.disabled = true;
    }
  });
  
  // 新增大分类
  document.getElementById('addCategoryBtn').addEventListener('click', handleAddCategory);
  
  // 新增子分类
  document.getElementById('addSubCategoryBtn').addEventListener('click', handleAddSubCategory);
  
  // 提交表单
  document.getElementById('bookmarkForm').addEventListener('submit', handleSubmit);
  
  // 打开设置
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// 处理文件选择
async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // 显示预览
  const reader = new FileReader();
  reader.onload = (e) => {
    const iconImage = document.getElementById('iconImage');
    const iconPlaceholder = document.getElementById('iconPlaceholder');
    iconPlaceholder.style.display = 'none';
    iconImage.src = e.target.result;
    iconImage.style.display = 'block';
  };
  reader.readAsDataURL(file);
  
  // 保存文件用于后续上传
  window.selectedFile = file;
}

// 处理上传
async function handleUpload() {
  const iconImage = document.getElementById('iconImage');
  const currentSrc = iconImage.src;
  
  // 检查是否有显示的图片
  if (!currentSrc || iconImage.style.display === 'none') {
    showStatus('请先加载图片', 'error');
    return;
  }
  
  showStatus('正在上传...', 'loading');
  
  try {
    const config = await Storage.getConfig();
    let fileToUpload;
    
    // 判断当前图片来源
    if (currentSrc.startsWith('data:')) {
      // Base64 data URL - 转换为 Blob
      fileToUpload = await dataURLtoFile(currentSrc, 'icon.png');
    } else if (window.selectedFile) {
      // 本地文件（用户手动选择的）
      fileToUpload = window.selectedFile;
    } else {
      // 远程 URL - 先下载
      fileToUpload = await downloadImageAsFile(currentSrc);
    }
    
    const uploadedUrl = await API.uploadIcon(config, fileToUpload);
    document.getElementById('iconUrl').value = uploadedUrl;
    await loadIconPreview(uploadedUrl);
    showStatus('上传成功', 'success');
  } catch (error) {
    showStatus('上传失败: ' + error.message, 'error');
  }
}

// 将 Data URL 转换为 File 对象
async function dataURLtoFile(dataUrl, filename) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// 从远程 URL 下载图片并转换为 File 对象
async function downloadImageAsFile(url) {
  try {
    // 首先尝试直接 fetch
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('下载图片失败');
      }
      const blob = await response.blob();
      const filename = url.split('/').pop().split('?')[0] || 'icon.png';
      return new File([blob], filename, { type: blob.type || 'image/png' });
    } catch (fetchError) {
      // 如果 fetch 失败（可能是 CORS），尝试使用 canvas
      return await downloadImageViaCanvas(url);
    }
  } catch (error) {
    throw new Error('无法下载图片: ' + error.message);
  }
}

// 使用 Canvas 下载图片（解决 CORS 问题）
async function downloadImageViaCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('无法转换图片'));
            return;
          }
          const file = new File([blob], 'icon.png', { type: 'image/png' });
          resolve(file);
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('加载图片失败，可能存在跨域限制'));
    };
    
    img.src = url;
  });
}

// 处理 API 获取
async function handleApiIcon() {
  const url = document.getElementById('url').value;
  if (!url) {
    showStatus('请先输入链接', 'error');
    return;
  }
  
  const iconUrl = IconProvider.generateFromUrl(url);
  document.getElementById('iconUrl').value = iconUrl;
  await loadIconPreview(iconUrl);
}

// 处理随机图标
async function handleRandomIcon() {
  const iconUrl = IconProvider.getRandomIcon();
  document.getElementById('iconUrl').value = iconUrl;
  await loadIconPreview(iconUrl);
}

// 处理刷新图标
async function handleRefreshIcon() {
  const iconUrl = document.getElementById('iconUrl').value;
  if (!iconUrl) {
    showStatus('请先设置图标URL', 'error');
    return;
  }
  await loadIconPreview(iconUrl);
}

// 处理新增大分类
async function handleAddCategory() {
  const name = prompt('请输入大分类名称：');
  if (!name || !name.trim()) return;
  
  showStatus('正在创建大分类...', 'loading');
  
  try {
    const result = await API.addCatelog(currentConfig, name.trim());
    
    // 重新加载分类列表
    await loadCatelogs();
    
    // 自动选择刚创建的分类
    const categorySelect = document.getElementById('category');
    categorySelect.value = result.data.id;
    
    // 触发change事件加载子分类
    categorySelect.dispatchEvent(new Event('change'));
    
    showStatus('大分类创建成功', 'success');
  } catch (error) {
    showStatus('创建失败: ' + error.message, 'error');
  }
}

// 处理新增子分类
async function handleAddSubCategory() {
  const catelogId = document.getElementById('category').value;
  if (!catelogId) {
    showStatus('请先选择大分类', 'error');
    return;
  }
  
  const name = prompt('请输入子分类名称：');
  if (!name || !name.trim()) return;
  
  showStatus('正在创建子分类...', 'loading');
  
  try {
    const result = await API.addSubCatelog(currentConfig, catelogId, name.trim());
    
    // 重新加载该大分类的子分类
    await loadSubCatelogs(catelogId);
    
    // 自动选择刚创建的子分类
    const subCategorySelect = document.getElementById('subCategory');
    subCategorySelect.value = result.data.id;
    
    showStatus('子分类创建成功', 'success');
  } catch (error) {
    showStatus('创建失败: ' + error.message, 'error');
  }
}

// 处理表单提交
async function handleSubmit(e) {
  e.preventDefault();
  
  if (!currentConfig.token) {
    showStatus('⚠️ 请先在设置中配置 API Token', 'error');
    return;
  }
  
  showStatus('正在添加...', 'loading');
  
  try {
    // 获取选中的分类名称
    const categorySelect = document.getElementById('category');
    const subCategorySelect = document.getElementById('subCategory');
    
    const categoryName = categorySelect.options[categorySelect.selectedIndex]?.text || '';
    const subCategoryName = subCategorySelect.value ? 
      subCategorySelect.options[subCategorySelect.selectedIndex]?.text : '';
    
    const bookmark = {
      name: document.getElementById('name').value,
      url: document.getElementById('url').value,
      des: document.getElementById('description').value,
      logo: document.getElementById('iconUrl').value,
      catelog: categoryName,
      subCatelog: subCategoryName
    };
    
    const result = await API.addBookmark(currentConfig, bookmark);
    
    // 检查返回消息是否包含"添加成功"
    if (result.message && result.message.includes('添加成功')) {
      showStatus('✅ 添加成功！', 'success');
      
      // 1.5秒后自动关闭扩展程序界面（给用户足够时间看到提示）
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      showStatus('添加完成', 'success');
      
      // 2秒后关闭
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  } catch (error) {
    showStatus('添加失败: ' + error.message, 'error');
  }
}

// 显示状态消息
function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}

