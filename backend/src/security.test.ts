import { isPrivateIPv4, isPrivateIPv6, isPrivateIP, validateUrlForSSRF } from './security';

describe('Security Utils (SSRF Protection)', () => {
    describe('isPrivateIPv4', () => {
        it('should detect loopback IP 127.0.0.1 as private', () => {
            expect(isPrivateIPv4('127.0.0.1')).toBe(true);
        });

        it('should detect Class A private IP 10.0.0.1 as private', () => {
            expect(isPrivateIPv4('10.0.0.1')).toBe(true);
        });

        it('should detect Class B private IP 172.16.0.1 as private', () => {
            expect(isPrivateIPv4('172.16.0.1')).toBe(true);
        });

        it('should detect Class C private IP 192.168.1.1 as private', () => {
            expect(isPrivateIPv4('192.168.1.1')).toBe(true);
        });

        it('should recognize public IPv4 address 8.8.8.8 as non-private', () => {
            expect(isPrivateIPv4('8.8.8.8')).toBe(false);
        });
    });

    describe('isPrivateIPv6', () => {
        it('should detect IPv6 loopback ::1 as private', () => {
            expect(isPrivateIPv6('::1')).toBe(true);
        });

        it('should detect Unique Local Address fc00::1 as private', () => {
            expect(isPrivateIPv6('fc00::1')).toBe(true);
        });

        it('should detect IPv4-mapped IPv6 ::ffff:127.0.0.1 as private', () => {
            expect(isPrivateIPv6('::ffff:127.0.0.1')).toBe(true);
        });
    });

    describe('validateUrlForSSRF', () => {
        it('should reject invalid URL strings', async () => {
            const isValid = await validateUrlForSSRF('not-a-valid-url');
            expect(isValid).toBe(false);
        });

        it('should allow public HTTPS URLs', async () => {
            const isValid = await validateUrlForSSRF('https://httpbin.org/get');
            expect(isValid).toBe(true);
        });
    });
});
