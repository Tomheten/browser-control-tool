import { Protocol } from 'playwright-core/types/protocol';

export type NetworkResourceType = (
    | 'Document'
    | 'Stylesheet'
    | 'Image'
    | 'Media'
    | 'Font'
    | 'Script'
    | 'XHR'
    | 'Fetch'
    | 'WebSocket'
    | 'Manifest'
    | 'Other'
    | 'Wasm'
    ) & Protocol.Network.ResourceType

export type LoggableNetworkResourceType = 'All' | NetworkResourceType;