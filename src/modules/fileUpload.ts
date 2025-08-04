import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

// 使用記憶體儲存
const storage = multer.memoryStorage();

// 檔案類型過濾器
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const isImage = file.mimetype.startsWith("image/");
    const isDbFile = file.originalname.toLowerCase().endsWith(".db");

    if (isImage || isDbFile) {
        cb(null, true);
    } else {
        cb(new Error("只允許上傳圖片檔案或 .db 檔案"));
    }
};

// Multer 設定
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024, // Render 的 starter plan 限制 RAM 512MB，所以先限制 200MB
    },
});

// 單檔上傳
export const uploadSingle = (fieldName: string = "file") => upload.single(fieldName);

// 多檔上傳
export const uploadMultiple = (fieldName: string = "files", maxCount: number = 10) => upload.array(fieldName, maxCount);

export default upload;
