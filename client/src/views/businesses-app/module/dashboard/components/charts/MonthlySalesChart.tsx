import { CalendarRange, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonthlySales } from "../../types";

type Props = {
  data: MonthlySales[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
};

type ChartDataItem = MonthlySales & {
  shortMonthName: string;
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const chartConfig = {
  totalAmount: {
    label: "Ventas",
    color: "var(--chart-2)",
  },
  salesCount: {
    label: "Operaciones",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const getVisibleData = (
  data: MonthlySales[],
  selectedYear: number,
): ChartDataItem[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const maxMonth = selectedYear === currentYear ? currentMonth : 12;

  return data
    .filter((item) => item.monthNumber <= maxMonth)
    .map((item) => ({
      ...item,
      shortMonthName: item.monthName.slice(0, 3),
    }));
};

export const MonthlySalesChart = ({
  data,
  selectedYear,
  onYearChange,
  availableYears,
}: Props) => {
  const chartData = getVisibleData(data, selectedYear);
  const yearTotal = chartData.reduce(
    (total, item) => total + item.totalAmount,
    0,
  );
  const yearSalesCount = chartData.reduce(
    (total, item) => total + item.salesCount,
    0,
  );
  const bestMonth = chartData.reduce<ChartDataItem | null>((selected, item) => {
    if (!selected || item.totalAmount > selected.totalAmount) {
      return item;
    }

    return selected;
  }, null);
  const periodLabel =
    selectedYear === new Date().getFullYear()
      ? `Enero - ${chartData.at(-1)?.monthName || "mes actual"} ${selectedYear}`
      : `Enero - Diciembre ${selectedYear}`;

  const handleYearChange = (value: string | null) => {
    if (!value) {
      return;
    }

    onYearChange(Number(value));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-50 p-2 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
            <CardTitle>Ventas mensuales</CardTitle>
            <CardDescription>
              {periodLabel}. Historico por monto facturado.
            </CardDescription>
            </div>
          </div>

        <CardAction className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Total del periodo</p>
            <p className="font-semibold">{formatMoney(yearTotal)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Operaciones</p>
            <p className="font-semibold">{formatNumber(yearSalesCount)}</p>
          </div>
          <Select
            value={String(selectedYear)}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-12 w-full min-w-36 sm:w-40">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Anio" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        {chartData.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Sin ventas para el anio seleccionado.
        </p>
      ) : (
        <div className="space-y-5">
          <ChartContainer
            config={chartConfig}
            className="h-[320px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 22, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="shortMonthName"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={86}
                tickFormatter={(value: number) => formatMoney(value)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                formatter={(value: number) => [
                  formatMoney(value),
                  "Ventas",
                ]}
                labelFormatter={(label) => {
                  const selected = chartData.find(
                    (item) => item.shortMonthName === label,
                  );

                  return selected?.monthName || label;
                }}
              />
              <Bar
                dataKey="totalAmount"
                fill="var(--color-totalAmount)"
                radius={[6, 6, 0, 0]}
              >
                <LabelList
                  position="top"
                  offset={10}
                  className="fill-foreground text-[11px]"
                  formatter={(value: number) =>
                    value > 0 ? formatMoney(value) : ""
                  }
                />
              </Bar>
            </BarChart>
          </ChartContainer>

          <ChartContainer
            config={chartConfig}
            className="h-[170px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="shortMonthName"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={36}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                formatter={(value: number) => [
                  `${formatNumber(value)} ventas`,
                  "Operaciones",
                ]}
                labelFormatter={(label) => {
                  const selected = chartData.find(
                    (item) => item.shortMonthName === label,
                  );

                  return selected?.monthName || label;
                }}
              />
              <Line
                type="monotone"
                dataKey="salesCount"
                stroke="var(--color-salesCount)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>

          {bestMonth && bestMonth.totalAmount > 0 && (
            <div className="rounded-lg border bg-emerald-50/60 px-3 py-2 text-sm text-emerald-800">
              Mejor mes del periodo:{" "}
              <span className="font-semibold">{bestMonth.monthName}</span> con{" "}
              <span className="font-semibold">
                {formatMoney(bestMonth.totalAmount)}
              </span>
              .
            </div>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  );
};
