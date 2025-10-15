const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const secretKey = process.env.ENCRYPTION_KEY;
const ivLength = parseInt(process.env.IV_LENGTH || '16', 10); // 16 bytes for AES

// Ensure secretKey is 32 bytes (256 bits)
if (!secretKey || secretKey.length !== 32) {
    console.error('Encryption key must be 32 characters long. Please set ENCRYPTION_KEY in your .env file.');
    // Exit or throw error in production environment
}

const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength); // Generate a random IV
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
};

const decrypt = (encryptedData, iv) => {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

module.exports = { encrypt, decrypt };
