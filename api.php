<?php

try {
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    
    require_once 'db_connect.php';
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE && in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
        throw new Exception('Invalid JSON input');
    }
    
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'login':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                handleLogin();
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            }
            break;
        case 'register':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                handleRegister();
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            }
            break;
        case 'logout':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                handleLogout();
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            }
            break;
        case 'check':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                checkAuth();
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            }
            break;
        case 'posts':
            handlePosts();
            break;
        case 'events':
            handleEvents();
            break;
        case 'communities':
            handleCommunities();
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => $e->getMessage()]));
}

function handleLogin() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        return;
    }
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['user_id'];
            echo json_encode([
                'success' => true,
                'user' => [
                    'user_id' => $user['user_id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'avatar_url' => $user['avatar_url'] ?? 'Images/profile.png',
                    'car_model' => $user['car_model'] ?? ''
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleRegister() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        return;
    }
    
    $username = $data['username'] ?? '';
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $car_model = $data['car_model'] ?? '';
    
    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => false, 'message' => 'Email already registered']);
            return;
        }
        
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $avatar_url = 'Images/profile.png';
        
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, car_model, avatar_url) VALUES (?, ?, ?, ?, ?)");
        $success = $stmt->execute([$username, $email, $password_hash, $car_model, $avatar_url]);
        
        if ($success) {
            $user_id = $pdo->lastInsertId();
            $_SESSION['user_id'] = $user_id;
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'user_id' => $user_id,
                    'username' => $username,
                    'email' => $email,
                    'avatar_url' => $avatar_url,
                    'car_model' => $car_model
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleLogout() {
    session_unset();
    session_destroy();
    echo json_encode(['success' => true]);
}

function checkAuth() {
    if (isset($_SESSION['user_id'])) {
        global $pdo;
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                echo json_encode([
                    'authenticated' => true,
                    'user' => [
                        'user_id' => $user['user_id'],
                        'username' => $user['username'],
                        'email' => $user['email'],
                        'avatar_url' => $user['avatar_url'] ?? 'Images/profile.png',
                        'car_model' => $user['car_model'] ?? ''
                    ]
                ]);
                return;
            }
        } catch (PDOException $e) {
            echo json_encode(['authenticated' => false, 'message' => 'Database error']);
            return;
        }
    }
    
    echo json_encode(['authenticated' => false]);
}

