// 模拟数据库存储
let notes = [];
let nextId = 1;
let currentUser = null;

// AI 对话相关变量
let aiChatHistory = [];
let aiAgentConfig = {
    // 这里是您阿里云智能体的相关配置
    endpoint: '',
    apiKey: '',
    agentId: '',
    enabled: false
};

// 检查用户是否已登录
function checkLogin() {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html';
        return false;
    }
    
    currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// 退出登录功能
function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// 从localStorage加载数据
function loadFromStorage() {
    try {
        // 为每个用户加载独立的笔记数据
        const storedNotes = localStorage.getItem(`notes_${currentUser}`);
        const storedNextId = localStorage.getItem(`nextId_${currentUser}`);
        
        if (storedNotes) {
            notes = JSON.parse(storedNotes);
        } else {
            notes = [];
        }
        
        if (storedNextId) {
            nextId = parseInt(storedNextId);
        } else {
            nextId = 1;
        }
        
        // 加载AI聊天记录
        const storedAiChatHistory = localStorage.getItem(`aiChatHistory_${currentUser}`);
        if (storedAiChatHistory) {
            aiChatHistory = JSON.parse(storedAiChatHistory);
        } else {
            aiChatHistory = [];
        }
        
        // 加载AI配置
        const storedAiConfig = localStorage.getItem(`aiConfig_${currentUser}`);
        if (storedAiConfig) {
            aiAgentConfig = {...aiAgentConfig, ...JSON.parse(storedAiConfig)};
        }
    } catch (error) {
        console.error('从localStorage加载数据时出错:', error);
        notes = [];
        nextId = 1;
        aiChatHistory = [];
    }
}

// 保存AI聊天记录到localStorage
function saveAiChatHistory() {
    try {
        localStorage.setItem(`aiChatHistory_${currentUser}`, JSON.stringify(aiChatHistory));
    } catch (error) {
        console.error('保存AI聊天记录时出错:', error);
    }
}

// 保存AI配置到localStorage
function saveAiConfig() {
    try {
        localStorage.setItem(`aiConfig_${currentUser}`, JSON.stringify(aiAgentConfig));
    } catch (error) {
        console.error('保存AI配置时出错:', error);
    }
}

// DOM元素
const noteForm = document.getElementById('note-form');
const notesContainer = document.getElementById('notes-container');
const searchForm = document.getElementById('search-form');
const formTitle = document.getElementById('form-title');
const cancelButton = document.getElementById('cancel-button');
const clearSearchButton = document.getElementById('clear-search');
const newNoteButton = document.getElementById('new-note-button');
const noteFormSection = document.getElementById('note-form-section');
const logoutButton = document.getElementById('logout-button');

// AI 对话DOM元素
const aiToggleButton = document.getElementById('ai-toggle-button');
const aiChatContainer = document.getElementById('ai-chat-container');
const aiChatMessages = document.getElementById('ai-chat-messages');
const aiChatInput = document.getElementById('ai-chat-input');
const sendAiMessageButton = document.getElementById('send-ai-message');
const clearAiHistoryButton = document.getElementById('clear-ai-history');
const closeAiChatButton = document.getElementById('close-ai-chat');
const aiConfigButton = document.getElementById('ai-config-button');

// AI 配置模态框元素
const aiConfigModal = document.getElementById('ai-config-modal');
const closeConfigModal = document.getElementById('close-config-modal');
const aiConfigForm = document.getElementById('ai-config-form');
const aiEndpointInput = document.getElementById('ai-endpoint');
const aiApiKeyInput = document.getElementById('ai-api-key');
const aiAgentIdInput = document.getElementById('ai-agent-id');
const aiEnableCheckbox = document.getElementById('ai-enable-checkbox');
const cancelConfigButton = document.getElementById('cancel-config');

// 表单字段
const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    if (!checkLogin()) {
        return;
    }
    
    loadFromStorage();
    renderNotes(notes);
    setupEventListeners();
    initializeAiChat();
    
    // 显示当前用户
    const header = document.querySelector('header h1');
    header.textContent = `读书笔记系统 - ${currentUser}`;
});

