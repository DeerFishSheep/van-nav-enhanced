# Van Nav 浏览器扩展安装指南

## 📦 准备工作

在安装扩展之前，请确保：

1. ✅ Van Nav 导航站已部署并正常运行
2. ✅ 已在后台生成 API Token
3. ✅ 浏览器为 Chrome、Edge、或其他 Chromium 内核浏览器

## 🚀 安装步骤

### 第一步：准备图标文件

扩展需要3个尺寸的图标文件。有两种方式：

#### 方式A：快速生成占位符图标

1. 打开浏览器，按 `F12` 打开开发者工具
2. 切换到 Console 标签页
3. 复制粘贴以下代码并回车：

```javascript
// 快速生成 Van Nav 扩展图标
const sizes = [16, 48, 128];
const zip = new JSZip();

sizes.forEach(size => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // 绘制蓝色背景
  ctx.fillStyle = '#4285f4';
  ctx.fillRect(0, 0, size, size);
  
  // 绘制白色字母 V
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', size / 2, size / 2);
  
  // 转换为 Blob 并下载
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `icon${size}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

console.log('✅ 图标文件已生成，请保存到 van-nav-extension/icons/ 文件夹');
```

4. 将下载的3个图标文件（`icon16.png`, `icon48.png`, `icon128.png`）放入 `van-nav-extension/icons/` 文件夹

#### 方式B：自定义设计图标

参考 `icons/README.md` 中的详细说明，使用图片编辑工具创建自己的图标。

### 第二步：加载扩展到浏览器

1. 打开 Chrome 浏览器
2. 在地址栏输入：`chrome://extensions/` 并回车
3. 点击右上角，开启"**开发者模式**"
4. 点击"**加载已解压的扩展程序**"
5. 选择 `van-nav-extension` 文件夹
6. 看到扩展图标出现在工具栏，安装成功！🎉

### 第三步：配置扩展

1. 点击工具栏中的 Van Nav 扩展图标
2. 点击"**⚙️ 设置**"按钮
3. 填写配置信息：
   - **服务器地址**：你的 Van Nav 服务器IP或域名（如：`119.91.23.95`）
   - **端口**：Van Nav 服务端口（默认：`6412`）
   - **API Token**：在 Van Nav 后台生成的访问令牌
4. 点击"**🔍 测试连接**"验证配置
5. 看到"✅ 连接成功"后，点击"**💾 保存设置**"

## 🎯 开始使用

### 添加书签

1. 浏览任意你想收藏的网页
2. 点击工具栏中的 Van Nav 扩展图标
3. 扩展会自动填充：
   - ✅ 页面标题 → 名称
   - ✅ 页面URL → 链接
   - ✅ 网站图标 → 自动获取
4. 可选填写：
   - 简介
   - 大分类
   - 子分类
5. 点击"**添加到导航站**"

### 图标功能

- **📁 选择**：从电脑选择图片
- **☁️ 上传**：上传到服务器获取URL
- **🔗 API**：自动从网站获取图标
- **🎲 随机**：从图标库随机选择
- **🔄 刷新**：重新加载当前图标

## ⚙️ 高级配置

### 固定扩展到工具栏

1. 点击浏览器工具栏右侧的 🧩（扩展）图标
2. 找到 Van Nav 扩展
3. 点击 📌 图钉图标固定

### 设置快捷键（可选）

1. 打开 `chrome://extensions/shortcuts`
2. 找到 Van Nav 扩展
3. 设置你喜欢的快捷键（如 `Ctrl+Shift+V`）

### 右键菜单

扩展自动添加右键菜单功能：
- 在任意网页上右键
- 选择"**添加到 Van Nav**"

## 🔧 故障排查

### 问题1：无法加载扩展

**可能原因**：缺少图标文件

**解决方法**：
1. 确保 `icons/` 文件夹中有3个图标文件
2. 文件命名必须为：`icon16.png`、`icon48.png`、`icon128.png`

### 问题2：连接测试失败

**可能原因**：
- 服务器地址或端口错误
- API Token 无效
- 防火墙阻止

**解决方法**：
1. 在浏览器中访问 `http://你的服务器:端口/` 确认服务正常
2. 在 Van Nav 后台重新生成 API Token
3. 检查服务器防火墙设置，确保端口开放

### 问题3：添加书签失败

**错误信息**：`HTTP 401: Unauthorized`

**解决方法**：API Token 无效或过期，请重新生成

---

**错误信息**：`HTTP 403: Forbidden`

**解决方法**：Token 权限不足，确保在后台正确配置

---

**错误信息**：`Failed to fetch`

**解决方法**：
1. 检查网络连接
2. 确认 Van Nav 服务正在运行
3. 检查 CORS 配置（后端需要允许跨域请求）

### 问题4：图标显示失败

**解决方法**：
1. 点击"🔗 API"按钮重新获取
2. 或使用"🎲 随机"功能
3. 或手动输入图标URL

## 📝 注意事项

1. **安全性**：API Token 请妥善保管，不要分享给他人
2. **网络**：确保能访问 Van Nav 服务器
3. **浏览器**：建议使用最新版本的 Chrome 或 Edge
4. **CORS**：如果遇到跨域问题，需要在服务器端配置允许跨域

## 🎓 后续步骤

扩展安装成功后，你可以：

- 📚 批量导入现有书签
- 🎨 自定义分类管理
- 🔍 使用搜索功能快速查找
- 📱 在任何设备访问你的导航站

## 💡 使用技巧

1. **快速访问**：将扩展固定到工具栏，随时添加书签
2. **分类整理**：提前在 Van Nav 后台创建好分类，添加时直接选择
3. **批量处理**：使用浏览器的标签页功能，一次性添加多个书签
4. **图标美化**：使用"随机"功能为书签选择精美图标

---

需要帮助？请访问：https://github.com/DeerFishSheep/van-nav-enhanced/issues

