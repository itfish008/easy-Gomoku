export default class DomainChecker {
    constructor(apiKey = '') {
        this.apiKey = apiKey;
        this.apiEndpoint = 'https://whoisapi.whoisxmlapi.com/api/v1';
        this.checkQueue = [];
        this.isChecking = false;
        this.isPaused = false;
        
        // 请求限制配置
        this.rateLimit = {
            maxRequests: 60,  // 每分钟最大请求数
            interval: 60000,  // 时间窗口（毫秒）
            currentRequests: 0,
            resetTimeout: null
        };

        // 回调函数
        this.callbacks = {
            onCheck: null,
            onProgress: null,
            onComplete: null,
            onError: null
        };
    }

    // 设置回调函数
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // 添加域名到检查队列
    addToQueue(domains) {
        this.checkQueue.push(...domains);
        if (!this.isChecking && !this.isPaused) {
            this.startChecking();
        }
    }

    // 开始检查
    async startChecking() {
        if (this.isChecking || this.isPaused) return;
        
        this.isChecking = true;
        while (this.checkQueue.length > 0 && !this.isPaused) {
            const domain = this.checkQueue[0];
            
            try {
                await this.checkDomain(domain);
                this.checkQueue.shift();
                
                // 触发进度回调
                if (this.callbacks.onProgress) {
                    this.callbacks.onProgress({
                        checked: this.checkQueue.length,
                        total: this.checkQueue.length,
                        currentDomain: domain
                    });
                }
            } catch (error) {
                if (error.code === 429) { // Rate limit exceeded
                    await this.wait(5000); // 等待5秒后重试
                    continue;
                }
                
                if (this.callbacks.onError) {
                    this.callbacks.onError(error, domain);
                }
                this.checkQueue.shift(); // 跳过出错的域名
            }
        }

        this.isChecking = false;
        if (this.callbacks.onComplete) {
            this.callbacks.onComplete();
        }
    }

    // 暂停检查
    pause() {
        this.isPaused = true;
    }

    // 继续检查
    resume() {
        this.isPaused = false;
        if (!this.isChecking) {
            this.startChecking();
        }
    }

    // 检查单个域名
    async checkDomain(domain) {
        // 检查频率限制
        if (this.rateLimit.currentRequests >= this.rateLimit.maxRequests) {
            await this.wait(this.rateLimit.interval);
            this.rateLimit.currentRequests = 0;
        }

        const url = new URL(this.apiEndpoint);
        url.searchParams.append('apiKey', this.apiKey);
        url.searchParams.append('domainName', domain);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.rateLimit.currentRequests++;
            
            const result = this.parseWhoisResponse(data);
            
            if (this.callbacks.onCheck) {
                this.callbacks.onCheck(domain, result);
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    // 解析 WHOIS 响应
    parseWhoisResponse(data) {
        return {
            available: !data.registered,
            expiryDate: data.expiryDate || null,
            registrar: data.registrar || null,
            creationDate: data.creationDate || null,
            status: data.domainAvailability || 'unknown'
        };
    }

    // 等待指定���间
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 清空检查队列
    clearQueue() {
        this.checkQueue = [];
        this.isPaused = false;
        this.isChecking = false;
    }
} 