function handlePosts() {
    global $pdo;
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        $user_id = $_SESSION['user_id'] ?? 0;
        
        try {
            $stmt = $pdo->prepare("
                SELECT p.*, u.username, u.avatar_url, 
                       COUNT(l.like_id) as likes_count,
                       COUNT(c.comment_id) as comments_count,
                       SUM(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) as is_liked
                FROM posts p
                JOIN users u ON p.user_id = u.user_id
                LEFT JOIN post_likes l ON p.post_id = l.post_id
                LEFT JOIN comments c ON p.post_id = c.post_id
                GROUP BY p.post_id
                ORDER BY p.created_at DESC
            ");
            $stmt->execute([$user_id]);
            $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'posts' => $posts]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } elseif ($method === 'POST') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Not authorized']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            return;
        }
        
        $content = $data['content'] ?? '';
        
        if (empty($content)) {
            echo json_encode(['success' => false, 'message' => 'Post content is required']);
            return;
        }
        
        try {
            $stmt = $pdo->prepare("INSERT INTO posts (user_id, content) VALUES (?, ?)");
            $success = $stmt->execute([$_SESSION['user_id'], $content]);
            
            if ($success) {
                $post_id = $pdo->lastInsertId();
                $stmt = $pdo->prepare("
                    SELECT p.*, u.username, u.avatar_url
                    FROM posts p
                    JOIN users u ON p.user_id = u.user_id
                    WHERE p.post_id = ?
                ");
                $stmt->execute([$post_id]);
                $post = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'post' => $post]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to create post']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
}

function handleEvents() {
    global $pdo;
    
    $method = $_SERVER['REQUEST_METHOD'];
    $user_id = $_SESSION['user_id'] ?? 0;
    
    if ($method === 'GET') {
        try {
            $stmt = $pdo->prepare("
                SELECT e.*, u.username as creator_name,
                       COUNT(ep.user_id) as participants_count,
                       SUM(CASE WHEN ep.user_id = ? THEN 1 ELSE 0 END) as is_participating
                FROM events e
                JOIN users u ON e.created_by = u.user_id
                LEFT JOIN event_participants ep ON e.event_id = ep.event_id
                GROUP BY e.event_id
                ORDER BY e.event_date ASC
            ");
            $stmt->execute([$user_id]);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'events' => $events]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } elseif ($method === 'POST') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Not authorized']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            return;
        }
        
        if (isset($data['event_id']) && isset($data['action'])) {
            $event_id = $data['event_id'] ?? 0;
            $action = $data['action'] ?? '';
    
            if (empty($event_id) || empty($action)) {
                echo json_encode(['success' => false, 'message' => 'Event ID and action are required']);
                return;
            }
    
            try {
                if ($action === 'join') {
                    // Проверяем, не является ли пользователь уже участником
                    $stmt = $pdo->prepare("SELECT * FROM event_participants WHERE user_id = ? AND event_id = ?");
                    $stmt->execute([$_SESSION['user_id'], $event_id]);
                    
                    if ($stmt->rowCount() === 0) {
                        $stmt = $pdo->prepare("INSERT INTO event_participants (user_id, event_id) VALUES (?, ?)");
                        $stmt->execute([$_SESSION['user_id'], $event_id]);
                    }
                } elseif ($action === 'leave') {
                    $stmt = $pdo->prepare("DELETE FROM event_participants WHERE user_id = ? AND event_id = ?");
                    $stmt->execute([$_SESSION['user_id'], $event_id]);
                }
    
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            $title = $data['title'] ?? '';
            $description = $data['description'] ?? '';
            $event_date = $data['event_date'] ?? '';
            $location = $data['location'] ?? '';
            $latitude = $data['latitude'] ?? null;
            $longitude = $data['longitude'] ?? null;
            
            if (empty($title) || empty($event_date)) {
                echo json_encode(['success' => false, 'message' => 'Title and date are required']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("INSERT INTO events (title, description, event_date, location, latitude, longitude, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $success = $stmt->execute([$title, $description, $event_date, $location, $latitude, $longitude, $_SESSION['user_id']]);
                
                if ($success) {
                    $event_id = $pdo->lastInsertId();
                    
                    // Автоматически добавляем создателя как участника
                    $stmt = $pdo->prepare("INSERT INTO event_participants (user_id, event_id) VALUES (?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $event_id]);
                    
                    $stmt = $pdo->prepare("
                        SELECT e.*, u.username as creator_name
                        FROM events e
                        JOIN users u ON e.created_by = u.user_id
                        WHERE e.event_id = ?
                    ");
                    $stmt->execute([$event_id]);
                    $event = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    $event['is_participating'] = 1;
                    $event['participants_count'] = 1;
                    
                    echo json_encode(['success' => true, 'event' => $event]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create event']);
                }
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
    } elseif ($method === 'DELETE') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Not authorized']);
            return;
        }
        
        $event_id = $_GET['id'] ?? 0;
        
        try {
            $stmt = $pdo->prepare("SELECT created_by FROM events WHERE event_id = ?");
            $stmt->execute([$event_id]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$event) {
                echo json_encode(['success' => false, 'message' => 'Event not found']);
                return;
            }
            
            if ($event['created_by'] != $_SESSION['user_id']) {
                echo json_encode(['success' => false, 'message' => 'Not authorized to delete this event']);
                return;
            }
            
            $stmt = $pdo->prepare("DELETE FROM event_participants WHERE event_id = ?");
            $stmt->execute([$event_id]);
            
            $stmt = $pdo->prepare("DELETE FROM events WHERE event_id = ?");
            $success = $stmt->execute([$event_id]);
            
            if ($success) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete event']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
}

function handleCommunities() {
    global $pdo;
    
    $method = $_SERVER['REQUEST_METHOD'];
    $user_id = $_SESSION['user_id'] ?? 0;
    
    if ($method === 'GET') {
        try {
            $stmt = $pdo->prepare("
                SELECT c.*, u.username as creator_name,
                       COUNT(uc.user_id) as members_count,
                       SUM(CASE WHEN uc.user_id = ? THEN 1 ELSE 0 END) as is_member
                FROM communities c
                JOIN users u ON c.user_id = u.user_id
                LEFT JOIN user_communities uc ON c.community_id = uc.community_id
                GROUP BY c.community_id
                ORDER BY c.name ASC
            ");
            $stmt->execute([$user_id]);
            $communities = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'communities' => $communities]);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } elseif ($method === 'POST') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Not authorized']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
            return;
        }
        
        if (isset($data['community_id']) && isset($data['action'])) {
            $community_id = $data['community_id'] ?? 0;
            $action = $data['action'] ?? '';
    
            if (empty($community_id) || empty($action)) {
                echo json_encode(['success' => false, 'message' => 'Community ID and action are required']);
                return;
            }
    
            try {
                if ($action === 'join') {
                    // Проверяем, не является ли пользователь уже участником
                    $stmt = $pdo->prepare("SELECT * FROM user_communities WHERE user_id = ? AND community_id = ?");
                    $stmt->execute([$_SESSION['user_id'], $community_id]);
                    
                    if ($stmt->rowCount() === 0) {
                        $stmt = $pdo->prepare("INSERT INTO user_communities (user_id, community_id) VALUES (?, ?)");
                        $stmt->execute([$_SESSION['user_id'], $community_id]);
                    }
                } elseif ($action === 'leave') {
                    $stmt = $pdo->prepare("DELETE FROM user_communities WHERE user_id = ? AND community_id = ?");
                    $stmt->execute([$_SESSION['user_id'], $community_id]);
                }
    
                echo json_encode(['success' => true]);
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        } else {
            $name = $data['name'] ?? '';
            $description = $data['description'] ?? '';
            
            if (empty($name)) {
                echo json_encode(['success' => false, 'message' => 'Community name is required']);
                return;
            }
            
            try {
                $stmt = $pdo->prepare("INSERT INTO communities (name, description, user_id) VALUES (?, ?, ?)");
                $success = $stmt->execute([$name, $description, $_SESSION['user_id']]);
                
                if ($success) {
                    $community_id = $pdo->lastInsertId();
                    
                    // Автоматически добавляем создателя как участника
                    $stmt = $pdo->prepare("INSERT INTO user_communities (user_id, community_id) VALUES (?, ?)");
                    $stmt->execute([$_SESSION['user_id'], $community_id]);
                    
                    $stmt = $pdo->prepare("
                        SELECT c.*, u.username as creator_name
                        FROM communities c
                        JOIN users u ON c.user_id = u.user_id
                        WHERE c.community_id = ?
                    ");
                    $stmt->execute([$community_id]);
                    $community = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    $community['is_member'] = 1;
                    $community['members_count'] = 1;
                    
                    echo json_encode(['success' => true, 'community' => $community]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create community']);
                }
            } catch (PDOException $e) {
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            }
        }
    } elseif ($method === 'DELETE') {
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Not authorized']);
            return;
        }
        
        $community_id = $_GET['id'] ?? 0;
        
        try {
            $stmt = $pdo->prepare("SELECT user_id FROM communities WHERE community_id = ?");
            $stmt->execute([$community_id]);
            $community = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$community) {
                echo json_encode(['success' => false, 'message' => 'Community not found']);
                return;
            }
            
            if ($community['user_id'] != $_SESSION['user_id']) {
                echo json_encode(['success' => false, 'message' => 'Not authorized to delete this community']);
                return;
            }
            
            $stmt = $pdo->prepare("DELETE FROM user_communities WHERE community_id = ?");
            $stmt->execute([$community_id]);
            
            $stmt = $pdo->prepare("DELETE FROM communities WHERE community_id = ?");
            $success = $stmt->execute([$community_id]);
            
            if ($success) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to delete community']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
}