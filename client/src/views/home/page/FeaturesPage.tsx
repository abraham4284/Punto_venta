import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  Boxes,
  Calculator,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gauge,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";

import { BrandLogo } from "@/components/brand";
import { Meta } from "@/components/Meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicFooter } from "../components/footer/PublicFooter";
import {
  FeatureSectionBlock,
  type FeatureSection,
} from "../components/features-page/FeatureSectionBlock";
import { PublicNavbar } from "../components/navbar/PublicNavbar";

const overviewCards = [
  {
    title: "Operación diaria",
    description:
      "Vendé, cobrá, gestioná entregas y mantené la caja alineada con lo que sucede en el negocio.",
    icon: ShoppingCart,
  },
  {
    title: "Gestión comercial",
    description:
      "Administrá productos, clientes, proveedores, compras e inventario sin perder trazabilidad.",
    icon: Store,
  },
  {
    title: "Administración",
    description:
      "Organizá usuarios, permisos, depósitos, métodos de pago, suscripción y alertas.",
    icon: ShieldCheck,
  },
];

const quickCapabilities = [
  "Ventas y cobros",
  "Stock multi-depósito",
  "Compras",
  "Caja",
  "Delivery",
  "Rendiciones",
  "Clientes",
  "Proveedores",
  "Usuarios y permisos",
  "Dashboard",
  "Alertas",
  "Productos y catálogo",
];

const quickNav = [
  ["Ventas", "#ventas"],
  ["Inventario", "#inventario"],
  ["Compras", "#compras"],
  ["Caja", "#caja"],
  ["Delivery", "#delivery"],
  ["Equipo", "#equipo"],
  ["Control", "#control"],
  ["Crecimiento", "#crecimiento"],
];

