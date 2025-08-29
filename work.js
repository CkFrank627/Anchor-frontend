document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const worksListContainer = document.getElementById('worksList');
    const newWorkBtn = document.getElementById('newWorkBtn');
    const deleteWorkBtn = document.getElementById('deleteWorkBtn');
    const saveBtn = document.getElementById('saveBtn');
    const titleInput = document.getElementById('workTitle');
    const contentInput = document.getElementById('workContent');

    const API_BASE_URL = 'https://lit-stream-78819-b3e5745b1632.herokuapp.com/api/works';
    let currentWorkId = null;

    const token = localStorage.getItem('token');
    if (!token) {
        alert('您尚未登录，请先登录！');
        window.location.href = 'login.html';
    } else {
        fetchUserProfile(token);
        fetchWorks(token);
    }

    async function fetchUserProfile(token) {
        try {
            const response = await fetch('https://lit-stream-78819-b3e5745b1632.herokuapp.com/api/users/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (!response.ok) {
                throw new Error('获取个人资料失败');
            }

            const data = await response.json();
            if (data.user) {
                welcomeMessage.textContent = '欢迎来到创作页面，' + data.user.username + '！';
            } else {
                handleAuthError();
            }
        } catch (error) {
            console.error('获取个人资料失败:', error);
            handleAuthError();
        }
    }

    async function fetchWorks(token) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('获取作品列表失败');
            }

            const works = await response.json();
            displayWorks(works);
        } catch (error) {
            console.error('获取作品列表失败:', error);
            alert('获取作品列表失败，请检查网络或重新登录。');
        }
    }

    function displayWorks(works) {
        worksListContainer.innerHTML = '';
        if (works.length === 0) {
            worksListContainer.innerHTML = '<p>暂无作品，快来创建吧！</p>';
            return;
        }

        works.forEach(work => {
            const workElement = document.createElement('div');
            workElement.textContent = work.title || '无标题作品';
            workElement.className = 'work-item';
            workElement.addEventListener('click', () => {
                loadWork(work);
            });
            worksListContainer.appendChild(workElement);
        });
    }

    function loadWork(work) {
        currentWorkId = work._id;
        titleInput.value = work.title || '';
        contentInput.value = work.content || '';
    }

    async function createWork() {
        const title = titleInput.value;
        const content = contentInput.value;
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });

            if (!response.ok) {
                throw new Error('创建作品失败');
            }

            const newWork = await response.json();
            alert('作品创建成功！');
            fetchWorks(token); // 刷新作品列表
            loadWork(newWork); // 加载新创建的作品
        } catch (error) {
            console.error('创建作品失败:', error);
            alert('创建作品失败，请检查网络。');
        }
    }

    async function updateWork(id, content) {
    try {
        // 1. 修正 URL: 不再在 URL 中拼接 id
        const response = await fetch('https://lit-stream-78819-b3e5745b1632.herokuapp.com/api/works', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            // 2. 将作品ID添加到请求体中
            body: JSON.stringify({
                _id: id,
                content: content
            })
        });

        // 3. 在解析 JSON 之前检查响应状态
        if (!response.ok) {
            // 如果响应不成功，尝试解析错误信息，或使用默认错误信息
            const errorText = await response.text();
            console.error('保存作品失败:', errorText);
            try {
                const errorData = JSON.parse(errorText);
                alert('保存作品失败：' + (errorData.message || '未知错误'));
            } catch (jsonError) {
                alert('保存作品失败，请检查网络。');
            }
            return null;
        }

        const data = await response.json();
        // 如果后端返回的是更新后的作品数据，可以在这里处理
        return data; 

    } catch (error) {
        console.error('保存作品失败:', error);
        alert('保存作品失败，请检查网络。');
        return null;
    }
}

    async function deleteWork() {
        if (!currentWorkId) {
            alert('请先选择一个作品！');
            return;
        }

        if (!confirm('确定要删除这个作品吗？')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${currentWorkId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('删除作品失败');
            }

            alert('作品删除成功！');
            currentWorkId = null;
            titleInput.value = '';
            contentInput.value = '';
            fetchWorks(token); // 刷新作品列表
        } catch (error) {
            console.error('删除作品失败:', error);
            alert('删除作品失败，请检查网络。');
        }
    }

    function handleAuthError() {
        alert('登录状态已失效，请重新登录。');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }

    // 事件监听器
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'https://anchorx.ca/login/';
    });

    newWorkBtn.addEventListener('click', () => {
        currentWorkId = null;
        titleInput.value = '';
        contentInput.value = '';
        alert('开始创建新作品！');
    });

    saveBtn.addEventListener('click', () => {
        if (currentWorkId) {
            updateWork();
        } else {
            createWork();
        }
    });

    deleteWorkBtn.addEventListener('click', deleteWork);
});