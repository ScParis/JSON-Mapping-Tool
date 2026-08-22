import dns from 'dns';
import { promisify } from 'util';
import { Request, Response, NextFunction } from 'express';

const lookup = promisify(dns.lookup);

/**
 * Verifica se um endereço IPv4 pertence a uma faixa privada ou loopback.
 */
export function isPrivateIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return false;
    const [a, b, c, d] = parts;
    
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    
    // 169.254.0.0/16 (Link-local)
    if (a === 169 && b === 254) return true;
    
    // 0.0.0.0/8 (Current network / Broadcast)
    if (a === 0) return true;
    
    return false;
}

/**
 * Verifica se um endereço IPv6 pertence a uma faixa privada, local ou loopback.
 */
export function isPrivateIPv6(ip: string): boolean {
    const cleanIp = ip.toLowerCase().trim();
    if (cleanIp === '::1' || cleanIp === '::') return true;
    
    // Unique Local Address (fc00::/7) - inicia com fc ou fd
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true;
    
    // Link-local Address (fe80::/10) - inicia com fe8, fe9, fea, feb
    if (/^fe[89ab]/i.test(cleanIp)) return true;
    
    // IPv4-mapped IPv6 (ex: ::ffff:127.0.0.1 ou ::ffff:192.168.1.1)
    if (cleanIp.startsWith('::ffff:')) {
        const ipv4Part = cleanIp.slice(7);
        return isPrivateIPv4(ipv4Part);
    }
    
    return false;
}

/**
 * Determina se o IP é privado/local de forma geral (IPv4 ou IPv6).
 */
export function isPrivateIP(ip: string): boolean {
    if (ip.includes(':')) {
        return isPrivateIPv6(ip);
    }
    if (ip.includes('.')) {
        return isPrivateIPv4(ip);
    }
    return true; // Se não for IP reconhecido, assuma que não é seguro
}

/**
 * Valida se uma URL é segura para requisição do lado do servidor (proteção contra SSRF).
 */
export async function validateUrlForSSRF(urlStr: string): Promise<boolean> {
    if (process.env.ALLOW_PRIVATE_IPS === 'true') {
        return true;
    }
    try {
        const parsedUrl = new URL(urlStr);
        const hostname = parsedUrl.hostname;
        
        // Remove colchetes de hostnames IPv6 como [::1]
        const cleanHost = hostname.startsWith('[') && hostname.endsWith(']')
            ? hostname.slice(1, -1)
            : hostname;
            
        // Se for diretamente um IP válido, verifica-o imediatamente
        if (cleanHost.includes('.') && !isNaN(Number(cleanHost.replace(/\./g, '')))) {
            return !isPrivateIP(cleanHost);
        }
        
        // Resolve o hostname usando o servidor DNS local
        const result = await lookup(cleanHost);
        return !isPrivateIP(result.address);
    } catch (e) {
        // Falhas de resolução ou parsing significam URL inválida ou insegura
        return false;
    }
}

interface RateLimitStore {
    [ip: string]: {
        count: number;
        resetTime: number;
    }
}

const rateLimitStore: RateLimitStore = {};

/**
 * Middleware nativo de Rate Limiter em memória.
 */
export function rateLimiter(limit: number, windowMs: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = (
            req.headers['x-forwarded-for'] as string || 
            req.ip || 
            req.socket.remoteAddress || 
            'unknown'
        ).split(',')[0].trim();
        
        const now = Date.now();
        
        if (!rateLimitStore[ip] || now > rateLimitStore[ip].resetTime) {
            rateLimitStore[ip] = {
                count: 1,
                resetTime: now + windowMs
            };
            return next();
        }
        
        rateLimitStore[ip].count++;
        
        if (rateLimitStore[ip].count > limit) {
            const timeLeft = Math.ceil((rateLimitStore[ip].resetTime - now) / 1000);
            res.setHeader('Retry-After', timeLeft);
            return res.status(429).json({
                error: 'Muitas requisições. Por favor, tente novamente mais tarde.',
                retryAfterSeconds: timeLeft
            });
        }
        
        next();
    };
}