// 设置事件监听器
function setupEventListeners() {
    // 笔记表单提交
    noteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveNote();
    });

    // 取消编辑
    cancelButton.addEventListener('click', function() {
        noteFormSection.style.display = 'none';
        resetForm();
    });

    // 新建笔记按钮
    newNoteButton.addEventListener('click', function() {
        resetForm();
        noteFormSection.style.display = 'block';
        noteTitleInput.focus();
    });

    // 退出登录按钮
    logoutButton.addEventListener('click', function() {
        logout();
    });

    // 搜索表单提交
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        searchNotes();
    });

    // 清空搜索
    clearSearchButton.addEventListener('click', function() {
        document.getElementById('search-title').value = '';
        document.getElementById('search-content').value = '';
        renderNotes(notes);
    });
    
    // AI 对话事件监听器
    aiToggleButton.addEventListener('click', toggleAiChatWindow);
    sendAiMessageButton.addEventListener('click', sendAiMessage);
    aiChatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAiMessage();
        }
    });
    clearAiHistoryButton.addEventListener('click', clearAiHistory);
    closeAiChatButton.addEventListener('click', hideAiChatWindow);
    aiConfigButton.addEventListener('click', showAiConfigModal);
    
    // AI 配置模态框事件监听器
    closeConfigModal.addEventListener('click', hideAiConfigModal);
    cancelConfigButton.addEventListener('click', hideAiConfigModal);
    window.addEventListener('click', function(e) {
        if (e.target === aiConfigModal) {
            hideAiConfigModal();
        }
    });
    
    // AI 配置表单提交
    aiConfigForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveAiConfigSettings();
    });
}

// 初始化AI对话功能
function initializeAiChat() {
    renderAiChatHistory();
    updateAiConfigForm();
}

// 切换AI对话窗口显示/隐藏
function toggleAiChatWindow() {
    if (aiChatContainer.style.display === 'none') {
        showAiChatWindow();
    } else {
        hideAiChatWindow();
    }
}

// 显示AI对话窗口
function showAiChatWindow() {
    aiChatContainer.style.display = 'flex';
    aiToggleButton.textContent = '隐藏AI助手';
}

// 隐藏AI对话窗口
function hideAiChatWindow() {
    aiChatContainer.style.display = 'none';
    aiToggleButton.textContent = 'AI助手';
}

// 显示AI配置模态框
function showAiConfigModal() {
    updateAiConfigForm();
    aiConfigModal.style.display = 'flex';
}

// 隐藏AI配置模态框
function hideAiConfigModal() {
    aiConfigModal.style.display = 'none';
}

// 更新AI配置表单
function updateAiConfigForm() {
    aiEndpointInput.value = aiAgentConfig.endpoint;
    aiApiKeyInput.value = aiAgentConfig.apiKey;
    aiAgentIdInput.value = aiAgentConfig.agentId;
    aiEnableCheckbox.checked = aiAgentConfig.enabled;
}

// 保存AI配置设置
function saveAiConfigSettings() {
    aiAgentConfig.endpoint = aiEndpointInput.value.trim();
    aiAgentConfig.apiKey = aiApiKeyInput.value.trim();
    aiAgentConfig.agentId = aiAgentIdInput.value.trim();
    aiAgentConfig.enabled = aiEnableCheckbox.checked;
    
    saveAiConfig();
    hideAiConfigModal();
    
    // 如果启用了AI助手，则显示欢迎消息
    if (aiAgentConfig.enabled) {
        addToAiChatHistory('ai', 'AI助手已启用！现在您可以开始与我对话了。您可以询问关于您的笔记的问题，或者让我帮您总结笔记内容。');
        renderAiChatHistory();
    }
}

// 发送消息给AI
function sendAiMessage() {
    const message = aiChatInput.value.trim();
    if (!message) return;
    
    // 检查是否已启用AI助手
    if (!aiAgentConfig.enabled) {
        addToAiChatHistory('ai', '请先在配置中启用AI助手功能。');
        renderAiChatHistory();
        aiChatInput.value = '';
        return;
    }
    
    // 添加用户消息到历史记录
    addToAiChatHistory('user', message);
    
    // 清空输入框
    aiChatInput.value = '';
    
    // 显示用户消息
    renderAiChatHistory();
    
    // 调用AI服务
    if (aiAgentConfig.endpoint && aiAgentConfig.apiKey) {
        callAliyunAgentApi(message);
    } else {
        // 模拟AI回复（当没有配置API时）
        simulateAiResponse(message);
    }
}

