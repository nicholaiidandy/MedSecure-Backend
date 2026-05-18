declare module 'multer' {
  import type { RequestHandler } from 'express';

  export interface File {
    buffer: Buffer;
    originalname: string;
    mimetype?: string;
  }

  export interface StorageEngine {}

  export interface Options {
    storage?: StorageEngine;
  }

  export interface Multer {
    single(fieldName: string): RequestHandler;
  }

  export interface MulterStatic {
    (options?: Options): Multer;
    memoryStorage(): StorageEngine;
  }

  const multer: MulterStatic;
  export default multer;
}
