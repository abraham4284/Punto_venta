import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db.js";

interface MustChangePasswordRow extends RowDataPacket {
  must_change_password: number;
}

export async function requirePasswordChangeCompleted(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.auth?.context !== "BUSINESS" || !req.user) {
    next();
    return;
  }

  try {
    const [rows] = await pool.query<MustChangePasswordRow[]>(
      `SELECT u.must_change_password
       FROM users u
       INNER JOIN business_users bu
         ON bu.idUser = u.idUser
         AND bu.idBusiness = ?
         AND bu.is_active = 1
       WHERE u.idUser = ?
         AND u.is_active = 1
       LIMIT 1`,
      [req.user.idBusiness, req.user.idUser],
    );

    const user = rows[0];

    if (!user) {
      res.status(401).json({
        status: false,
        code: "BUSINESS_USER_NOT_ACTIVE",
        message: "Usuario no autorizado para operar en este negocio.",
        data: null,
      });
      return;
    }

    if (Boolean(user.must_change_password)) {
      res.status(403).json({
        status: false,
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "Debe cambiar la contrasena temporal antes de operar.",
        data: null,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