// 模拟AI回复（实际使用时需要替换为真实API调用）
function simulateAiResponse(userMessage) {
    // 显示"正在输入"指示器
    showAiTypingIndicator();
    
    // 模拟网络延迟
    setTimeout(() => {
        // 移除"正在输入"指示器
        removeAiTypingIndicator();
        
        // 根据用户消息生成模拟回复
        let response = '';
        if (userMessage.includes('总结') || userMessage.includes('总结笔记')) {
            if (notes.length > 0) {
                response = `我已经分析了您的${notes.length}条笔记。主要内容包括：`;
                notes.slice(0, 3).forEach((note, index) => {
                    response += `\n${index+1}. "${note.title}" - ${note.content.substring(0, 50)}...`;
                });
                if (notes.length > 3) {
                    response += `\n...还有${notes.length - 3}条笔记。`;
                }
            } else {
                response = '您还没有创建任何笔记，请先添加一些笔记内容。';
            }
        } else if (userMessage.includes('你好') || userMessage.includes('Hello')) {
            response = '您好！我是您的AI助手，我可以帮您总结笔记、回答问题等。请问有什么可以帮助您的吗？';
        } else if (userMessage.includes('帮助') || userMessage.includes('help')) {
            response = '我可以帮您做以下事情：\n1. 总结您的读书笔记\n2. 回答关于笔记内容的问题\n3. 提供学习建议\n请告诉我您需要什么帮助？';
        } else {
            // 默认回复
            const responses = [
                '这是一个很好的问题！让我来帮您分析一下。',
                '感谢您的提问，我会尽力为您提供帮助。',
                '基于您的笔记内容，我可以为您提供更深入的见解。',
                '这个问题涉及到了重要的知识点，让我详细为您解答。'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        }
        
        // 添加AI回复到历史记录
        addToAiChatHistory('ai', response);
        
        // 显示AI回复
        renderAiChatHistory();
    }, 1000);
}

// 调用阿里云智能体API的真实函数
async function callAliyunAgentApi(userMessage) {
    // 显示"正在输入"指示器
    showAiTypingIndicator();
    
    try {
        // 检查配置
        if (!aiAgentConfig.endpoint) {
            throw new Error('未配置API地址');
        }
        
        if (!aiAgentConfig.apiKey) {
            throw new Error('未配置API密钥');
        }
        
        // 构造请求数据
        const requestData = {
            agentId: aiAgentConfig.agentId || undefined,
            sessionId: `session_${currentUser}_${Date.now()}`,
            messages: [
                {
                    role: "user",
                    content: `用户${currentUser}的笔记内容如下：\n${getNotesSummary()}\n\n用户的问题：${userMessage}`
                }
            ],
            stream: false
        };
        
        // 记录请求信息用于调试
        console.log('发起AI请求:', {
            url: aiAgentConfig.endpoint,
            requestData: requestData,
            timestamp: new Date().toISOString()
        });
        
        // 发起API请求
        const response = await fetch(aiAgentConfig.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiAgentConfig.apiKey}`,
                'X-DashScope-SSE': 'enable'
            },
            body: JSON.stringify(requestData)
        });
        
        // 记录响应状态用于调试
        console.log('收到AI响应:', {
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
        });
        
        // 处理响应
        if (response.ok) {
            const data = await response.json();
            console.log('解析的响应数据:', data);
            
            const aiResponse = data.output.text || data.output.choices?.[0]?.message?.content || "抱歉，我没有理解您的问题。";
            
            // 添加AI回复到历史记录
            addToAiChatHistory('ai', aiResponse);
        } else {
            const errorText = await response.text();
            throw new Error(`API请求失败: ${response.status} - ${response.statusText}. 错误详情: ${errorText}`);
        }
    } catch (error) {
        console.error('调用阿里云智能体API时出错:', error);
        
        // 提供更详细的错误信息
        let errorMessage = '抱歉，我现在无法回答您的问题。';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += '\n这可能是由于网络连接问题或CORS策略限制导致的。请检查：\n';
            errorMessage += '1. 您的网络连接是否正常\n';
            errorMessage += '2. API地址是否正确\n';
            errorMessage += '3. 如果在本地文件系统中运行，请使用本地服务器运行此应用\n';
            errorMessage += '4. 确保您已在阿里云百炼平台正确配置了应用';
        } else {
            errorMessage += `\n错误信息：${error.message}`;
        }
        
        addToAiChatHistory('ai', errorMessage);
    } finally {
        // 移除"正在输入"指示器并更新UI
        removeAiTypingIndicator();
        renderAiChatHistory();
    }
}

// 获取笔记摘要
function getNotesSummary() {
    if (notes.length === 0) {
        return '用户还没有创建任何笔记。';
    }
    
    let summary = `用户共有${notes.length}条笔记：\n`;
    notes.forEach(note => {
        summary += `- 标题: ${note.title}\n  内容: ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}\n`;
    });
    
    return summary;
}

// 添加消息到AI聊天历史记录
function addToAiChatHistory(role, content) {
    aiChatHistory.push({
        role: role,
        content: content,
        timestamp: new Date().toLocaleTimeString()
    });
    
    // 限制历史记录数量，只保留最近50条消息
    if (aiChatHistory.length > 50) {
        aiChatHistory = aiChatHistory.slice(-50);
    }
    
    // 保存到localStorage
    saveAiChatHistory();
}

// 渲染AI聊天历史记录
function renderAiChatHistory() {
    aiChatMessages.innerHTML = '';
    
    aiChatHistory.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add(`${msg.role}-message`, 'ai-message');
        messageElement.innerHTML = `<p>${msg.content}</p>`;
        aiChatMessages.appendChild(messageElement);
    });
    
    // 滚动到底部
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

// 清空AI聊天历史记录
function clearAiHistory() {
    if (confirm('确定要清空AI聊天记录吗？')) {
        aiChatHistory = [];
        saveAiChatHistory();
        renderAiChatHistory();
    }
}

// 显示AI"正在输入"指示器
function showAiTypingIndicator() {
    const typingElement = document.createElement('div');
    typingElement.id = 'ai-typing-indicator';
    typingElement.classList.add('ai-message');
    typingElement.innerHTML = '<p>AI正在输入中...</p>';
    aiChatMessages.appendChild(typingElement);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

// 移除AI"正在输入"指示器
function removeAiTypingIndicator() {
    const typingElement = document.getElementById('ai-typing-indicator');
    if (typingElement) {
        typingElement.remove();
    }
}

// 切换AI对话窗口显示/隐藏
function toggleAiChat() {
    const isMinimized = aiChatContainer.classList.contains('minimized');
    if (isMinimized) {
        aiChatContainer.classList.remove('minimized');
        toggleAiChatButton.textContent = '隐藏';
    } else {
        aiChatContainer.classList.add('minimized');
        toggleAiChatButton.textContent = '显示';
    }
}

// 保存笔记（创建或更新）
function saveNote() {
    const id = noteIdInput.value;
    const title = noteTitleInput.value;
    const content = noteContentInput.value;
    const now = new Date().toLocaleString();

    if (id) {
        // 更新现有笔记
        const index = notes.findIndex(note => note.id == id);
        if (index !== -1) {
            notes[index].title = title;
            notes[index].content = content;
            notes[index].updatedAt = now;
        }
    } else {
        // 创建新笔记
        const newNote = {
            id: nextId++,
            title: title,
            content: content,
            createdAt: now,
            updatedAt: now
        };
        notes.unshift(newNote);
    }

    // 保存到localStorage
    saveToStorage();

    // 重置表单并重新渲染
    resetForm();
    noteFormSection.style.display = 'none';
    renderNotes(notes);
}

// 删除笔记
function deleteNote(id) {
    if (confirm('确定要删除这条笔记吗？')) {
        notes = notes.filter(note => note.id != id);
        saveToStorage();
        renderNotes(notes);
    }
}

// 编辑笔记 - 行内编辑
function editNoteInline(id) {
    const note = notes.find(note => note.id == id);
    if (note) {
        // 找到对应的表格行
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.innerHTML = `
                <td data-label="笔记ID">${note.id}</td>
                <td data-label="笔记标题">
                    <input type="text" value="${note.title}" class="inline-edit-input" id="edit-title-${id}">
                </td>
                <td data-label="笔记内容">
                    <textarea class="inline-edit-textarea" id="edit-content-${id}">${note.content}</textarea>
                </td>
                <td data-label="创建时间">${note.createdAt}</td>
                <td data-label="修改时间">${note.updatedAt}</td>
                <td data-label="操作" class="actions">
                    <button class="save-button" onclick="saveNoteInline(${id})">保存</button>
                    <button class="cancel-button" onclick="renderNotes(notes)">取消</button>
                </td>
            `;
        }
    }
}

// 保存行内编辑的笔记
function saveNoteInline(id) {
    const title = document.getElementById(`edit-title-${id}`).value;
    const content = document.getElementById(`edit-content-${id}`).value;
    const now = new Date().toLocaleString();
    
    const index = notes.findIndex(note => note.id == id);
    if (index !== -1) {
        notes[index].title = title;
        notes[index].content = content;
        notes[index].updatedAt = now;
        
        // 保存到localStorage
        saveToStorage();
        
        // 重新渲染笔记列表
        renderNotes(notes);
    }
}

// 编辑笔记 - 表单编辑
function editNote(id) {
    const note = notes.find(note => note.id == id);
    if (note) {
        noteIdInput.value = note.id;
        noteTitleInput.value = note.title;
        noteContentInput.value = note.content;
        formTitle.textContent = '编辑笔记';
        noteFormSection.style.display = 'block';
        noteTitleInput.focus();
    }
}

// 重置表单
function resetForm() {
    noteForm.reset();
    noteIdInput.value = '';
    formTitle.textContent = '添加新笔记';
}

// 搜索笔记
function searchNotes() {
    const title = document.getElementById('search-title').value.toLowerCase();
    const content = document.getElementById('search-content').value.toLowerCase();

    const filteredNotes = notes.filter(note => {
        return (
            note.title.toLowerCase().includes(title) &&
            note.content.toLowerCase().includes(content)
        );
    });

    renderNotes(filteredNotes);
}

// 渲染笔记列表为表格形式
function renderNotes(notesToRender) {
    if (notesToRender.length === 0) {
        notesContainer.innerHTML = '<p class="no-notes">没有找到笔记。</p>';
        return;
    }

    let tableHTML = `
        <table class="notes-table">
            <thead>
                <tr>
                    <th>笔记ID</th>
                    <th>笔记标题</th>
                    <th>笔记内容</th>
                    <th>创建时间</th>
                    <th>修改时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
    `;

    notesToRender.forEach(note => {
        tableHTML += `
            <tr data-id="${note.id}">
                <td data-label="笔记ID">${note.id}</td>
                <td data-label="笔记标题">${note.title}</td>
                <td data-label="笔记内容" class="note-content">${note.content}</td>
                <td data-label="创建时间">${note.createdAt}</td>
                <td data-label="修改时间">${note.updatedAt}</td>
                <td data-label="操作" class="actions">
                    <button class="edit-button" onclick="editNote(${note.id})">编辑</button>
                    <button class="delete-button" onclick="deleteNote(${note.id})">删除</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    notesContainer.innerHTML = tableHTML;
}

// 保存到localStorage
function saveToStorage() {
    try {
        // 为每个用户保存独立的笔记数据
        localStorage.setItem(`notes_${currentUser}`, JSON.stringify(notes));
        localStorage.setItem(`nextId_${currentUser}`, nextId.toString());
    } catch (error) {
        console.error('保存到localStorage时出错:', error);
        alert('保存笔记失败：' + error.message);
    }
}

// 页面加载时也渲染笔记
window.addEventListener('load', function() {
    // 检查登录状态
    if (!checkLogin()) {
        return;
    }
    
    loadFromStorage();
    renderNotes(notes);
});