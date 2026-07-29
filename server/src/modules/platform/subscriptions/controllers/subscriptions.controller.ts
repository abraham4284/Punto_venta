import type { Request, Response } from "express";
import { z } from "zod";
import { getPaginationParams } from "../helpers/pagination.helper.js";
import type { SubscriptionServiceError } from "../types/index.js";
import { createPlatformAuditLogService } from "../../audit/services/audit.service.js";
import {
  assignBusinessSubscriptionService,
  cancelBusinessSubscriptionService,
  changeBusinessSubscriptionPlanService,
  createSubscriptionPaymentService,
  createSubscriptionPlanService,
  getBusinessSubscriptionByIdService,
  getCurrentBusinessSubscriptionService,
  getSubscriptionPaymentByIdService,
  getSubscriptionPlanByIdService,
  listBusinessOptionsService,
  listBusinessSubscriptionsService,
  listSubscriptionEventsService,
  listSubscriptionPaymentsService,
  listSubscriptionPlansService,
  processExpiredSubscriptionsService,
  reactivateBusinessSubscriptionService,
  suspendBusinessSubscriptionService,
  toggleSubscriptionPlanStatusService,
  updateAutoRenewService,
  updatePaymentStatusService,
  updateSubscriptionPlanService,
} from "../services/subscriptions.service.js";
import {
  assignSubscriptionSchema,
  autoRenewSchema,
  cancelSubscriptionSchema,
  changeSubscriptionPlanSchema,
  createSubscriptionPaymentSchema,
  createSubscriptionPlanSchema,
  listBusinessSubscriptionsQuerySchema,
  listEventsQuerySchema,
  listPaymentsQuerySchema,
  listPlansQuerySchema,
  subscriptionReasonSchema,
  toggleSubscriptionPlanStatusSchema,
  updatePaymentStatusSchema,
  updateSubscriptionPlanSchema,
} from "../validations/subscriptions.validations.js";

function getZodErrors(error: z.ZodError) {
  return error.issues.map(function mapIssue(issue) {
    return {
      field: issue.path.join("."),
      message: issue.message,
    };
  });
}

function isSubscriptionServiceError(
  error: unknown,
): error is SubscriptionServiceError {
  return error instanceof Error && "statusCode" in error && "code" in error;
}

function getErrorResponse(error: unknown) {
  if (isSubscriptionServiceError(error)) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        code: error.code,
        message: error.message,
        data: null,
      },
    };
  }

  return {
    statusCode: 400,
    body: {
      success: false,
      message: error instanceof Error ? error.message : "Error de suscripcion",
      data: null,
    },
  };
}

