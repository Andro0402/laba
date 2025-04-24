document.addEventListener('DOMContentLoaded', function () {
    // Объявляем все переменные в начале
    let currentUser = null;
    let postSubmitBtn, postInput, postsContainer;
    let loginBtn, registerBtn, loginModal, registerModal, closeModalBtns;
    let showRegister, showLogin, forgotPassword, loginForm, registerForm;
    let mobileMenuBtn, nav, actionBtns, socialLoginBtns, followBtns, navLinks;
    let userProfile, createEventBtn, createCommunityBtn;

    // Инициализация элементов после загрузки DOM
    function initElements() {
        loginBtn = document.getElementById('login-btn');
        registerBtn = document.getElementById('register-btn');
        loginModal = document.getElementById('login-modal');
        registerModal = document.getElementById('register-modal');
        closeModalBtns = document.querySelectorAll('.close-modal');
        showRegister = document.getElementById('show-register');
        showLogin = document.getElementById('show-login');
        forgotPassword = document.getElementById('forgot-password');
        loginForm = document.getElementById('login-form');
        registerForm = document.getElementById('register-form');
        postSubmitBtn = document.querySelector('.post-submit');
        postInput = document.querySelector('.post-input');
        postsContainer = document.querySelector('.posts');
        mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        nav = document.querySelector('.nav');
        actionBtns = document.querySelectorAll('.action-btn');
        socialLoginBtns = document.querySelectorAll('.social-btn');
        followBtns = document.querySelectorAll('.follow-btn');
        navLinks = document.querySelectorAll('.nav a');
        userProfile = document.querySelector('.user-profile');
        createEventBtn = document.querySelector('.create-event-btn');
        createCommunityBtn = document.querySelector('.create-community-btn');
    }

    // Функция для получения данных пользователя из sessionStorage
    function getUserFromSessionStorage() {
        const userString = sessionStorage.getItem('currentUser');
        return userString ? JSON.parse(userString) : null;
    }

    // Функция для сохранения данных пользователя в sessionStorage
    function saveUserToSessionStorage(user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
    }

    // Функция для удаления данных пользователя из sessionStorage (при выходе)
    function removeUserFromSessionStorage() {
        sessionStorage.removeItem('currentUser');
    }

    // Обработчик выхода из системы
    function handleLogout() {
        fetch('http://localhost:8000/api.php?action=logout', {
            method: 'POST',
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text().then(text => {
                    try {
                        return text ? JSON.parse(text) : {};
                    } catch (e) {
                        return {};
                    }
                });
            })
            .then(data => {
                currentUser = null;
                removeUserFromSessionStorage();
                document.cookie = 'PHPSESSID=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                updateUIAfterLogout();
                window.location.reload();
            })
            .catch(error => {
                console.error('Logout error:', error);
                currentUser = null;
                removeUserFromSessionStorage();
                document.cookie = 'PHPSESSID=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                updateUIAfterLogout();
                window.location.reload();
            });
    }

    // Функция для обновления UI после выхода из системы
    function updateUIAfterLogout() {
        document.querySelector('.auth-buttons').classList.remove('hidden');
        if (userProfile) {
            userProfile.classList.add('hidden');
            const logoutBtn = userProfile.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.remove();
            }
        }
    }

    // Проверка аутентификации при загрузке страницы
    function checkAuthStatus() {
        fetch('http://localhost:8000/api.php?action=check', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    return response.text().then(text => {
                        throw new Error(`Invalid content type. Response: ${text.substring(0, 100)}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.authenticated && data.user) {
                    currentUser = data.user;
                    saveUserToSessionStorage(currentUser);
                    updateUIAfterLogin();
                    loadCommunities();
                    loadEvents();
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    // Показать/скрыть модальные окна
    function toggleModal(modal, show) {
        if (show) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    // Функция для отображения главной страницы
    function showHomePage() {
        const mainContent = document.querySelector('.main .container .main-content .content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="create-post">
                <div class="post-header">
                    <img src="${currentUser?.avatar_url || 'Images/profile.png'}" alt="User" class="user-avatar">
                    <input type="text" placeholder="Поделитесь своими мыслями или новостями..." class="post-input">
                </div>
                <div class="post-actions">
                    <button class="action-btn"><i class="fas fa-image"></i> Фото</button>
                    <button class="action-btn"><i class="fas fa-video"></i> Видео</button>
                    <button class="action-btn"><i class="fas fa-map-marker-alt"></i> Место</button>
                    <button class="post-submit">Опубликовать</button>
                </div>
            </div>
            <div class="posts"></div>
        `;

        // Инициализируем элементы после обновления DOM
        postSubmitBtn = document.querySelector('.post-submit');
        postInput = document.querySelector('.post-input');
        postsContainer = document.querySelector('.posts');
        actionBtns = document.querySelectorAll('.action-btn');

        // Добавляем обработчики
        if (postSubmitBtn) {
            postSubmitBtn.addEventListener('click', () => {
                const content = postInput.value.trim();
                if (content) createPost(content);
            });
        }

        if (actionBtns) {
            actionBtns.forEach(btn => {
                btn.addEventListener('click', handleActionBtnClick);
            });
        }

        loadPosts();
    }

    function handleActionBtnClick(e) {
        e.preventDefault();
        if (!currentUser) {
            toggleModal(loginModal, true);
            return;
        }

        const action = this.querySelector('i').className;

        if (action.includes('fa-image')) {
            alert('Функция добавления фото в разработке');
        } else if (action.includes('fa-video')) {
            alert('Функция добавления видео в разработке');
        } else if (action.includes('fa-map-marker-alt')) {
            alert('Функция добавления места в разработке');
        }
    }

    // Обновление UI после входа
    function updateUIAfterLogin() {
        document.querySelector('.auth-buttons').classList.add('hidden');
        if (userProfile) {
            userProfile.classList.remove('hidden');
            userProfile.querySelector('.username').textContent = currentUser.username;
            userProfile.querySelector('img').src = currentUser.avatar_url || 'Images/profile.png';

            // Удаляем старую кнопку выхода, если она есть
            const oldLogoutBtn = userProfile.querySelector('.logout-btn');
            if (oldLogoutBtn) {
                oldLogoutBtn.remove();
            }

            // Добавляем кнопку выхода
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'logout-btn';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
            logoutBtn.title = 'Выйти';
            userProfile.appendChild(logoutBtn);

            // Обработчик для кнопки выхода
            logoutBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                handleLogout();
            });
        }
    }

    // Создание нового поста
    function createPost(content) {
        if (!currentUser) {
            toggleModal(loginModal, true);
            return;
        }

        fetch('http://localhost:8000/api.php?action=posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadPosts();
                    postInput.value = '';
                } else {
                    throw new Error(data.message || 'Failed to create post');
                }
            })
            .catch(error => {
                console.error('Error creating post:', error);
                alert('Ошибка при создании поста: ' + error.message);
            });
    }

    // Загрузка постов
    function loadPosts() {
        fetch('http://localhost:8000/api.php?action=posts', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderPosts(data.posts);
                } else {
                    throw new Error(data.message || 'Failed to load posts');
                }
            })
            .catch(error => {
                console.error('Error loading posts:', error);
            });
    }

    // Отрисовка постов
    function renderPosts(posts) {
        if (!postsContainer) return;
        postsContainer.innerHTML = '';

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.innerHTML = `
                <div class="post-header">
                    <img src="${post.avatar_url || 'Images/profile.png'}" alt="User" class="user-avatar">
                    <div class="user-info">
                        <span class="username">${post.username}</span>
                        <span class="post-time">${formatPostTime(post.created_at)}</span>
                    </div>
                    <button class="post-options"><i class="fas fa-ellipsis-h"></i></button>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                    ${post.image_url ? `<div class="post-image"><img src="${post.image_url}" alt="Post image"></div>` : ''}
                </div>
                <div class="post-footer">
                    <button class="like-btn"><i class="far fa-thumbs-up"></i> Нравится (${post.likes_count || 0})</button>
                    <button class="comment-btn"><i class="far fa-comment"></i> Комментарии (${post.comments_count || 0})</button>
                    <button class="share-btn"><i class="fas fa-share"></i> Поделиться</button>
                </div>
            `;
            postsContainer.appendChild(postElement);
            addPostInteractions(postElement);
        });
    }

    // Форматирование времени поста
    function formatPostTime(timestamp) {
        const now = new Date();
        const postTime = new Date(timestamp);
        const diff = now - postTime;
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} минут назад`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} часов назад`;

        return postTime.toLocaleDateString();
    }

    // Добавление взаимодействий с постом
    function addPostInteractions(post) {
        const likeBtn = post.querySelector('.like-btn');
        const commentBtn = post.querySelector('.comment-btn');
        const shareBtn = post.querySelector('.share-btn');
        const optionsBtn = post.querySelector('.post-options');

        if (likeBtn) {
            likeBtn.addEventListener('click', function () {
                if (!currentUser) {
                    toggleModal(loginModal, true);
                    return;
                }

                const icon = this.querySelector('i');
                const countText = this.textContent.match(/\((\d+)\)/);
                let count = countText ? parseInt(countText[1]) : 0;

                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas', 'text-primary');
                    count++;
                } else {
                    icon.classList.remove('fas', 'text-primary');
                    icon.classList.add('far');
                    count--;
                }

                this.innerHTML = `<i class="${icon.className}"></i> Нравится (${count})`;
            });
        }

        if (commentBtn) {
            commentBtn.addEventListener('click', function () {
                if (!currentUser) {
                    toggleModal(loginModal, true);
                    return;
                }

                const commentSection = post.querySelector('.comment-section');
                if (commentSection) {
                    commentSection.remove();
                } else {
                    const newCommentSection = document.createElement('div');
                    newCommentSection.className = 'comment-section';
                    newCommentSection.innerHTML = `
                        <div class="write-comment">
                            <img src="${currentUser.avatar_url || 'Images/profile.png'}" alt="User" class="user-avatar">
                            <input type="text" placeholder="Напишите комментарий..." class="comment-input">
                        </div>
                        <div class="comments-list"></div>
                    `;
                    post.querySelector('.post-content').appendChild(newCommentSection);

                    const commentInput = newCommentSection.querySelector('.comment-input');
                    commentInput.addEventListener('keypress', function (e) {
                        if (e.key === 'Enter' && this.value.trim()) {
                            const commentsList = newCommentSection.querySelector('.comments-list');
                            const newComment = document.createElement('div');
                            newComment.className = 'comment';
                            newComment.innerHTML = `
                                <img src="${currentUser.avatar_url || 'Images/profile.png'}" alt="User" class="user-avatar">
                                <div class="comment-content">
                                    <span class="username">${currentUser.username}</span>
                                    <p>${this.value}</p>
                                </div>
                            `;
                            commentsList.prepend(newComment);

                            // Обновляем счетчик комментариев
                            const countText = commentBtn.textContent.match(/\((\d+)\)/);
                            let count = countText ? parseInt(countText[1]) : 0;
                            count++;
                            commentBtn.innerHTML = `<i class="far fa-comment"></i> Комментарии (${count})`;

                            this.value = '';
                        }
                    });
                }
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', function () {
                if (!currentUser) {
                    toggleModal(loginModal, true);
                    return;
                }

                alert('Пост добавлен в ваши закладки');
                const countText = this.textContent.match(/\((\d+)\)/);
                let count = countText ? parseInt(countText[1]) : 0;
                count++;
                this.innerHTML = `<i class="fas fa-share"></i> Поделиться (${count})`;
            });
        }

        if (optionsBtn) {
            optionsBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const oldMenu = document.querySelector('.post-options-menu');
                if (oldMenu) oldMenu.remove();

                const optionsMenu = document.createElement('div');
                optionsMenu.className = 'post-options-menu';
                optionsMenu.innerHTML = `
                    <ul>
                        <li><a href="#" class="save-post"><i class="far fa-bookmark"></i> Сохранить</a></li>
                        <li><a href="#" class="notify-post"><i class="far fa-bell"></i> Включить уведомления</a></li>
                        ${currentUser ? '<li><a href="#" class="delete-post"><i class="far fa-trash-alt"></i> Удалить</a></li>' : ''}
                    </ul>
                `;

                document.body.appendChild(optionsMenu);
                const rect = this.getBoundingClientRect();
                optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
                optionsMenu.style.right = `${window.innerWidth - rect.right}px`;

                optionsMenu.querySelector('.save-post').addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('Пост сохранен в ваши закладки');
                    optionsMenu.remove();
                });

                optionsMenu.querySelector('.notify-post').addEventListener('click', (e) => {
                    e.preventDefault();
                    alert('Уведомления для этого поста включены');
                    optionsMenu.remove();
                });

                if (currentUser) {
                    optionsMenu.querySelector('.delete-post').addEventListener('click', function (e) {
                        e.preventDefault();
                        if (confirm('Вы уверены, что хотите удалить этот пост?')) {
                            post.remove();
                        }
                        optionsMenu.remove();
                    });
                }

                setTimeout(() => {
                    document.addEventListener('click', function closeMenu(e) {
                        if (!optionsMenu.contains(e.target) && e.target !== optionsBtn) {
                            optionsMenu.remove();
                            document.removeEventListener('click', closeMenu);
                        }
                    });
                }, 0);
            });
        }
    }

    // Обработчик навигации
    function handleNavLinkClick(e) {
        e.preventDefault();
        const pageName = this.textContent.trim();

        if (pageName === 'Главная') {
            showHomePage();
            return;
        }

        const mainContent = document.querySelector('.main .container .main-content .content');
        if (!mainContent) return;

        if (pageName === 'Сообщества') {
            showCommunitiesPage();
        } else if (pageName === 'Мероприятия') {
            showEventsPage();
        } else if (pageName === 'Магазин') {
            mainContent.innerHTML = `
                <div class="page-content">
                    <h1>Магазин</h1>
                    <div class="products-grid">
                        ${Array(4).fill().map((_, i) => `
                            <div class="product-card">
                                <h3>Товар ${i + 1}</h3>
                                <p>Цена: ${(i + 1) * 1000} руб.</p>
                                <button class="btn btn-primary buy-product" data-product="${i + 1}">
                                    Купить
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            addPageEventHandlers();
        } else if (pageName === 'О нас') {
            mainContent.innerHTML = `
                <div class="page-content">
                    <h1>О нас</h1>
                    <p>Drive Dynamics - это автомобильное сообщество для энтузиастов.</p>
                    <p>Наша миссия: объединить любителей автомобилей со всей страны.</p>
                    <button class="btn btn-primary contact-us">
                        Связаться с нами
                    </button>
                </div>
            `;
            addPageEventHandlers();
        }
    }

    // Показать страницу сообществ
    function showCommunitiesPage() {
        const mainContent = document.querySelector('.main .container .main-content .content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="page-content">
                <div class="page-header">
                    <h1>Сообщества</h1>
                    ${currentUser ? '<button class="btn btn-primary create-community-btn">Создать сообщество</button>' : ''}
                </div>
                <div class="communities-grid"></div>
            </div>
        `;

        if (currentUser) {
            document.querySelector('.create-community-btn').addEventListener('click', showCreateCommunityModal);
        }

        loadCommunities();
    }

    // Показать страницу мероприятий
    function showEventsPage() {
        const mainContent = document.querySelector('.main .container .main-content .content');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div class="page-content">
                <div class="page-header">
                    <h1>Мероприятия</h1>
                    ${currentUser ? '<button class="btn btn-primary create-event-btn">Создать мероприятие</button>' : ''}
                </div>
                <div class="events-list"></div>
            </div>
        `;

        if (currentUser) {
            document.querySelector('.create-event-btn').addEventListener('click', showCreateEventModal);
        }

        loadEvents();
    }

    // Показать модальное окно создания мероприятия
    function showCreateEventModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <h2>Создать мероприятие</h2>
                <form id="create-event-form">
                    <div class="form-group">
                        <label for="event-title">Название</label>
                        <input type="text" id="event-title" placeholder="Название мероприятия" required>
                    </div>
                    <div class="form-group">
                        <label for="event-description">Описание</label>
                        <textarea id="event-description" placeholder="Описание мероприятия" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="event-date">Дата</label>
                        <input type="datetime-local" id="event-date" required>
                    </div>
                    <div class="form-group">
                        <label for="event-location">Место проведения</label>
                        <input type="text" id="event-location" placeholder="Место проведения">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Создать</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        });

        modal.querySelector('#create-event-form').addEventListener('submit', function (e) {
            e.preventDefault();
            createEvent();
        });
    }

    // Создать мероприятие
    function createEvent() {
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const eventDate = document.getElementById('event-date').value;
        const location = document.getElementById('event-location').value;

        if (!title || !eventDate) {
            alert('Название и дата обязательны для заполнения');
            return;
        }

        fetch('http://localhost:8000/api.php?action=events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                description,
                event_date: eventDate,
                location
            }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.modal').remove();
                    document.body.style.overflow = 'auto';
                    loadEvents();
                    alert('Мероприятие успешно создано!');
                } else {
                    throw new Error(data.message || 'Failed to create event');
                }
            })
            .catch(error => {
                console.error('Error creating event:', error);
                alert('Ошибка при создании мероприятия: ' + error.message);
            });
    }

    // Показать модальное окно создания сообщества
    function showCreateCommunityModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <h2>Создать сообщество</h2>
                <form id="create-community-form">
                    <div class="form-group">
                        <label for="community-name">Название</label>
                        <input type="text" id="community-name" placeholder="Название сообщества" required>
                    </div>
                    <div class="form-group">
                        <label for="community-description">Описание</label>
                        <textarea id="community-description" placeholder="Описание сообщества" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Создать</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = 'auto';
        });

        modal.querySelector('#create-community-form').addEventListener('submit', function (e) {
            e.preventDefault();
            createCommunity();
        });
    }

    // Создать сообщество
    function createCommunity() {
        const name = document.getElementById('community-name').value;
        const description = document.getElementById('community-description').value;

        if (!name) {
            alert('Название обязательно для заполнения');
            return;
        }

        fetch('http://localhost:8000/api.php?action=communities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                description
            }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.modal').remove();
                    document.body.style.overflow = 'auto';
                    loadCommunities();
                    alert('Сообщество успешно создано!');
                } else {
                    throw new Error(data.message || 'Failed to create community');
                }
            })
            .catch(error => {
                console.error('Error creating community:', error);
                alert('Ошибка при создании сообщества: ' + error.message);
            });
    }

    // Загрузить мероприятия
    function loadEvents() {
        fetch('http://localhost:8000/api.php?action=events', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderEvents(data.events);
                    renderUpcomingEvents(data.events);
                } else {
                    throw new Error(data.message || 'Failed to load events');
                }
            })
            .catch(error => {
                console.error('Error loading events:', error);
            });
    }

    // Отрисовать мероприятия
    function renderEvents(events) {
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) return;

        eventsList.innerHTML = '';

        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-card';
            eventElement.innerHTML = `
                <h3>${event.title}</h3>
                <p>${event.description || 'Описание отсутствует'}</p>
                <p><strong>Дата:</strong> ${new Date(event.event_date).toLocaleString()}</p>
                ${event.location ? `<p><strong>Место:</strong> ${event.location}</p>` : ''}
                <div class="event-actions">
                    <button class="btn ${event.is_participating ? 'btn-gray' : 'btn-primary'} join-event" data-event-id="${event.event_id}">
                        ${event.is_participating ? 'Отменить участие' : 'Участвовать'}
                    </button>
                    ${event.creator_id === currentUser?.user_id ?
                    `<button class="btn btn-danger delete-event" data-event-id="${event.event_id}">Удалить</button>` : ''}
                </div>
            `;
            eventsList.appendChild(eventElement);

            const joinBtn = eventElement.querySelector('.join-event');
            joinBtn.addEventListener('click', function () {
                if (!currentUser) {
                    toggleModal(loginModal, true);
                    return;
                }

                const eventId = this.getAttribute('data-event-id');
                const isParticipating = this.textContent.trim() === 'Отменить участие';

                fetch('http://localhost:8000/api.php?action=events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event_id: eventId,
                        action: isParticipating ? 'leave' : 'join'
                    }),
                    credentials: 'include'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            loadEvents();
                        } else {
                            throw new Error(data.message || 'Failed to update participation');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Ошибка: ' + error.message);
                    });
            });

            const deleteBtn = eventElement.querySelector('.delete-event');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function () {
                    if (confirm('Вы уверены, что хотите удалить это мероприятие?')) {
                        const eventId = this.getAttribute('data-event-id');

                        fetch(`http://localhost:8000/api.php?action=events&id=${eventId}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    loadEvents();
                                } else {
                                    throw new Error(data.message || 'Failed to delete event');
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                alert('Ошибка при удалении мероприятия: ' + error.message);
                            });
                    }
                });
            }
        });
    }

    // Отрисовать предстоящие мероприятия в сайдбаре
    function renderUpcomingEvents(events) {
        const upcomingEventsList = document.querySelector('.sidebar-section.events ul');
        if (!upcomingEventsList) return;

        // Фильтруем мероприятия, в которых участвует пользователь
        const userEvents = events.filter(event => event.is_participating);

        if (userEvents.length === 0) {
            upcomingEventsList.innerHTML = '<li>Нет предстоящих мероприятий</li>';
            return;
        }

        upcomingEventsList.innerHTML = userEvents.map(event => `
            <li>
                <span class="event-date">${new Date(event.event_date).toLocaleDateString()}</span>
                <span class="event-title">${event.title}</span>
                <button class="event-action" data-event-id="${event.event_id}">
                    Отменить участие
                </button>
            </li>
        `).join('');

        // Добавляем обработчики для кнопок отмены участия
        document.querySelectorAll('.event-action').forEach(btn => {
            btn.addEventListener('click', function () {
                const eventId = this.getAttribute('data-event-id');

                fetch('http://localhost:8000/api.php?action=events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event_id: eventId,
                        action: 'leave'
                    }),
                    credentials: 'include'
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            loadEvents();
                        } else {
                            throw new Error(data.message || 'Failed to leave event');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Ошибка: ' + error.message);
                    });
            });
        });
    }

    // Загрузить сообщества
    function loadCommunities() {
        fetch('http://localhost:8000/api.php?action=communities', {
            method: 'GET',
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    renderCommunities(data.communities);
                } else {
                    throw new Error(data.message || 'Failed to load communities');
                }
            })
            .catch(error => {
                console.error('Error loading communities:', error);
            });
    }

    // Отрисовать сообщества
    function renderCommunities(communities) {
        const communitiesGrid = document.querySelector('.communities-grid');
        const myCommunitiesList = document.querySelector('.communities-list');

        if (communitiesGrid) {
            communitiesGrid.innerHTML = communities.map(community => `
                <div class="community-card">
                    <h3>${community.name}</h3>
                    <p>${community.description || 'Описание отсутствует'}</p>
                    <div class="community-actions">
                        <button class="btn btn-primary join-community" data-community-id="${community.community_id}">
                            Присоединиться
                        </button>
                        ${community.creator_id === currentUser?.user_id ?
                    `<button class="btn btn-danger delete-community" data-community-id="${community.community_id}">Удалить</button>` : ''}
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.join-community').forEach(btn => {
                btn.addEventListener('click', function () {
                    if (!currentUser) {
                        toggleModal(loginModal, true);
                        return;
                    }

                    const communityId = this.getAttribute('data-community-id');

                    fetch('http://localhost:8000/api.php?action=communities', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            community_id: communityId,
                            action: 'join'
                        }),
                        credentials: 'include'
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                loadCommunities();
                            } else {
                                throw new Error(data.message || 'Failed to join community');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Ошибка: ' + error.message);
                        });
                });
            });

            document.querySelectorAll('.delete-community').forEach(btn => {
                btn.addEventListener('click', function () {
                    if (confirm('Вы уверены, что хотите удалить это сообщество?')) {
                        const communityId = this.getAttribute('data-community-id');

                        fetch(`http://localhost:8000/api.php?action=communities&id=${communityId}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    loadCommunities();
                                } else {
                                    throw new Error(data.message || 'Failed to delete community');
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                alert('Ошибка при удалении сообщества: ' + error.message);
                            });
                    }
                });
            });
        }

        if (myCommunitiesList) {
            myCommunitiesList.innerHTML = communities.map(community => `
                <li>
                    <a href="#" class="community-link" data-community-id="${community.community_id}">
                        <i class="fas fa-car-side"></i> ${community.name}
                    </a>
                    <button class="btn btn-sm btn-danger leave-community" data-community-id="${community.community_id}">
                        <i class="fas fa-times"></i>
                    </button>
                </li>
            `).join('<li><a href="#" class="find-communities"><i class="fas fa-plus"></i> Найти сообщества</a></li>');

            document.querySelectorAll('.leave-community').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const communityId = this.getAttribute('data-community-id');

                    fetch('http://localhost:8000/api.php?action=communities', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            community_id: communityId,
                            action: 'leave'
                        }),
                        credentials: 'include'
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                loadCommunities();
                            } else {
                                throw new Error(data.message || 'Failed to leave community');
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Ошибка: ' + error.message);
                        });
                });
            });

            document.querySelector('.find-communities').addEventListener('click', function (e) {
                e.preventDefault();
                showCommunitiesPage();
            });
        }
    }

    // Добавление обработчиков для страниц
    function addPageEventHandlers() {
        document.querySelectorAll('.buy-product').forEach(btn => {
            btn.addEventListener('click', function () {
                const productId = this.getAttribute('data-product');
                if (confirm(`Вы хотите купить товар ${productId}?`)) {
                    this.textContent = 'Куплено';
                    this.style.backgroundColor = 'var(--gray-color)';
                    alert('Товар добавлен в корзину!');
                }
            });
        });

        const contactUsBtn = document.querySelector('.contact-us');
        if (contactUsBtn) {
            contactUsBtn.addEventListener('click', function () {
                const email = prompt('Введите ваш email для связи:');
                if (email) {
                    alert(`Спасибо! Мы свяжемся с вами по адресу ${email}`);
                }
            });
        }
    }

    // Обработчик подписки на пользователей
    function handleFollow() {
        if (!currentUser) {
            toggleModal(loginModal, true);
            return;
        }

        if (this.textContent === 'Подписаться') {
            this.textContent = 'Отписаться';
            this.style.backgroundColor = 'var(--gray-color)';
            alert(`Вы подписались на ${this.closest('.recommended-user').querySelector('.username').textContent}`);
        } else {
            this.textContent = 'Подписаться';
            this.style.backgroundColor = 'var(--primary-color)';
            alert(`Вы отписались от ${this.closest('.recommended-user').querySelector('.username').textContent}`);
        }
    }

    // Инициализация при загрузке страницы
    initElements();

    // Восстанавливаем состояние пользователя
    currentUser = getUserFromSessionStorage();
    if (currentUser) {
        updateUIAfterLogin();
        loadCommunities();
        loadEvents();
    } else {
        checkAuthStatus();
    }

    // Основные обработчики событий
    loginBtn.addEventListener('click', () => toggleModal(loginModal, true));
    registerBtn.addEventListener('click', () => toggleModal(registerModal, true));

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            toggleModal(modal, false);
        });
    });

    showRegister.addEventListener('click', function (e) {
        e.preventDefault();
        toggleModal(loginModal, false);
        toggleModal(registerModal, true);
    });

    showLogin.addEventListener('click', function (e) {
        e.preventDefault();
        toggleModal(registerModal, false);
        toggleModal(loginModal, true);
    });

    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            toggleModal(e.target, false);
        }
    });

    forgotPassword.addEventListener('click', function (e) {
        e.preventDefault();
        const email = prompt('Введите ваш email для восстановления пароля:');
        if (email) {
            alert(`Инструкции по восстановлению пароля отправлены на ${email}`);
        }
    });

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        fetch('http://localhost:8000/api.php?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentUser = data.user;
                    saveUserToSessionStorage(currentUser);
                    updateUIAfterLogin();
                    toggleModal(loginModal, false);
                    loadCommunities();
                    loadEvents();
                    alert(`Добро пожаловать, ${currentUser.username}!`);
                } else {
                    alert(data.message || 'Неверный email или пароль');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при входе: ' + (error.message || 'Проверьте соединение с сервером'));
            });
    });

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        const carModel = document.getElementById('register-car').value;
        const terms = document.getElementById('register-terms').checked;

        if (!username || !email || !password || !confirmPassword) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        if (password !== confirmPassword) {
            alert('Пароли не совпадают!');
            return;
        }

        if (!terms) {
            alert('Вы должны принять условия использования');
            return;
        }

        fetch('http://localhost:8000/api.php?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                car_model: carModel
            }),
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentUser = data.user;
                    saveUserToSessionStorage(currentUser);
                    updateUIAfterLogin();
                    toggleModal(registerModal, false);
                    loadCommunities();
                    loadEvents();
                    alert(`Регистрация успешна! Добро пожаловать, ${currentUser.username}!`);
                } else {
                    alert(data.message || 'Регистрация не удалась');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при регистрации: ' + (error.message || 'Проверьте соединение с сервером'));
            });
    });

    mobileMenuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        nav.classList.toggle('show');
    });

    document.addEventListener('click', function (e) {
        if (!nav.contains(e.target) && e.target !== mobileMenuBtn) {
            nav.classList.remove('show');
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });

    socialLoginBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const service = this.querySelector('i').className;

            if (service.includes('fa-google')) {
                alert('Вход через Google в разработке');
            } else if (service.includes('fa-facebook')) {
                alert('Вход через Facebook в разработке');
            } else if (service.includes('fa-vk')) {
                alert('Вход через VK в разработке');
            }
        });
    });

    followBtns.forEach(btn => {
        btn.addEventListener('click', handleFollow);
    });

    // Загрузка начальных данных
    showHomePage();
});