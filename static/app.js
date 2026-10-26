async function loadMessages() {
    const r = await fetch('/api/messages');
    const xs = await r.json();

    document.querySelector('#messages').innerHTML = xs.map(x => {
        const time = new Date(x.created_at).toLocaleString('ja-JP', {
            timeZone: 'Asia/Tokyo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // すでにこのブラウザで「いいね済み」か判定
        const likedKey = `liked_${x.id}`;
        const isLiked = localStorage.getItem(likedKey);

        return `
            <article class="message">
                <button type="button"
                    class="delete-button"
                    onclick="deleteMessage(${x.id})"
                    title="投稿を削除"
                    aria-label="投稿を削除">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 6h18M9 6V4h6v2m4 0-1 14H6L5 6m4 4v7m6-7v7"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"/>
                    </svg>
                </button>

                <b>${escapeHtml(x.name)}</b>
                <p>${escapeHtml(x.message)}</p>

                <div class="meta">
                    #${x.id} | ${time}
                    <button type="button" 
                        onclick="likeMessage(${x.id})" 
                        class="like-button" 
                        id="like-btn-${x.id}"
                        style="margin-left: 10px; background: none; border: none; cursor: ${isLiked ? 'default' : 'pointer'}; color: ${isLiked ? '#999' : '#e25555'};"
                        ${isLiked ? 'disabled' : ''}>
                        ❤️ いいね <span id="likes-${x.id}">${x.likes !== undefined ? x.likes : 0}</span>
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// いいねを送信する関数（1回押したらブラウザに記録してグレーアウト）
async function likeMessage(id) {
    const likedKey = `liked_${id}`;
    if (localStorage.getItem(likedKey)) {
        return;
    }

    const r = await fetch(`/api/messages/${id}/like`, {
        method: 'POST'
    });

    if (r.ok) {
        localStorage.setItem(likedKey, 'true');
        await loadMessages();
    } else {
        alert('いいねに失敗しました');
    }
}

async function deleteMessage(id) {
    if (!confirm('この投稿を削除しますか？')) {
        return;
    }

    const r = await fetch(`/api/messages/${id}`, {
        method: 'DELETE'
    });

    if (r.ok) {
        document.querySelector('#status').textContent = '削除しました';
        await loadMessages();
    } else {
        document.querySelector('#status').textContent = '削除に失敗しました';
    }
}

document.querySelector('#form').addEventListener('submit', async e => {
    e.preventDefault();

    const name = document.querySelector('#name').value;
    const message = document.querySelector('#message').value;

    const r = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message })
    });

    document.querySelector('#status').textContent =
        r.ok ? '投稿しました' : '投稿に失敗しました';

    if (r.ok) {
        document.querySelector('#message').value = '';
        await loadMessages();
    }
});

loadMessages();