const IconProvider = {
  // 图标集合配置
  iconCollections: {
    'AttackOnTitan': { start: 1001, end: 1084, ext: 'png' },
    'Digimon': { start: 1001, end: 1056, ext: 'png' },
    'Doraemon': { start: 1001, end: 1100, ext: 'png' },
    'Genshin': { start: 1001, end: 1160, ext: 'png' },
    'Maruko-chan': { start: 1001, end: 1100, ext: 'png' },
    'Naruto': { start: 1001, end: 1284, ext: 'png' },
    'OnePiece': { start: 1001, end: 1100, ext: 'png' },
    'Pokemon': { start: 1001, end: 1112, ext: 'png' },
    'PokemonGif': { start: 1001, end: 1056, ext: 'gif' },
    'Shin-Miya': { start: 1001, end: 1100, ext: 'png' },
    'Shin-chan': { start: 1001, end: 1100, ext: 'png' },
    'Stitch': { start: 1001, end: 1100, ext: 'png' },
    'Tom-Jerry': { start: 1001, end: 1100, ext: 'png' },
    'Transformers': { start: 1001, end: 1048, ext: 'png' },
    'Weslie-Wolffy': { start: 1001, end: 1100, ext: 'png' }
  },
  
  // 从URL生成图标（使用API）
  generateFromUrl(url) {
    const domain = this.extractDomain(url);
    return `https://api.afmax.cn/so/ico/index.php?r=${domain}`;
  },
  
  // 提取域名
  extractDomain(urlString) {
    try {
      let processedUrl = urlString;
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        processedUrl = 'https://' + urlString;
      }
      
      const url = new URL(processedUrl);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      // 使用正则表达式提取
      const match = urlString.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\.[a-zA-Z]{2,})(?:\/|$)/);
      if (match && match[1]) {
        return `https://${match[1]}`;
      }
      return urlString;
    }
  },
  
  // 获取随机图标
  getRandomIcon() {
    const keys = Object.keys(this.iconCollections);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const collection = this.iconCollections[randomKey];
    
    const randomNumber = Math.floor(Math.random() * (collection.end - collection.start + 1)) + collection.start;
    const baseURL = 'https://raw.githubusercontent.com/DeerFishSheep/Quantumult/refs/heads/main/icon/';
    
    return `${baseURL}${randomKey}/${randomKey}-${randomNumber}.${collection.ext}`;
  }
};

