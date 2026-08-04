import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, KeyRound } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlatformAuthStore } from "@/views/platform/module/auth/store/platformAuth.store";
import { BusinessUserPasswordResetModal } from "../components/BusinessUserPasswordResetModal";
import { usePlatformBusinessDetail } from "../hooks/usePlatformBusinessDetail";
import type {
  PlatformBusinessUser,
  ResetBusinessUserPasswordResponse,
  UsageMetric,
} from "../types";

type DetailTab = "summary" | "users" | "activity" | "usage" | "sales" | "purchases";

const tabs: Array<{ key: DetailTab; label: string }> = [
  { key: "summary", label: "Resumen" },
  { key: "users", label: "Usuarios" },
  { key: "activity", label: "Actividad" },
  { key: "usage", label: "Uso del plan" },
  { key: "sales", label: "Ventas recientes" },
  { key: "purchases", label: "Compras recientes" },
];

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

const UsageBar = ({ label, metric }: { label: string; metric: UsageMetric }) => {
  const percentage = metric.percentage ?? 0;
  const color = metric.exceeded
    ? "bg-red-500"
    : metric.reached || percentage >= 80
      ? "bg-amber-500"
      : "bg-cyan-500";

  return (
    <div className="space-y-2 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">{label}</p>
        <span className="text-sm text-muted-foreground">
          {metric.current} / {metric.limit ?? "Ilimitado"}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {metric.limit === null ? "Sin limite asignado" : `${percentage}% utilizado`}
      </p>
    </div>
  );
};

