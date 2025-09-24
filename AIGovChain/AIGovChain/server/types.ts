import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
    role: string;
    walletAddress?: string;
  };
  file?: Express.Multer.File;
}