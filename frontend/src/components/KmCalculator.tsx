import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Fuel,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardTitle, CardValue } from "@/components/Card";
import { Toast } from "@/components/Toast";
import { leisureKmApi } from "@/services/leisureKm";
import { parseBrl } from "@/utils/format";
import type { LeisureKmResponse } from "@/types/finance";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

interface KmCalculatorProps {
  leisureId: string;
}

export function KmCalculator({ leisureId }: KmCalculatorProps) {
  const [kmData, setKmData] = useState<LeisureKmResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [consumption, setConsumption] = useState("");
  const [tolls, setTolls] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [numPeople, setNumPeople] = useState("1");

  const parsedDistance = useMemo(() => parseBrl(distance), [distance]);
  const parsedFuelPrice = useMemo(() => parseBrl(fuelPrice), [fuelPrice]);
  const parsedConsumption = useMemo(() => parseBrl(consumption), [consumption]);
  const parsedTolls = useMemo(() => parseBrl(tolls || "0"), [tolls]);
  const parsedPeople = useMemo(() => {
    const n = parseInt(numPeople, 10);
    return isFinite(n) && n > 0 ? n : 1;
  }, [numPeople]);

  const hasError =
    distance.length > 0 && !isFinite(parsedDistance) ||
    fuelPrice.length > 0 && !isFinite(parsedFuelPrice) ||
    consumption.length > 0 && !isFinite(parsedConsumption) ||
    tolls.length > 0 && !isFinite(parsedTolls);

  const fuelCost = useMemo(() => {
    if (!isFinite(parsedDistance) || !isFinite(parsedFuelPrice) || !isFinite(parsedConsumption)) return null;
    if (parsedDistance <= 0 || parsedFuelPrice <= 0 || parsedConsumption <= 0) return null;
    return parsedDistance / parsedConsumption * parsedFuelPrice;
  }, [parsedDistance, parsedFuelPrice, parsedConsumption]);

  const totalCost = useMemo(() => {
    if (fuelCost === null) return null;
    return fuelCost + (isFinite(parsedTolls) ? parsedTolls : 0);
  }, [fuelCost, parsedTolls]);

  const costPerPerson = useMemo(() => {
    if (totalCost === null) return null;
    return totalCost / parsedPeople;
  }, [totalCost, parsedPeople]);

  const litersNeeded = useMemo(() => {
    if (!isFinite(parsedDistance) || !isFinite(parsedConsumption)) return null;
    if (parsedConsumption <= 0) return null;
    return parsedDistance / parsedConsumption;
  }, [parsedDistance, parsedConsumption]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leisureKmApi.get(leisureId);
      setKmData(data);
      if (data) {
        const dotToComma = (v: string) => v.replace(".", ",");
        setOrigin(data.origin);
        setDestination(data.destination);
        setDistance(dotToComma(data.distance_km));
        setFuelPrice(dotToComma(data.fuel_price));
        setConsumption(dotToComma(data.car_consumption));
        setTolls(data.tolls === "0" ? "" : dotToComma(data.tolls));
        setEstimatedTime(data.estimated_time ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar cálculo");
    } finally {
      setLoading(false);
    }
  }, [leisureId]);

  useEffect(() => {
    load();
  }, [load]);

  const canCalculate = isFinite(parsedDistance) && parsedDistance > 0
    && isFinite(parsedFuelPrice) && parsedFuelPrice > 0
    && isFinite(parsedConsumption) && parsedConsumption > 0;

  const handleSave = async () => {
    if (!canCalculate) return;

    setSaving(true);
    try {
      const data = await leisureKmApi.upsert(leisureId, {
        origin: origin.trim(),
        destination: destination.trim(),
        distance_km: parsedDistance,
        fuel_price: parsedFuelPrice,
        car_consumption: parsedConsumption,
        tolls: isFinite(parsedTolls) ? parsedTolls : 0,
        estimated_time: estimatedTime.trim() || null,
      });
      setKmData(data);
      setToast({ message: "Cálculo salvo com sucesso!", variant: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Erro ao salvar",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await leisureKmApi.delete(leisureId);
      setKmData(null);
      setOrigin("");
      setDestination("");
      setDistance("");
      setFuelPrice("");
      setConsumption("");
      setTolls("");
      setEstimatedTime("");
      setToast({ message: "Cálculo removido", variant: "success" });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Erro ao remover",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle size={24} className="text-rose-500" />
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
          <button
            onClick={load}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Trajeto
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Origem
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Cidade de partida"
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Destino
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Cidade de destino"
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
              Parâmetros do veículo
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Distância (km)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="Ex: 350"
                  autoComplete="off"
                  className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                    distance.length > 0 && !isFinite(parsedDistance)
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-700"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Consumo (km/L)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  placeholder="Ex: 12,5"
                  autoComplete="off"
                  className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                    consumption.length > 0 && !isFinite(parsedConsumption)
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-700"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Preço gasolina (R$/L)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  placeholder="Ex: 6,19"
                  autoComplete="off"
                  className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                    fuelPrice.length > 0 && !isFinite(parsedFuelPrice)
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-700"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Pedágio (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={tolls}
                  onChange={(e) => setTolls(e.target.value)}
                  placeholder="0,00"
                  autoComplete="off"
                  className={`mt-1 w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
                    tolls.length > 0 && !isFinite(parsedTolls)
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500 dark:border-rose-700"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tempo estimado
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="Ex: 3h30"
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  N° de pessoas
                </label>
                <input
                  type="number"
                  min="1"
                  value={numPeople}
                  onChange={(e) => setNumPeople(e.target.value)}
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>
            </div>

            {hasError && (
              <p className="mt-3 text-xs text-rose-500">
                Use números e vírgula para valores decimais (ex: 1500,50)
              </p>
            )}
          </Card>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!canCalculate || saving}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Salvando..." : kmData ? "Atualizar cálculo" : "Calcular"}
            </button>
            {kmData && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-rose-200 px-5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Remover
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {totalCost !== null && canCalculate ? (
            <>
              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Custo combustível</CardTitle>
                    <CardValue className="text-amber-600 dark:text-amber-400">
                      {brl(fuelCost!)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                    <Fuel size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Custo total</CardTitle>
                    <CardValue className="text-violet-600 dark:text-violet-400">
                      {brl(totalCost)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
                    <Route size={18} className="text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Custo por pessoa</CardTitle>
                    <CardValue className="text-emerald-600 dark:text-emerald-400">
                      {brl(costPerPerson!)}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                    <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <div className="relative flex items-start justify-between">
                  <div>
                    <CardTitle>Litros necessários</CardTitle>
                    <CardValue className="text-sky-600 dark:text-sky-400">
                      {litersNeeded !== null
                        ? `${litersNeeded.toFixed(1).replace(".", ",")} L`
                        : "—"}
                    </CardValue>
                  </div>
                  <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
                    <Gauge size={18} className="text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
              </Card>

              {origin && destination && (
                <Card>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin size={16} className="shrink-0" />
                    <span>
                      {origin} → {destination}
                      {estimatedTime && ` · ${estimatedTime}`}
                    </span>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Route size={28} className="text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Preencha os dados ao lado para ver os custos
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Toast
        open={toast !== null}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
