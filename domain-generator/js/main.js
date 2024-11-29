class DomainGenerator {
    constructor() {
        this.initializeUI();
        this.bindEvents();
        this.domains = [];
        this.isGenerating = false;
        this.currentGenerator = null;
        this.currentLength = 0;
        this.updateInterval = null;
        this.lastDomain = '';
        this.currentPage = 1;
        this.pageSize = 100;
        this.isChecking = false;
        this.checkQueue = [];
        this.selectedTlds = new Set(['.com']);
        this.domainStatus = new Map();
        this.initializeLengthInputs();
        if (this.elements.nextPage) {
            this.elements.nextPage.disabled = false;
        }
        this.checkCache = new Map();
        this.hideInvalid = false;
    }

    initializeUI() {
        this.elements = {
            length: document.getElementById('length'),
            charsetOptions: document.querySelectorAll('.charset-options input'),
            generateBtn: document.getElementById('generateBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            clearBtn: document.getElementById('clearBtn'),
            exportBtn: document.getElementById('exportBtn'),
            generatedCount: document.getElementById('generatedCount'),
            resultArea: document.getElementById('resultArea'),
            resultBody: document.getElementById('resultBody'),
            currentPage: document.getElementById('currentPage'),
            totalPages: document.getElementById('totalPages'),
            prevPage: document.getElementById('prevPage'),
            nextPage: document.getElementById('nextPage'),
            pageSize: document.getElementById('pageSize'),
            checkBtn: document.getElementById('checkBtn'),
            tldOptions: document.querySelectorAll('input[name="tld"]'),
            selectAllTlds: document.getElementById('selectAllTlds'),
            unselectAllTlds: document.getElementById('unselectAllTlds'),
            exportAvailableBtn: document.getElementById('exportAvailableBtn'),
            lengthType: document.querySelectorAll('input[name="lengthType"]'),
            fixedLength: document.getElementById('fixedLength'),
            minLength: document.getElementById('minLength'),
            maxLength: document.getElementById('maxLength'),
            fixedLengthInput: document.getElementById('fixedLengthInput'),
            rangeLengthInput: document.getElementById('rangeLengthInput'),
            customWord: document.getElementById('customWord'),
            addCustomWord: document.getElementById('addCustomWord'),
            customWordList: document.getElementById('customWordList'),
            hideInvalid: document.getElementById('hideInvalid'),
        };
    }

    initializeLengthInputs() {
        this.elements.lengthType.forEach(radio => {
            radio.addEventListener('change', () => {
                const isFixed = radio.value === 'fixed';
                this.elements.fixedLengthInput.style.display = isFixed ? 'flex' : 'none';
                this.elements.rangeLengthInput.style.display = isFixed ? 'none' : 'flex';
            });
        });
    }

    bindEvents() {
        this.elements.generateBtn.addEventListener('click', () => {
            if (!this.isGenerating) {
                this.startGeneration();
            } else {
                this.pauseGeneration();
            }
        });

        this.elements.pauseBtn.addEventListener('click', () => {
            if (this.isGenerating) {
                this.pauseGeneration();
            } else {
                this.resumeGeneration();
            }
        });

        this.elements.clearBtn.addEventListener('click', () => this.clearResults());
        this.elements.exportBtn.addEventListener('click', () => this.exportResults());
        this.elements.prevPage.addEventListener('click', () => {
            console.log('点击上一页按钮');
            this.prevPage();
        });
        this.elements.nextPage.addEventListener('click', () => {
            console.log('点击下一页按钮');
            this.nextPage();
        });
        this.elements.pageSize.addEventListener('change', () => {
            this.pageSize = parseInt(this.elements.pageSize.value);
            this.currentPage = 1;
            this.updateDisplay();
        });
        this.elements.checkBtn.addEventListener('click', () => this.checkDomains());
        this.elements.tldOptions.forEach(option => {
            option.addEventListener('change', () => this.updateSelectedTlds());
        });

        this.elements.selectAllTlds.addEventListener('click', () => this.toggleAllTlds(true));
        this.elements.unselectAllTlds.addEventListener('click', () => this.toggleAllTlds(false));
        this.elements.exportAvailableBtn.addEventListener('click', () => this.exportAvailableDomains());
        this.elements.addCustomWord.addEventListener('click', () => this.addCustomWordConstraint());
        this.elements.customWord.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addCustomWordConstraint();
            }
        });
        this.elements.hideInvalid.addEventListener('change', () => {
            this.hideInvalid = this.elements.hideInvalid.checked;
            this.updateDisplay();
        });
    }

    startGeneration() {
        if (!this.validateConfig()) return;

        const config = this.getGenerationConfig();
        const charset = this.getCharset();

        if (!charset) {
            alert('请选择至少一种字符集');
            return;
        }

        console.log('开始生成域名:', {
            charset,
            config,
            isFixed: config.minLength === config.maxLength
        });

        this.isGenerating = true;
        this.updateUIForGeneration(true);
        
        this.domains = [];
        this.currentLength = config.minLength;
        this.currentGenerator = null;

        this.generateBatch(charset, config.minLength, config.maxLength);
    }

    pauseGeneration() {
        this.isGenerating = false;
        this.updateUIForGeneration(false);
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    resumeGeneration() {
        if (this.currentGenerator) {
            this.isGenerating = true;
            this.updateUIForGeneration(true);
            
            const config = this.getGenerationConfig();
            
            this.generateBatch(this.getCharset(), config.minLength, config.maxLength);
        }
    }

    generateBatch(charset, minLength, maxLength) {
        if (!this.isGenerating) return;

        const processBatch = () => {
            if (!this.isGenerating) return;

            const startTime = Date.now();
            const maxProcessTime = 100;

            try {
                while ((Date.now() - startTime) < maxProcessTime) {
                    if (!this.currentGenerator) {
                        if (this.currentLength > maxLength) {
                            this.isGenerating = false;
                            this.updateUIForGeneration(false);
                            console.log('生成完成');
                            return;
                        }
                        console.log(`创建长度 ${this.currentLength} 的生成器`);
                        this.currentGenerator = this.generateDomains(charset, this.currentLength);
                    }

                    const {value: domain, done} = this.currentGenerator.next();
                    
                    if (done) {
                        console.log(`长度 ${this.currentLength} 生成完成`);
                        this.currentLength++;
                        this.currentGenerator = null;
                        continue;
                    }
                    
                    if (this.isValidDomain(domain)) {
                        this.domains.push(domain);
                        this.updateUI(domain);
                    }
                }
            } catch (error) {
                console.error('生成过程出错:', error);
            }

            if (this.isGenerating) {
                setTimeout(processBatch, 0);
            }
        };

        processBatch();
    }

    updateUIForGeneration(isGenerating) {
        this.elements.generateBtn.textContent = isGenerating ? '暂停' : '开始生成';
        this.elements.pauseBtn.disabled = !isGenerating;
        
        // 禁用/启用长度输入
        const isFixed = Array.from(this.elements.lengthType)
            .find(radio => radio.checked).value === 'fixed';
            
        if (isFixed) {
            this.elements.fixedLength.disabled = isGenerating;
        } else {
            this.elements.minLength.disabled = isGenerating;
            this.elements.maxLength.disabled = isGenerating;
        }

        // 禁用/启用字符集选择
        this.elements.charsetOptions.forEach(opt => opt.disabled = isGenerating);
        
        // 禁用/启用长度类型选择
        this.elements.lengthType.forEach(radio => radio.disabled = isGenerating);
    }

    getCharset() {
        let charset = '';
        this.elements.charsetOptions.forEach(option => {
            if (option.checked) {
                switch (option.value) {
                    case 'az':
                        charset += 'abcdefghijklmnopqrstuvwxyz';
                        break;
                    case '09':
                        charset += '0123456789';
                        break;
                    case '-':
                        charset += '-';
                        break;
                }
            }
        });
        return charset;
    }

    getGenerationConfig() {
        const isFixed = Array.from(this.elements.lengthType)
            .find(radio => radio.checked).value === 'fixed';

        // 获取选中的字母组合
        const wordConstraints = Array.from(document.querySelectorAll('input[name="word"]:checked'))
            .map(input => input.value);

        if (isFixed) {
            const length = parseInt(this.elements.fixedLength.value);
            return {
                minLength: length,
                maxLength: length,
                charset: {
                    az: this.elements.charsetOptions[0].checked,
                    '09': this.elements.charsetOptions[1].checked,
                    '-': this.elements.charsetOptions[2].checked
                },
                wordConstraints  // 添加字母组合约束
            };
        } else {
            return {
                minLength: parseInt(this.elements.minLength.value),
                maxLength: parseInt(this.elements.maxLength.value),
                charset: {
                    az: this.elements.charsetOptions[0].checked,
                    '09': this.elements.charsetOptions[1].checked,
                    '-': this.elements.charsetOptions[2].checked
                },
                wordConstraints  // 添加字母组合约束
            };
        }
    }

    validateConfig() {
        const config = this.getGenerationConfig();
        const isFixed = Array.from(this.elements.lengthType)
            .find(radio => radio.checked).value === 'fixed';

        if (isFixed) {
            if (config.minLength < 1 || config.minLength > 63) {
                alert('域名长度必须在1到63之间');
                return false;
            }
        } else {
            if (config.minLength > config.maxLength) {
                alert('最小长度不能大于最大长度');
                return false;
            }
            if (config.minLength < 1 || config.maxLength > 63) {
                alert('域名长度必须在1到63之间');
                return false;
            }
        }

        if (!this.getCharset()) {
            alert('请至少选择一种字符集');
            return false;
        }

        return true;
    }

    *generateDomains(charset, length) {
        const chars = charset.split('');
        const indices = new Array(length).fill(0);
        
        do {
            const domain = indices.map(i => chars[i]).join('');
            yield domain;

            let pos = length - 1;
            while (pos >= 0) {
                indices[pos]++;
                if (indices[pos] < chars.length) {
                    break;
                }
                indices[pos] = 0;
                pos--;
            }
            if (pos < 0) break;
        } while (true);
    }

    isValidDomain(domain) {
        // 基本规则验证
        if (domain.startsWith('-') || domain.endsWith('-')) return false;
        if (domain.includes('--')) return false;

        // 获取选中的字母组合
        const selectedWords = Array.from(document.querySelectorAll('input[name="word"]:checked'))
            .map(input => input.value);

        // 如果没有选择字母组合，只进行基本验证
        if (selectedWords.length === 0) {
            return true;
        }

        // 修改这里：只要包含任意一个字母组合即
        return selectedWords.some(word => domain.includes(word));
    }

    updateUI(domain) {
        this.lastDomain = domain;
        
        this.elements.generatedCount.textContent = this.domains.length;

        const totalPages = Math.ceil(this.domains.length / this.pageSize);
        this.elements.totalPages.textContent = totalPages;

        const isLastPage = this.currentPage === totalPages;
        if (isLastPage) {
            this.updateDisplay();
        }

        if (this.domains.length % 1000 === 0) {
            console.log(`已生成 ${this.domains.length} 个域名`);
        }
    }

    updateDisplay() {
        this.pageSize = parseInt(this.elements.pageSize.value) || 100;
        
        const totalPages = Math.max(1, Math.ceil(this.domains.length / this.pageSize));
        
        if (this.currentPage > totalPages) {
            this.currentPage = totalPages;
        }
        
        const start = (this.currentPage - 1) * this.pageSize;
        const end = Math.min(start + this.pageSize, this.domains.length);
        const pageData = this.domains.slice(start, end);

        this.elements.resultBody.innerHTML = pageData.map((domain, index) => {
            const results = this.domainStatus.get(domain);
            let statusHtml = '<td class="status-pending">未检查</td>';
            
            if (results) {
                statusHtml = `<td>${Object.entries(results)
                    .map(([tld, result]) => {
                        const status = result.error ? 'error' :
                            result.available ? 'available' : 'taken';
                        
                        return `
                            <div class="domain-status">
                                <span class="tld-tag ${status}">${tld}</span>
                            </div>
                        `;
                    })
                    .join('')}</td>`;
            }

            // 获取所有选中的后缀，保持原始顺序
            const selectedTlds = Array.from(this.elements.tldOptions)
                .filter(opt => opt.checked)
                .map(opt => opt.value);

            // 添加隐藏类
            const isHidden = this.hideInvalid && !this.isDomainValid(domain);
            const hiddenClass = isHidden ? 'domain-row-hidden' : '';

            return `
                <tr class="${hiddenClass}">
                    <td>${start + index + 1}</td>
                    <td>${domain}</td>
                    ${statusHtml}
                </tr>
            `;
        }).join('');

        this.elements.totalPages.textContent = totalPages;
        this.elements.currentPage.textContent = this.currentPage;
        this.elements.prevPage.disabled = this.currentPage <= 1;
        this.elements.nextPage.disabled = this.currentPage >= totalPages;

        this.elements.generatedCount.textContent = this.domains.length;
    }

    nextPage() {
        const totalPages = Math.ceil(this.domains.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateDisplay();
            console.log('切到下一页:', this.currentPage);
        }
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateDisplay();
            console.log('切换到上一页:', this.currentPage);
        }
    }

    clearResults() {
        this.domains = [];
        this.currentPage = 1;
        this.lastDomain = '';
        this.domainStatus.clear();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.updateDisplay();
    }

    exportResults() {
        const header = `# 域名生成结果\n# 生成时间: ${new Date().toLocaleString()}\n# 总数: ${this.domains.length}\n\n`;
        const content = this.domains.join('\n');
        const blob = new Blob([header + content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `domains-${this.domains.length}-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async checkDomains() {
        if (this.isChecking) return;
        
        this.isChecking = true;
        const checkBtn = document.getElementById('checkBtn');
        checkBtn.disabled = true;
        checkBtn.textContent = '验证中...';

        // 显示进度条
        const progressDiv = document.querySelector('.check-progress');
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const checkedCount = document.getElementById('checkedCount');
        const totalToCheck = document.getElementById('totalToCheck');
        
        progressDiv.style.display = 'block';
        progressBar.style.width = '0%';
        
        const total = this.domains.length * this.selectedTlds.size;
        let checked = 0;
        
        totalToCheck.textContent = total;
        checkedCount.textContent = checked;

        const updateProgress = () => {
            checked++;
            const percentage = ((checked / total) * 100).toFixed(1);
            progressBar.style.width = percentage + '%';
            progressPercent.textContent = percentage;
            checkedCount.textContent = checked;
        };

        try {
            await this.checkBatch(this.domains, updateProgress);
        } catch (error) {
            console.error('检查域名时出错:', error);
        } finally {
            this.isChecking = false;
            checkBtn.disabled = false;
            checkBtn.textContent = '验证域名';
            
            // 3秒后隐藏进度条
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 3000);
        }
    }

    async checkBatch(domains, updateProgress) {
        for (let i = 0; i < domains.length;) {
            const batchSize = parseInt(document.getElementById('batchSize').value) || 50;
            const delay = parseInt(document.getElementById('batchDelay').value) || 200;
            const tldDelay = parseInt(document.getElementById('tldDelay').value) || 50;

            const batch = domains.slice(i, i + batchSize);
            const promises = batch.map(async domain => {
                const results = {};
                const tldPromises = Array.from(this.selectedTlds).map(async (tld, index) => {
                    await new Promise(resolve => setTimeout(resolve, index * tldDelay));
                    try {
                        results[tld] = await this.checkDomain(domain + tld);
                        if (updateProgress) {
                            updateProgress();
                        }
                    } catch (error) {
                        results[tld] = { error: error.message };
                        if (updateProgress) {
                            updateProgress();
                        }
                    }
                });
                
                await Promise.all(tldPromises);
                this.updateDomainStatus(domain, results);
            });

            await Promise.all(promises);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            i += batchSize;
        }
    }

    async checkDomain(domain) {
        if (this.checkCache.has(domain)) {
            return this.checkCache.get(domain);
        }

        try {
            const response = await fetch(`https://dns.google/resolve?name=${domain}`, {
                headers: {
                    'Accept': 'application/dns-json'
                }
            });

            if (!response.ok) {
                throw new Error('DNS查询失败');
            }

            const data = await response.json();
            const result = {
                available: data.Status === 3,
                status: data.Status === 3 ? '可能可注册' : '可能已注册',
                method: 'DNS'
            };

            this.checkCache.set(domain, result);
            return result;
        } catch (error) {
            console.error('域名检查错误:', error);
            throw new Error('检查失败');
        }
    }

    updateDomainStatus(domain, results) {
        this.domainStatus.set(domain, results);

        const row = Array.from(this.elements.resultBody.children)
            .find(row => row.children[1].textContent === domain);
        
        if (row) {
            const statusCell = row.children[2];
            
            // 获取所有选中的后缀，保持原始顺序
            const selectedTlds = Array.from(this.elements.tldOptions)
                .filter(opt => opt.checked)
                .map(opt => opt.value);

            // 按照选中的后缀顺序示结果
            statusCell.innerHTML = selectedTlds
                .map(tld => {
                    const result = results[tld];
                    if (!result) return ''; // 如果没有该后缀的结果，跳过

                    const status = result.error ? 'error' :
                        result.available ? 'available' : 'taken';
                    
                    return `
                        <div class="domain-status">
                            <span class="tld-tag ${status}">${tld}</span>
                        </div>
                    `;
                })
                .filter(html => html) // 移除空字符串
                .join('');
        }
    }

    calculateDaysUntilExpiry(expiryDate) {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getExpiryClass(days) {
        if (days <= 30) return 'expiry-critical';
        if (days <= 90) return 'expiry-warning';
        return 'expiry-notice';
    }

    updateSelectedTlds() {
        this.selectedTlds = new Set(
            Array.from(this.elements.tldOptions)
                .filter(opt => opt.checked)
                .map(opt => opt.value)
        );
    }

    toggleAllTlds(select) {
        this.elements.tldOptions.forEach(opt => opt.checked = select);
        this.updateSelectedTlds();
    }

    exportAvailableDomains() {
        const availableDomains = [];
        
        this.domainStatus.forEach((results, domain) => {
            const availableTlds = Object.entries(results)
                .filter(([tld, result]) => result.available)
                .map(([tld]) => tld);
            
            if (availableTlds.length > 0) {
                availableDomains.push({
                    domain,
                    availableTlds,
                    checkTime: new Date().toLocaleString()
                });
            }
        });

        if (availableDomains.length === 0) {
            alert('没有找到可注册的域名');
            return;
        }

        const header = `# 可注册域名列表\n# 导出时间: ${new Date().toLocaleString()}\n# 总数: ${availableDomains.length}\n\n`;
        const content = availableDomains.map(item => 
            `${item.domain} (可注册后缀: ${item.availableTlds.join(', ')})`
        ).join('\n');

        const blob = new Blob([header + content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `available-domains-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    addCustomWordConstraint() {
        const word = this.elements.customWord.value.trim().toLowerCase();
        
        // 验证输入
        if (!word) {
            alert('请输入字母组合');
            return;
        }
        if (!/^[a-z]+$/.test(word)) {
            alert('只能包含小写字母');
            return;
        }

        // 创建新的约束项
        const item = document.createElement('div');
        item.className = 'custom-word-item';
        item.innerHTML = `
            <label>
                <input type="checkbox" name="word" value="${word}" checked>
                "${word}"
            </label>
            <span class="remove-word" title="删除">&times;</span>
        `;

        // 添加删除事件
        item.querySelector('.remove-word').addEventListener('click', () => {
            item.remove();
        });

        // 添加到列表
        this.elements.customWordList.appendChild(item);
        this.elements.customWord.value = '';
    }

    // 判断域名是否有效（至少有一个后缀可注册）
    isDomainValid(domain) {
        const results = this.domainStatus.get(domain);
        if (!results) return true; // 未检查的域名显示

        // 检查是否所有后缀都已验证且都不可注册
        const allChecked = Object.values(results).every(result => !result.error);
        const allTaken = Object.values(results).every(result => !result.error && !result.available);
        
        return !allChecked || !allTaken;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DomainGenerator();
}); 