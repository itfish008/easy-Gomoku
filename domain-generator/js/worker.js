// 生成状态
let isGenerating = false;
let isPaused = false;

// 接收消息
self.onmessage = function(e) {
    const { type, data } = e.data;

    switch (type) {
        case 'start':
            startGeneration(data);
            break;
        case 'pause':
            isPaused = true;
            break;
        case 'resume':
            isPaused = false;
            generateNext();
            break;
        case 'stop':
            isGenerating = false;
            isPaused = false;
            break;
    }
};

// 开始生成
function startGeneration(config) {
    isGenerating = true;
    isPaused = false;
    
    // 初始化生成器
    const generator = createGenerator(config);
    generateNext(generator);
}

// 创建生成器
function* createGenerator(config) {
    const { minLength, maxLength, charset, wordConstraints = [] } = config;
    const chars = charset.split('');

    // 对每个长度进行生成
    for (let len = minLength; len <= maxLength; len++) {
        // 如果有字母组合约束，检查长度是否足够
        const maxWordLength = Math.max(...wordConstraints.map(word => word.length), 0);
        if (wordConstraints.length > 0 && len < maxWordLength) {
            continue; // 跳过长度不足的情况
        }

        const indices = new Array(len).fill(0);
        
        while (true) {
            // 生成当前组合
            const domain = indices.map(i => chars[i]).join('');
            
            // 验证域名是否有效
            if (isValidDomain(domain, wordConstraints)) {
                yield domain;
            }

            // 计算下一个组合
            let pos = len - 1;
            while (pos >= 0) {
                indices[pos]++;
                if (indices[pos] < chars.length) {
                    break;
                }
                indices[pos] = 0;
                pos--;
            }
            
            // 所有组合都已生成
            if (pos < 0) break;
        }
    }
}

// 生成下一批域名
function generateNext(generator) {
    const batchSize = 1000; // 每批处理的数量
    let count = 0;

    while (isGenerating && !isPaused && count < batchSize) {
        const { value: domain, done } = generator.next();
        
        if (done) {
            isGenerating = false;
            self.postMessage({ type: 'complete' });
            break;
        }

        // 发送生成的域名
        self.postMessage({ 
            type: 'domain', 
            data: domain 
        });

        count++;
    }

    // 如果还有更多域名要生成，安排下一批
    if (isGenerating && !isPaused) {
        setTimeout(() => generateNext(generator), 0);
    }
}

// 验证域名是否有效
function isValidDomain(domain, wordConstraints) {
    // 基本规则验证
    if (domain.startsWith('-') || domain.endsWith('-')) {
        return false;
    }
    if (domain.includes('--')) {
        return false;
    }

    // 如果没有字母组合约束，只进行基本验证
    if (!wordConstraints || wordConstraints.length === 0) {
        return true;
    }

    // 修改这里：只要包含任意一个字母组合即可
    return wordConstraints.some(word => domain.includes(word));
} 