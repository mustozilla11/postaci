const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Store {
  constructor(defaults = {}) {
    const userDataPath = app.getPath('userData');
    this.path = path.join(userDataPath, 'postaci-config.json');
    this.data = this.parseDataFile(this.path, defaults);
  }

  parseDataFile(filePath, defaults) {
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return Object.assign({}, defaults, JSON.parse(fileContent));
      }
    } catch (error) {
      console.error('Config dosyası okunamadı, varsayılanlar kullanılıyor:', error);
    }
    return defaults;
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Config kaydedilemedi:', error);
    }
  }

  getAll() {
    return this.data;
  }
}

module.exports = Store;
