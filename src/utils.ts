export function generateSessionId() {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';

    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    
    return result;
}