export default class StorageManager {
    constructor() {
        this.dbName = 'domainGeneratorDB';
        this.dbVersion = 1;
        this.db = null;
        
        // 初始化数据库
        this.initDB();
    }

    // 初始化 IndexedDB
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject('无法打开数据库');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建域名存储表
                if (!db.objectStoreNames.contains('domains')) {
                    const domainsStore = db.createObjectStore('domains', { keyPath: 'domain' });
                    domainsStore.createIndex('status', 'status', { unique: false });
                    domainsStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // 创建收藏夹表
                if (!db.objectStoreNames.contains('favorites')) {
                    const favoritesStore = db.createObjectStore('favorites', { keyPath: 'domain' });
                    favoritesStore.createIndex('category', 'category', { unique: false });
                    favoritesStore.createIndex('addedAt', 'addedAt', { unique: false });
                }

                // 创建生成配置表
                if (!db.objectStoreNames.contains('configs')) {
                    db.createObjectStore('configs', { keyPath: 'id' });
                }
            };
        });
    }

    // 保存域名
    async saveDomain(domain, status = 'pending') {
        const store = this.getStore('domains', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put({
                domain,
                status,
                createdAt: new Date().toISOString(),
                checkedAt: null,
                available: null
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 批量保存域名
    async saveDomains(domains) {
        const store = this.getStore('domains', 'readwrite');
        const timestamp = new Date().toISOString();

        return Promise.all(domains.map(domain => {
            return new Promise((resolve, reject) => {
                const request = store.put({
                    domain,
                    status: 'pending',
                    createdAt: timestamp,
                    checkedAt: null,
                    available: null
                });

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }));
    }

    // 更新域名状态
    async updateDomainStatus(domain, status, available) {
        const store = this.getStore('domains', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.get(domain);

            request.onsuccess = () => {
                const data = request.result;
                if (data) {
                    data.status = status;
                    data.available = available;
                    data.checkedAt = new Date().toISOString();
                    store.put(data).onsuccess = () => resolve();
                } else {
                    reject('域名不存在');
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // 添加到收藏夹
    async addToFavorites(domain, category = 'default', note = '') {
        const store = this.getStore('favorites', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put({
                domain,
                category,
                note,
                addedAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 从收藏夹移除
    async removeFromFavorites(domain) {
        const store = this.getStore('favorites', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.delete(domain);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 保存用户配置
    async saveConfig(config) {
        const store = this.getStore('configs', 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.put({
                id: 'userConfig',
                ...config,
                updatedAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 获取用户配置
    async getConfig() {
        const store = this.getStore('configs', 'readonly');
        return new Promise((resolve, reject) => {
            const request = store.get('userConfig');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 导出域名列表
    async exportDomains(format = 'csv') {
        const store = this.getStore('domains', 'readonly');
        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                const domains = request.result;
                if (format === 'csv') {
                    const csv = this.convertToCSV(domains);
                    resolve(new Blob([csv], { type: 'text/csv' }));
                } else if (format === 'txt') {
                    const txt = domains.map(d => d.domain).join('\n');
                    resolve(new Blob([txt], { type: 'text/plain' }));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // 清理数据
    async clearData(storeName) {
        const store = this.getStore(storeName, 'readwrite');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // 获取存储对象
    getStore(storeName, mode = 'readonly') {
        return this.db
            .transaction(storeName, mode)
            .objectStore(storeName);
    }

    // 转换为 CSV 格式
    convertToCSV(data) {
        const headers = ['domain', 'status', 'available', 'createdAt', 'checkedAt'];
        const rows = data.map(item => 
            headers.map(header => JSON.stringify(item[header] || '')).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    }
} 