export const PlatformBusinessDetailPage = () => {
  const { idBusiness } = useParams();
  const numericId = Number(idBusiness);
  const [activeTab, setActiveTab] = useState<DetailTab>("summary");
  const platformUser = usePlatformAuthStore((state) => state.platformUser);
  const [selectedResetUser, setSelectedResetUser] =
    useState<PlatformBusinessUser | null>(null);
  const [resetResult, setResetResult] =
    useState<ResetBusinessUserPasswordResponse | null>(null);
  const {
    business,
    users,
    activity,
    usage,
    sales,
    purchases,
    loading,
    resetPasswordLoadingId,
    error,
    resetBusinessUserPassword,
  } = usePlatformBusinessDetail(numericId);
  const canResetPasswords = platformUser?.platformRole === "SUPER_ADMIN";

  const handleOpenResetModal = (user: PlatformBusinessUser) => {
    setSelectedResetUser(user);
    setResetResult(null);
  };

  const handleCloseResetModal = () => {
    if (resetPasswordLoadingId) return;

    setSelectedResetUser(null);
    setResetResult(null);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedResetUser) return;

    const result = await resetBusinessUserPassword(selectedResetUser.idUser);

    if (!result.success || !result.data) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setResetResult(result.data);
  };

  return (
    <>
      <Meta title="Detalle de Negocio" />
      <div className="grid gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              to="/platform/businesses"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
              Volver a negocios
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">
              {business?.name || "Detalle del negocio"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Auditoria operativa, usuarios y uso comercial del tenant.
            </p>
          </div>
          {business ? (
            <Badge variant={business.isActive ? "default" : "destructive"}>
              {business.businessStatus}
            </Badge>
          ) : null}
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Cargando detalle...
            </CardContent>
          </Card>
        ) : null}

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        ) : null}

        {business ? (
          <>
            <Card>
              <CardContent className="flex flex-wrap gap-2 p-3">
                {tabs.map((tab) => (
                  <Button
                    key={tab.key}
                    type="button"
                    variant={activeTab === tab.key ? "default" : "outline"}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {activeTab === "summary" ? (
              <section className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Perfil del negocio</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100">
                        {business.logoUrl ? (
                          <img
                            src={business.logoUrl}
                            alt={business.name}
                            className="size-14 rounded-2xl object-cover"
                          />
                        ) : (
                          <Building2 className="size-6 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{business.name}</p>
                        <p className="text-muted-foreground">{business.slug}</p>
                      </div>
                    </div>
                    <p><strong>Tipo:</strong> {business.businessType || "-"}</p>
                    <p><strong>Alta:</strong> {formatDate(business.createdAt)}</p>
                    <p><strong>Owner:</strong> {business.owner.name || "-"}</p>
                    <p><strong>Email:</strong> {business.owner.email || "-"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Suscripcion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Plan:</strong> {business.subscription.planName || "Sin plan"}</p>
                    <p><strong>Estado:</strong> {business.subscription.status || "-"}</p>
                    <p><strong>Usuarios:</strong> {business.usage.users.current}</p>
                    <p><strong>Productos:</strong> {business.usage.products.current}</p>
                    <p><strong>Depositos:</strong> {business.usage.deposits.current}</p>
                  </CardContent>
                </Card>
              </section>
            ) : null}

            {activeTab === "users" ? (
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Ultimo acceso</TableHead>
                        {canResetPasswords ? <TableHead>Acciones</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.idUser}>
                          <TableCell>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email || user.username}</div>
                          </TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={user.effectiveIsActive ? "default" : "destructive"}>
                                {user.effectiveIsActive ? "Activo" : "Inactivo"}
                              </Badge>
                              {user.mustChangePassword ? (
                                <Badge variant="outline">Debe cambiar clave</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                          {canResetPasswords ? (
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={
                                  !user.effectiveIsActive ||
                                  resetPasswordLoadingId === user.idUser
                                }
                                onClick={() => handleOpenResetModal(user)}
                              >
                                {resetPasswordLoadingId === user.idUser ? (
                                  <Spinner className="mr-2 h-4 w-4" />
                                ) : (
                                  <KeyRound className="mr-2 h-4 w-4" />
                                )}
                                Restablecer
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}

            {activeTab === "activity" && activity ? (
              <section className="grid gap-4 md:grid-cols-3">
                {[
                  ["Ultimo login", formatDate(activity.lastLoginAt)],
                  ["Ultima venta", formatDate(activity.lastSaleAt)],
                  ["Ultima compra", formatDate(activity.lastPurchaseAt)],
                  ["Movimientos 30 dias", activity.stockMovementsLast30Days],
                  ["Ventas 7 dias", activity.salesLast7Days],
                  ["Usuarios activos 30 dias", activity.activeUsersLast30Days],
                ].map(([label, value]) => (
                  <Card key={String(label)}>
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold">{value}</CardContent>
                  </Card>
                ))}
              </section>
            ) : null}

            {activeTab === "usage" && usage ? (
              <section className="grid gap-4 md:grid-cols-3">
                <UsageBar label="Usuarios" metric={usage.users} />
                <UsageBar label="Productos" metric={usage.products} />
                <UsageBar label="Depositos" metric={usage.deposits} />
              </section>
            ) : null}

            {activeTab === "sales" ? (
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Venta</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.idSale}>
                          <TableCell>{sale.saleNumber}</TableCell>
                          <TableCell>{sale.customerName}</TableCell>
                          <TableCell>{sale.userName}</TableCell>
                          <TableCell>{formatCurrency(sale.total)}</TableCell>
                          <TableCell>{formatDate(sale.saleDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}

            {activeTab === "purchases" ? (
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Compra</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((purchase) => (
                        <TableRow key={purchase.idPurchase}>
                          <TableCell>{purchase.purchaseNumber}</TableCell>
                          <TableCell>{purchase.supplierName || "-"}</TableCell>
                          <TableCell>{purchase.userName}</TableCell>
                          <TableCell>{formatCurrency(purchase.total)}</TableCell>
                          <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}

        <BusinessUserPasswordResetModal
          isOpen={Boolean(selectedResetUser)}
          user={selectedResetUser}
          result={resetResult}
          loading={Boolean(resetPasswordLoadingId)}
          onClose={handleCloseResetModal}
          onConfirm={handleConfirmResetPassword}
        />
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </>
  );
};