const featureSections: FeatureSection[] = [
  {
    id: "ventas",
    eyebrow: "Operación",
    title: "Vendé rápido y cobrá como necesitás",
    description:
      "El punto de venta está pensado para trabajar con velocidad, control de stock y distintas formas de cobro.",
    items: [
      {
        title: "Ventas ágiles",
        description:
          "Una pantalla de venta centraliza productos, cliente, depósito, descuentos, pagos y entrega.",
        icon: ShoppingCart,
        items: [
          "Búsqueda por nombre y lectura de código de barras.",
          "Precio de venta o precio mayorista según la operación.",
          "Descuentos por producto y descuento global.",
          "Control de stock antes de confirmar la venta.",
          "Atajos de teclado para agilizar la operación.",
        ],
      },
      {
        title: "Cobros flexibles",
        description:
          "Podés combinar varios métodos de pago en una misma venta y controlar que el total quede correctamente cubierto.",
        icon: WalletCards,
        items: ["Pagos confirmados o pendientes."],
      },
      {
        title: "Ticket e historial",
        description:
          "Cada venta queda registrada con detalle y puede consultarse, anularse de forma controlada y generar un ticket de venta imprimible.",
        icon: ReceiptText,
      },
      {
        title: "Seguimiento del cobro",
        description:
          "Identificá rápidamente si una venta está no pagada, parcialmente pagada o pagada.",
        icon: CreditCard,
        items: [
          "No pagado · UNPAID",
          "Parcial · PARTIALLY PAID",
          "Pagado · PAID",
        ],
      },
    ],
  },
  {
    id: "inventario",
    eyebrow: "Gestión",
    title: "Productos e inventario bajo control",
    description:
      "Desde la carga inicial hasta la reposición, Cajora conecta productos, depósitos, precios y movimientos de stock.",
    items: [
      {
        title: "Productos completos",
        description:
          "Administrá la información comercial de cada producto desde un solo lugar.",
        icon: PackageSearch,
        items: [
          "Precio de costo, venta y mayorista.",
          "Categorías, imagen principal y galería.",
          "Contenido detallado y especificaciones.",
          "Modalidad Stock o Por encargo.",
          "Unidades: unidad, kg, gramo, litro o metro.",
        ],
      },
      {
        title: "Carga masiva por Excel",
        description:
          "Importá productos de forma masiva para acelerar la puesta en marcha y las actualizaciones de catálogo.",
        icon: FileSpreadsheet,
        items: ["Vista previa antes de confirmar.", "Validación de datos y precios."],
      },
      {
        title: "Stock por depósito",
        description:
          "Controlá existencias por depósito y visualizá qué producto está disponible en cada ubicación.",
        icon: Boxes,
        items: [
          "Ajustes manuales con trazabilidad.",
          "Transferencias entre depósitos.",
          "Historial de movimientos.",
          "Balance actual de inventario.",
        ],
      },
      {
        title: "Reposición inteligente",
        description:
          "Detectá productos sin stock, bajo mínimo o justo en el mínimo y prepará la reposición antes de quedarte sin mercadería.",
        icon: AlertTriangle,
        items: [
          "Reporte de stock crítico.",
          "Cálculo de faltante contra stock mínimo.",
        ],
      },
    ],
  },
  {
    id: "compras",
    eyebrow: "Gestión",
    title: "Compras y proveedores conectados al stock",
    description:
      "Cada compra puede actualizar inventario y quedar asociada al proveedor, depósito y usuario que realizó la operación.",
    items: [
      {
        title: "Compras",
        description:
          "Registrá ingresos de mercadería con productos, cantidades, costos, descuentos y depósito de destino.",
        icon: ShoppingBag,
        items: [
          "Historial completo de compras.",
          "Detalle de cada operación.",
          "Anulación controlada.",
          "Actualización de stock y movimientos asociados.",
        ],
      },
      {
        title: "Proveedores",
        description:
          "Centralizá los datos de tus proveedores y mantené la información comercial disponible para nuevas compras.",
        icon: Landmark,
        items: ["Alta y edición.", "Búsqueda y gestión de estado."],
      },
      {
        title: "Clientes",
        description:
          "Guardá clientes para asociarlos a ventas, entregas y seguimiento de operaciones.",
        icon: Users,
        items: ["Datos de contacto y dirección.", "Estado activo/inactivo."],
      },
    ],
    callout: {
      title: "Menos doble carga, más trazabilidad",
      description:
        "Ventas, compras y movimientos de stock comparten la misma información de productos y depósitos. Esto reduce tareas repetidas y facilita reconstruir qué pasó en cada operación.",
    },
  },
  {
    id: "caja",
    eyebrow: "Administración",
    title: "Caja y dinero con seguimiento de cada turno",
    description:
      "Cajora vincula la venta con una caja abierta y permite controlar entradas, salidas y diferencias al cierre.",
    items: [
      {
        title: "Caja actual",
        description:
          "Abrí y cerrá turnos de caja con información clara de lo esperado y lo registrado.",
        icon: Calculator,
        items: [
          "Monto de apertura.",
          "Efectivo esperado.",
          "Total vendido durante el turno.",
          "Ingresos y egresos manuales.",
          "Cierre con monto contado y diferencia.",
        ],
      },
      {
        title: "Métodos de pago",
        description:
          "Configurá las formas de cobro reales del negocio y definí cuáles impactan en efectivo.",
        icon: CreditCard,
        items: [
          "Efectivo, transferencia, tarjeta u otros.",
          "Método predeterminado.",
          "Activos e inactivos.",
          "Resumen por método dentro de la caja.",
        ],
      },
      {
        title: "Historial y auditoría",
        description:
          "Consultá sesiones anteriores de caja y revisá movimientos, ventas y diferencias para entender cómo cerró cada turno.",
        icon: ClipboardList,
        items: ["Filtros por fecha, estado y caja.", "Detalle de cada sesión."],
      },
    ],
  },
  {
    id: "delivery",
    eyebrow: "Operación",
    title: "Delivery, cobranzas y rendiciones de efectivo",
    description:
      "La entrega deja de ser un proceso separado: Cajora la conecta con la venta, el cobro y la caja.",
    items: [
      {
        title: "Gestión de entregas",
        description:
          "Asigná pedidos y seguí el estado operativo de cada entrega.",
        icon: Truck,
        items: [
          "Pendiente, asignada y en reparto.",
          "Entregada, fallida, reprogramada o cancelada.",
          "Dirección, contacto y referencia.",
          "Asignación a usuarios de delivery.",
          "Historial de eventos por entrega.",
        ],
      },
      {
        title: "Cobros en entrega",
        description:
          "Una venta puede dejar pagos pendientes para ser cobrados durante la entrega y seguir su estado hasta la confirmación.",
        icon: Banknote,
        items: [
          "Pendiente, cobrado, confirmado o cancelado.",
          "Historial de eventos del pago.",
          "Saldo restante visible en la venta.",
        ],
      },
      {
        title: "Rendiciones de efectivo",
        description:
          "El dinero cobrado por cadetes puede rendirse en forma controlada a una caja abierta, seleccionando exactamente qué cobros se entregan.",
        icon: Scale,
        items: [
          "Pendientes por cobrador.",
          "Total a rendir.",
          "Historial de liquidaciones.",
        ],
      },
    ],
  },
  {
    id: "equipo",
    eyebrow: "Equipo",
    title: "Usuarios, roles y permisos sin compartir cuentas",
    description:
      "Cada persona puede tener su propio acceso y ver únicamente las funciones que necesita para trabajar.",
    items: [
      {
        title: "Usuarios del negocio",
        description: "Creá usuarios operativos y administrá su ciclo de acceso.",
        icon: UserCheck,
        items: [
          "Alta y edición de usuarios.",
          "Activar o desactivar accesos.",
          "Contraseñas temporales.",
          "Cambio de rol.",
        ],
      },
      {
        title: "Permisos granulares",
        description:
          "Definí permisos por área y por acción para que cada rol tenga el nivel de acceso adecuado.",
        icon: KeyRound,
        items: [
          "Ventas, stock, compras, caja y delivery.",
          "Administración de usuarios.",
          "Accesos de solo lectura o gestión.",
        ],
      },
      {
        title: "Seguridad por negocio",
        description:
          "La información se opera dentro del contexto de cada negocio y las funciones sensibles requieren autenticación y permisos.",
        icon: LockKeyhole,
        items: ["Sesiones de usuario.", "Accesos separados por contexto."],
      },
      {
        title: "Legal y evidencia",
        description:
          "Los términos y la política de privacidad pueden consultarse desde el sistema con registro de aceptación o reconocimiento.",
        icon: FileText,
      },
    ],
  },
  {
    id: "control",
    eyebrow: "Control",
    title: "Dashboard, alertas y acceso rápido a la información",
    description:
      "Cajora convierte los movimientos diarios en indicadores que ayudan a detectar problemas y decidir más rápido.",
    items: [
      {
        title: "Dashboard operativo",
        description:
          "Visualizá métricas clave sin tener que armar reportes manuales.",
        icon: LayoutDashboard,
        items: [
          "Ventas y compras de hoy y del mes.",
          "Ticket y compra promedio.",
          "Productos activos y stock crítico.",
          "Valor del inventario a costo.",
          "Top de productos y ventas por método de pago.",
          "Ventas recientes y evolución mensual.",
        ],
      },
      {
        title: "Notificaciones internas",
        description:
          "Recibí alertas operativas y administrativas dentro del panel.",
        icon: Bell,
        items: [
          "Stock crítico o sin stock.",
          "Diferencias al cerrar caja.",
          "Usuarios y contraseñas temporales.",
          "Estado de suscripción.",
        ],
      },
      {
        title: "Consulta rápida con F8",
        description:
          "Desde cualquier parte del panel, F8 abre un buscador por nombre o código de barras con precio de venta, stock y estado del producto.",
        icon: Search,
      },
    ],
  },
  {
    id: "crecimiento",
    eyebrow: "Crecimiento",
    title: "Preparado para acompañar la evolución del negocio",
    description:
      "La base de Cajora permite organizar la operación actual y extender la experiencia comercial sin duplicar información.",
    items: [
      {
        title: "Catálogo web preparado",
        description:
          "Cajora ya administra la información necesaria para publicar productos en una experiencia web conectada.",
        icon: PackageCheck,
        items: [
          "URLs amigables por producto y categoría.",
          "Galería e información detallada.",
          "Producto con stock o por encargo.",
          "Disponibilidad basada en el depósito principal.",
        ],
      },
      {
        title: "Configuración del negocio",
        description: "Adaptá la operación a la estructura real del comercio.",
        icon: Settings,
        items: [
          "Datos del negocio.",
          "Múltiples depósitos.",
          "Métodos de pago.",
          "Categorías y unidades.",
          "Plan y límites de uso visibles.",
        ],
      },
    ],
  },
];

