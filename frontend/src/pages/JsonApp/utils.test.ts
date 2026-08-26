import { setNestedValue, generateKeysList } from './utils';

describe('JsonApp Utils', () => {
    describe('setNestedValue', () => {
        it('should set simple property on target object', () => {
            const target: any = {};
            setNestedValue(target, 'name', 'John Doe');
            expect(target.name).toBe('John Doe');
        });

        it('should create nested objects dynamically for dotted paths', () => {
            const target: any = {};
            setNestedValue(target, 'user.profile.age', 30);
            expect(target).toEqual({
                user: {
                    profile: {
                        age: 30
                    }
                }
            });
        });

        it('should handle array index notation correctly', () => {
            const target: any = {};
            setNestedValue(target, 'items[0].id', 'ITEM-1');
            expect(target).toEqual({
                items: [
                    { id: 'ITEM-1' }
                ]
            });
        });
    });

    describe('generateKeysList', () => {
        it('should extract flat key paths from an object', () => {
            const data = {
                id: 1,
                user: {
                    name: 'Alice',
                    email: 'alice@example.com'
                }
            };
            const keys = generateKeysList(data);
            expect(keys).toEqual(['id', 'user.name', 'user.email']);
        });

        it('should extract array indexed keys from an array of objects', () => {
            const data = [
                { code: 'A' }
            ];
            const keys = generateKeysList(data);
            expect(keys).toEqual(['[0].code']);
        });
    });
});
