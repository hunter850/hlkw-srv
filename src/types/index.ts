import type { Request } from "express";

export interface Frontmatter {
    title: string;
    date: string;
    category: string;
    tags: string[];
    description: string;
    language: string;
    draft?: boolean;
    image?: string;
}

export type AnyObj = Record<string, any>;

export type RequestQuery<T = any> = Request<AnyObj, any, AnyObj, T>;
export type RequestBody<T = any> = Request<AnyObj, any, T, AnyObj>;
export type RequestPlain = Request<AnyObj, any, AnyObj, AnyObj>;
export type RequestParams<T = any> = Request<T, any, AnyObj, AnyObj>;

export interface RequestWithRawBuffer<T = any> extends RequestBody<T> {
    rawBuffer?: Buffer<ArrayBufferLike>;
}
