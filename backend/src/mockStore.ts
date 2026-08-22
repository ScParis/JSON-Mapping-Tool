export interface RuleMatchCondition {
    type: 'header' | 'query' | 'body';
    key?: string;
    operator: 'equals' | 'contains' | 'exists' | 'regex';
    value: string;
}

export interface MockRule {
    id: string;
    pathPattern: string;
    method: string;
    matchConditions?: RuleMatchCondition[];
    responseStatus: number;
    responseHeaders: Record<string, string>;
    responseBody: string;
    responseDelay?: number;
    corsEnabled?: boolean;
    networkFailure?: 'close' | 'empty';
}

export interface InterceptedRequest {
    id: string;
    method: string;
    path: string;
    headers: Record<string, string>;
    body: any;
    query: Record<string, string>;
    timestamp: string;
    responseStatus?: number;
    matchedRuleId?: string;
    responseBody?: string;
}

export interface MockEndpoint {
    id: string;
    rules: MockRule[];
    requests: InterceptedRequest[];
}

type SSEListener = (request: InterceptedRequest) => void;

class MockStore {
    private endpoints: Map<string, MockEndpoint> = new Map();
    private listeners: Map<string, Set<SSEListener>> = new Map();

    deleteEndpoint(id: string): boolean {
        const cleanedId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const hasEndpoint = this.endpoints.has(cleanedId);
        if (hasEndpoint) {
            this.endpoints.delete(cleanedId);
            const ls = this.listeners.get(cleanedId);
            if (ls) {
                ls.clear();
                this.listeners.delete(cleanedId);
            }
            return true;
        }
        return false;
    }

    getOrCreateEndpoint(id: string): MockEndpoint {
        const cleanedId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (!this.endpoints.has(cleanedId)) {
            this.endpoints.set(cleanedId, {
                id: cleanedId,
                rules: [],
                requests: []
            });
            this.listeners.set(cleanedId, new Set());
        }
        return this.endpoints.get(cleanedId)!;
    }

    listEndpoints(): MockEndpoint[] {
        return Array.from(this.endpoints.values());
    }

    addRule(endpointId: string, rule: Omit<MockRule, 'id'>): MockRule {
        const ep = this.getOrCreateEndpoint(endpointId);
        const newRule: MockRule = {
            ...rule,
            id: Math.random().toString(36).substring(2, 9)
        };
        ep.rules.push(newRule);
        return newRule;
    }

    deleteRule(endpointId: string, ruleId: string): boolean {
        const ep = this.getOrCreateEndpoint(endpointId);
        const index = ep.rules.findIndex(r => r.id === ruleId);
        if (index !== -1) {
            ep.rules.splice(index, 1);
            return true;
        }
        return false;
    }

    clearRequests(endpointId: string): void {
        const ep = this.getOrCreateEndpoint(endpointId);
        ep.requests = [];
    }

    addRequest(endpointId: string, request: Omit<InterceptedRequest, 'id' | 'timestamp'>): InterceptedRequest {
        const ep = this.getOrCreateEndpoint(endpointId);
        const newRequest: InterceptedRequest = {
            ...request,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toISOString()
        };

        ep.requests.unshift(newRequest);

        if (ep.requests.length > 50) {
            ep.requests = ep.requests.slice(0, 50);
        }

        const epsListeners = this.listeners.get(ep.id);
        if (epsListeners) {
            epsListeners.forEach(listener => {
                try {
                    listener(newRequest);
                } catch (e) {
                    console.error('Error notifying SSE listener:', e);
                }
            });
        }

        return newRequest;
    }

    addListener(endpointId: string, listener: SSEListener): void {
        this.getOrCreateEndpoint(endpointId); // Ensure structures exist
        const cleanedId = endpointId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        this.listeners.get(cleanedId)!.add(listener);
    }

    removeListener(endpointId: string, listener: SSEListener): void {
        const cleanedId = endpointId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const set = this.listeners.get(cleanedId);
        if (set) {
            set.delete(listener);
        }
    }
}

export const mockStore = new MockStore();
