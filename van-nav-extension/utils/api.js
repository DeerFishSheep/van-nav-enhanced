const API = {
  // 获取所有分类
  async getCatelogs(config) {
    const url = `http://${config.server}:${config.port}/api/admin/all`;
    const response = await fetch(url, {
      headers: {
        'Authorization': config.token
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    // /api/admin/all 返回所有数据，我们只需要 catelogs
    return { data: result.data.catelogs };
  },
  
  // 获取指定大分类下的子分类
  async getSubCatelogs(config, catelogId) {
    const url = `http://${config.server}:${config.port}/api/admin/subcatelog/${catelogId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': config.token
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
  
  // 新增大分类
  async addCatelog(config, name) {
    const url = `http://${config.server}:${config.port}/api/admin/catelog`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.token
      },
      body: JSON.stringify({ name, sort: 0 })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
  
  // 新增子分类
  async addSubCatelog(config, catelogId, name) {
    const url = `http://${config.server}:${config.port}/api/admin/subcatelog`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.token
      },
      body: JSON.stringify({
        catelogId: parseInt(catelogId),
        name,
        sort: 0
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
  
  // 添加书签
  async addBookmark(config, bookmark) {
    const url = `http://${config.server}:${config.port}/api/admin/tool`;
    
    // 获取 token（需要先登录或使用 API token）
    const token = config.token;
    if (!token) {
      throw new Error('未配置访问令牌，请先在设置中配置');
    }
    
    // 准备请求体（支持新格式 categories 数组）
    const requestBody = {
      name: bookmark.name,
      url: bookmark.url,
      desc: bookmark.desc || bookmark.des || '',  // 兼容旧字段名
      logo: bookmark.logo || '',
      categories: bookmark.categories || [],  // 新格式：多分类数组
      sort: bookmark.sort || 0,
      hide: bookmark.hide || false
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.errorMessage || '添加失败');
    }
    
    return data;
  },
  
  // 上传图标
  async uploadIcon(config, file) {
    // 这里使用一个公共的图片上传服务
    // 你可以替换为自己的上传接口
    const uploadUrl = 'http://www.hd-r.cn/api/upload';
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('上传失败');
    }
    
    const data = await response.json();
    return data.link;
  }
};