function getPositiveId(value: unknown, field: string): number {
  if (Array.isArray(value)) {
    throw new Error(`${field} debe ser valido`);
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${field} debe ser valido`);
  }

  return id;
}

async function registerSubscriptionAuditSafely(
  req: Request,
  action: string,
  entityType: string,
  entityId: string | number | null,
  idBusiness: number | null,
  newData: unknown,
  metadata?: unknown,
): Promise<void> {
  try {
    await createPlatformAuditLogService({
      actorIdUser: req.auth!.idUser,
      action,
      entityType,
      entityId,
      idBusiness,
      newData,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("Error registrando auditoria Platform:", error);
  }
}

export async function listSubscriptionPlansController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = listPlansQuerySchema.parse(req.query);
    const pagination = getPaginationParams(query.page, query.limit);
    const result = await listSubscriptionPlansService(query, pagination);

    return res.status(200).json({
      success: true,
      message: "Planes obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function listBusinessOptionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await listBusinessOptionsService();

    return res.status(200).json({
      success: true,
      message: "Negocios obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getSubscriptionPlanByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idSubscriptionPlan, "El plan");
    const result = await getSubscriptionPlanByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Plan obtenido correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function createSubscriptionPlanController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createSubscriptionPlanSchema.parse(req.body);
    const result = await createSubscriptionPlanService(data);
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_PLAN_CREATED",
      "SUBSCRIPTION_PLAN",
      result.idSubscriptionPlan,
      null,
      result,
    );

    return res.status(201).json({
      success: true,
      message: "Plan creado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function updateSubscriptionPlanController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idSubscriptionPlan, "El plan");
    const data = updateSubscriptionPlanSchema.parse(req.body);
    const result = await updateSubscriptionPlanService(id, data);
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_PLAN_UPDATED",
      "SUBSCRIPTION_PLAN",
      result.idSubscriptionPlan,
      null,
      result,
    );

    return res.status(200).json({
      success: true,
      message: "Plan actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function toggleSubscriptionPlanStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idSubscriptionPlan, "El plan");
    const data = toggleSubscriptionPlanStatusSchema.parse(req.body);
    const result = await toggleSubscriptionPlanStatusService(id, data);
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_PLAN_STATUS_CHANGED",
      "SUBSCRIPTION_PLAN",
      result.idSubscriptionPlan,
      null,
      result,
      data,
    );

    return res.status(200).json({
      success: true,
      message: "Estado del plan actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function listBusinessSubscriptionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = listBusinessSubscriptionsQuerySchema.parse(req.query);
    const pagination = getPaginationParams(query.page, query.limit);
    const result = await listBusinessSubscriptionsService(query, pagination);

    return res.status(200).json({
      success: true,
      message: "Suscripciones obtenidas correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getBusinessSubscriptionByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(
      req.params.idBusinessSubscription,
      "La suscripcion",
    );
    const result = await getBusinessSubscriptionByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Suscripcion obtenida correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function assignBusinessSubscriptionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = assignSubscriptionSchema.parse(req.body);
    const result = await assignBusinessSubscriptionService(
      data,
      req.auth!.idUser,
    );
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_ASSIGNED",
      "BUSINESS_SUBSCRIPTION",
      result.idBusinessSubscription,
      result.business.idBusiness,
      result,
      data,
    );

    return res.status(201).json({
      success: true,
      message: "Suscripcion asignada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function changeBusinessSubscriptionPlanController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(
      req.params.idBusinessSubscription,
      "La suscripcion",
    );
    const data = changeSubscriptionPlanSchema.parse(req.body);
    const result = await changeBusinessSubscriptionPlanService(
      id,
      data,
      req.auth!.idUser,
    );
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_PLAN_CHANGED",
      "BUSINESS_SUBSCRIPTION",
      result.idBusinessSubscription,
      result.business.idBusiness,
      result,
      data,
    );

    return res.status(200).json({
      success: true,
      message: "Plan de suscripcion actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function suspendBusinessSubscriptionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(
      req.params.idBusinessSubscription,
      "La suscripcion",
    );
    const data = subscriptionReasonSchema.parse(req.body);
    const result = await suspendBusinessSubscriptionService(
      id,
      data,
      req.auth!.idUser,
    );
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_SUSPENDED",
      "BUSINESS_SUBSCRIPTION",
      result.idBusinessSubscription,
      result.business.idBusiness,
      result,
      data,
    );

    return res.status(200).json({
      success: true,
      message: "Suscripcion suspendida correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function reactivateBusinessSubscriptionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(
      req.params.idBusinessSubscription,
      "La suscripcion",
    );
    const result = await reactivateBusinessSubscriptionService(
      id,
      req.auth!.idUser,
    );
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_REACTIVATED",
      "BUSINESS_SUBSCRIPTION",
      result.idBusinessSubscription,
      result.business.idBusiness,
      result,
    );

    return res.status(200).json({
      success: true,
      message: "Suscripcion reactivada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function cancelBusinessSubscriptionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(
      req.params.idBusinessSubscription,
      "La suscripcion",
    );
    const data = cancelSubscriptionSchema.parse(req.body);
    const result = await cancelBusinessSubscriptionService(
      id,
      data,
      req.auth!.idUser,
    );
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_CANCELLED",
      "BUSINESS_SUBSCRIPTION",
      result.idBusinessSubscription,
      result.business.idBusiness,
      result,
      data,
    );

    return res.status(200).json({
      success: true,
      message: "Suscripcion cancelada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function updateAutoRenewController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(
      req.params.idBusinessSubscription,
      "La suscripcion",
    );
    const data = autoRenewSchema.parse(req.body);
    const result = await updateAutoRenewService(id, data, req.auth!.idUser);
    await registerSubscriptionAuditSafely(
      req,
      "SUBSCRIPTION_AUTO_RENEW_CHANGED",
      "BUSINESS_SUBSCRIPTION",
      result.idBusinessSubscription,
      result.business.idBusiness,
      result,
      data,
    );

    return res.status(200).json({
      success: true,
      message: "Renovacion automatica actualizada correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function listSubscriptionPaymentsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = listPaymentsQuerySchema.parse(req.query);
    const pagination = getPaginationParams(query.page, query.limit);
    const result = await listSubscriptionPaymentsService(query, pagination);

    return res.status(200).json({
      success: true,
      message: "Pagos obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function getSubscriptionPaymentByIdController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idSubscriptionPayment, "El pago");
    const result = await getSubscriptionPaymentByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Pago obtenido correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function createSubscriptionPaymentController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const data = createSubscriptionPaymentSchema.parse(req.body);
    const result = await createSubscriptionPaymentService(data, req.auth!.idUser);
    await registerSubscriptionAuditSafely(
      req,
      "PAYMENT_CREATED",
      "SUBSCRIPTION_PAYMENT",
      result.idSubscriptionPayment,
      null,
      result,
      data,
    );

    return res.status(201).json({
      success: true,
      message: "Pago registrado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function updatePaymentStatusController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const id = getPositiveId(req.params.idSubscriptionPayment, "El pago");
    const data = updatePaymentStatusSchema.parse(req.body);
    const routeStatus = req.params.status;
    const statusMap = {
      approve: "APPROVED",
      reject: "REJECTED",
      cancel: "CANCELLED",
      refund: "REFUNDED",
    } as const;
    const paymentStatus = routeStatus
      ? statusMap[routeStatus as keyof typeof statusMap]
      : undefined;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "El estado del pago no es valido",
        data: null,
      });
    }

    const result = await updatePaymentStatusService(
      id,
      paymentStatus,
      data,
      req.auth!.idUser,
    );
    await registerSubscriptionAuditSafely(
      req,
      "PAYMENT_STATUS_CHANGED",
      "SUBSCRIPTION_PAYMENT",
      result.idSubscriptionPayment,
      null,
      result,
      { paymentStatus, ...data },
    );

    return res.status(200).json({
      success: true,
      message: "Estado del pago actualizado correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function listSubscriptionEventsController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const query = listEventsQuerySchema.parse({
      ...req.query,
      idBusinessSubscription:
        req.params.idBusinessSubscription ?? req.query.idBusinessSubscription,
    });
    const pagination = getPaginationParams(query.page, query.limit);
    const result = await listSubscriptionEventsService(query, pagination);

    return res.status(200).json({
      success: true,
      message: "Eventos obtenidos correctamente",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: getZodErrors(error),
      });
    }
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}

export async function processExpiredSubscriptionsController(
  req: Request,
  res: Response,
): Promise<Response> {
  const result = await processExpiredSubscriptionsService();
  await registerSubscriptionAuditSafely(
    req,
    "EXPIRATIONS_PROCESSED",
    "SUBSCRIPTION_EXPIRATION_JOB",
    null,
    null,
    result,
  );

  return res.status(200).json({
    success: true,
    message: "Vencimientos procesados correctamente",
    data: result,
  });
}

export async function getCurrentBusinessSubscriptionController(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const result = await getCurrentBusinessSubscriptionService(
      req.user!.idBusiness,
    );

    return res.status(200).json({
      success: true,
      message: "Suscripcion del negocio obtenida correctamente",
      data: result,
    });
  } catch (error: unknown) {
    const response = getErrorResponse(error);
    return res.status(response.statusCode).json(response.body);
  }
}