const metricLabels = [
  "Ventas del día",
  "Acumulado mensual",
  "Alertas críticas",
  "Promedio de venta",
];

const flowSteps = [
  "Venta",
  "Stock",
  "Cobro",
  "Caja",
  "Delivery",
  "Rendición",
  "Dashboard",
];

export const FeaturesPage = () => {
  return (
    <>
      <Meta title="Funcionalidades" />
      <div className="min-h-screen bg-background text-foreground">
        <PublicNavbar />

        <main>
          <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(22,163,106,0.15),transparent_34%),linear-gradient(180deg,#ffffff_0%,#f7f9fa_100%)] py-20">
            <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
              <div className="space-y-7">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Funcionalidades
                </Badge>
                <div className="space-y-5">
                  <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                    Todo tu negocio, en un solo lugar
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                    Cajora reúne la operación, la gestión y el control
                    administrativo en una sola plataforma web.
                  </p>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                    Ventas, stock, compras, caja, delivery y equipo conectados
                    para trabajar con más orden, control y trazabilidad.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" render={<Link to="/register" />}>
                    Registrar mi comercio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" render={<Link to="/" />}>
                    Volver al inicio
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl" />
                <Card className="relative border-slate-200 bg-white shadow-2xl">
                  <CardContent className="space-y-5 p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <BrandLogo imageClassName="h-8" />
                      <Badge variant="secondary">Panel comercial</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {quickCapabilities.slice(0, 8).map((item) => (
                        <div
                          key={item}
                          className="rounded-xl border bg-slate-50 p-4 text-sm font-medium"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                      <p className="text-sm font-semibold">
                        Ideal para comercios que venden productos
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Kioscos, almacenes, minimercados, perfumerías,
                        tecnología, ferreterías, distribuidoras y otros
                        negocios que necesitan controlar venta, stock y dinero.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="bg-white py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-5 md:grid-cols-3">
                {overviewCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <Card key={card.title} className="border-slate-200 bg-white">
                      <CardContent className="flex h-full flex-col gap-5 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-xl font-semibold">
                            {card.title}
                          </h2>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {card.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-slate-50 py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl space-y-4">
                <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                  Cajora en una mirada
                </p>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Capacidades conectadas para operar con claridad
                </h2>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickCapabilities.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border bg-white p-6">
                <p className="font-semibold">
                  Ideal para comercios que venden productos
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Kioscos, almacenes, minimercados, perfumerías, tecnología,
                  ferreterías, distribuidoras y otros negocios que necesitan
                  controlar venta, stock y dinero.
                </p>
              </div>

              <nav
                aria-label="Navegación de funcionalidades"
                className="mt-8 flex flex-wrap gap-2"
              >
                {quickNav.map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </section>

          {featureSections.map((section, index) => (
            <FeatureSectionBlock
              key={section.id}
              section={section}
              tone={index % 2 === 0 ? "white" : "muted"}
            />
          ))}

          <section className="bg-white py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                    Por qué Cajora
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Una operación conectada de punta a punta
                  </h2>
                  <p className="text-base leading-7 text-muted-foreground">
                    La venta impacta en stock. Los cobros se conectan con caja.
                    Las entregas pueden registrar cobranzas. Las rendiciones
                    vuelven a caja. Y el dashboard resume la actividad para que
                    el negocio tenga una única versión de lo que está pasando.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {metricLabels.map((label) => (
                    <div
                      key={label}
                      className="rounded-2xl border bg-slate-50 p-5"
                    >
                      <Gauge className="h-5 w-5 text-primary" aria-hidden="true" />
                      <p className="mt-4 text-sm font-semibold">{label}</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Indicador operativo disponible desde el panel.
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 rounded-3xl border bg-slate-950 p-6 text-white">
                <div className="flex flex-wrap items-center gap-3">
                  {flowSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
                        {step}
                      </span>
                      {index < flowSteps.length - 1 && (
                        <ArrowRight
                          className="h-4 w-4 text-white/50"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-950 py-20 text-white">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
              <Badge className="bg-white/10 text-white">Cajora</Badge>
              <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Gestión comercial para trabajar con más orden, control y
                trazabilidad.
              </h2>
              <p className="mt-4 max-w-2xl text-white/70">
                Conocé cómo Cajora puede adaptarse a la operación de tu negocio.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" render={<Link to="/register" />}>
                  Registrar mi comercio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  render={<Link to="/login" />}
                >
                  Ya tengo cuenta
                </Button>
              </div>
              <p className="mt-8 max-w-2xl text-xs leading-5 text-white/50">
                La disponibilidad de algunas funciones puede variar según plan,
                permisos, configuración e integraciones contratadas.
              </p>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </>
  );
};
