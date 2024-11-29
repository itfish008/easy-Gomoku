export default class DomainGenerator {
    constructor() {
        // 初始化 Web Worker
        this.worker = new Worker('js/worker.js');
        this.isGenerating = false;
        this.isPaused = false;
        
        // 配置默认值
        this.config = {
            minLength: 2,
            maxLength: 3,
            charset: {
                az: true,  // 小写字母
                '09': false,  // 数字
                '-': false   // 连字符
            },
            tlds: ['.com']
        };

        // 绑定 Worker 消息处理
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        
        // 回调函数
        this.callbacks = {
            onProgress: null,
            onComplete: null,
            onDomainGenerated: null
        };
    }

    // 设置回调函数
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // 生成字符集
    generateCharset() {
        let chars = '';
        if (this.config.charset.az) {
            chars += 'abcdefghijklmnopqrstuvwxyz';
        }
        if (this.config.charset['09']) {
            chars += '0123456789';
        }
        if (this.config.charset['-']) {
            chars += '-';
        }
        return chars;
    }

    // 开始生成
    start(config) {
        if (this.isGenerating && !this.isPaused) {
            return false;
        }

        this.config = { ...this.config, ...config };
        this.isGenerating = true;
        this.isPaused = false;

        const charset = this.generateCharset();
        
        // 发送消息给 Worker 开始生成
        this.worker.postMessage({
            type: 'start',
            data: {
                minLength: this.config.minLength,
                maxLength: this.config.maxLength,
                charset: charset,
                tlds: this.config.tlds
            }
        });

        return true;
    }

    // 暂停生成
    pause() {
        if (!this.isGenerating || this.isPaused) {
            return false;
        }

        this.isPaused = true;
        this.worker.postMessage({ type: 'pause' });
        return true;
    }

    // 继续生成
    resume() {
        if (!this.isGenerating || !this.isPaused) {
            return false;
        }

        this.isPaused = false;
        this.worker.postMessage({ type: 'resume' });
        return true;
    }

    // 停止生成
    stop() {
        this.isGenerating = false;
        this.isPaused = false;
        this.worker.postMessage({ type: 'stop' });
    }

    // 处理 Worker 消息
    handleWorkerMessage(event) {
        const { type, data } = event.data;

        switch (type) {
            case 'domain':
                if (this.callbacks.onDomainGenerated) {
                    this.callbacks.onDomainGenerated(data);
                }
                break;

            case 'progress':
                if (this.callbacks.onProgress) {
                    this.callbacks.onProgress(data);
                }
                break;

            case 'complete':
                this.isGenerating = false;
                if (this.callbacks.onComplete) {
                    this.callbacks.onComplete(data);
                }
                break;
        }
    }

    // 验证域名是否有效
    static isValidDomain(domain) {
        // 域名基本验证规则
        const rules = {
            startWithHyphen: /^-/,
            endWithHyphen: /-$/,
            consecutiveHyphens: /--/,
            validChars: /^[a-z0-9-]+$/
        };

        // 去掉后缀进行验证
        const name = domain.split('.')[0];

        if (rules.startWithHyphen.test(name)) return false;
        if (rules.endWithHyphen.test(name)) return false;
        if (rules.consecutiveHyphens.test(name)) return false;
        if (!rules.validChars.test(name)) return false;

        return true;
    }
} 