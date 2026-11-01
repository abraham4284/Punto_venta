import type { Request, Response } from "express";
import { z } from "zod";
import { getIdempotencyKeyFromRequest, isIdempotencyError } from "@/helpers/idempotency.helper.js";
import { SaleReturnError } from "../helpers/sale-returns.helper.js";
import { createSaleReturnService, getSaleReturnService, listSaleReturnsService } from "../services/sale-returns.service.js";
import { saleReturnBodySchema, saleReturnIdSchema } from "../validations/sale-returns.validations.js";
function fail(res: Response, error: unknown) {
    if (error instanceof z.ZodError)
        return res.status(400).json({ status: false, message: "Error de validacion", errors: error.issues.map(function issue(i) { return { field: i.path.join("."), message: i.message }; }) });
    if (error instanceof SaleReturnError)
        return res.status(error.statusCode).json({ status: false, code: error.code, message: error.message });
    if (error instanceof Error && isIdempotencyError(error.message))
        return res.status(400).json({ status: false, code: error.message, message: "Envie un Idempotency-Key UUID valido" });
    return res.status(500).json({ status: false, message: "No se pudo procesar la devolucion" });
}
export async function createSaleReturnController(req: Request, res: Response) {
    try {
        if (!req.user)
            throw new SaleReturnError("SALE_RETURN_ACTOR_INVALID", 403);
        const body = saleReturnBodySchema.parse(req.body);
        const data = await createSaleReturnService(req.user.idBusiness, req.user.idUser, saleReturnIdSchema.parse(req.params.idSale), getIdempotencyKeyFromRequest(req), body);
        return res.status(data.idempotentReplay ? 200 : 201).json({ status: true, message: "Devolucion registrada", data });
    }
    catch (error) {
        return fail(res, error);
    }
}
export async function listSaleReturnsController(req: Request, res: Response) {
    try {
        if (!req.user)
            throw new SaleReturnError("SALE_RETURN_ACTOR_INVALID", 403);
        return res.status(200).json({ status: true, data: await listSaleReturnsService(req.user.idBusiness, saleReturnIdSchema.parse(req.params.idSale)) });
    }
    catch (error) {
        return fail(res, error);
    }
}
export async function getSaleReturnController(req: Request, res: Response) {
    try {
        if (!req.user)
            throw new SaleReturnError("SALE_RETURN_ACTOR_INVALID", 403);
        return res.status(200).json({ status: true, data: await getSaleReturnService(req.user.idBusiness, saleReturnIdSchema.parse(req.params.idSaleReturn)) });
    }
    catch (error) {
        return fail(res, error);
    }
}
