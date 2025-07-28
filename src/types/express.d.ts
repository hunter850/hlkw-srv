declare namespace Express {
    export interface Request {
        rawBuffer?: Buffer<ArrayBufferLike>;
    }
}
