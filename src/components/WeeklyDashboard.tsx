/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { WorkEntry, WorkDay, Product } from "../types";
import { 
  formatCurrency, 
  formatPayWeekRange, 
  getDaysOfWeekForPayWeek, 
  formatToHumanDate,
  MONTHS_ES,
  parseDateString,
  formatDateString
} from "../utils/dateHelpers";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Clock, 
  Scissors, 
  Calculator, 
  Coins, 
  FileCheck, 
  Percent,
  Edit,
  Check,
  X,
  Trash2
} from "lucide-react";

interface WeeklyDashboardProps {
  currentWeekId: string; // Wednesday ending date YYYY-MM-DD
  selectedDateStr: string; // The selected day date YYYY-MM-DD
  allEntries: WorkEntry[];
  products: Product[];
  onSelectWeek: (weekId: string) => void;
  onSelectDay: (dateStr: string) => void;
  onUpdateEntry?: (entryId: string, newQuantity: number) => void;
  onDeleteEntry?: (entryId: string) => void;
}

export default function WeeklyDashboard({
  currentWeekId,
  selectedDateStr,
  allEntries,
  products,
  onSelectWeek,
  onSelectDay,
  onUpdateEntry,
  onDeleteEntry,
}: WeeklyDashboardProps) {
  
  // Calculate the 7 days of the currently selected week (Thursday through Wednesday)
  const daysOfWeek = useMemo(() => {
    return getDaysOfWeekForPayWeek(currentWeekId);
  }, [currentWeekId]);

  const [viewMode, setViewMode] = useState<"grouped" | "detailed">("grouped");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>("");

  const handleStartEdit = (entry: WorkEntry) => {
    setEditingEntryId(entry.id);
    setEditingQuantity(entry.quantity.toString());
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingQuantity("");
  };

  const handleSaveEdit = (entryId: string) => {
    const qty = parseFloat(editingQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Por favor ingrese una cantidad válida mayor a 0.");
      return;
    }
    if (onUpdateEntry) {
      onUpdateEntry(entryId, qty);
    }
    setEditingEntryId(null);
    setEditingQuantity("");
  };

  // Entries that belong to the active week
  const weekEntries = useMemo(() => {
    const datesSet = new Set(daysOfWeek.map(d => d.date));
    return allEntries.filter(entry => datesSet.has(entry.date));
  }, [allEntries, daysOfWeek]);

  // Map of date -> list of entries
  const entriesByDateMap = useMemo(() => {
    const map: Record<string, WorkEntry[]> = {};
    daysOfWeek.forEach(d => {
      map[d.date] = [];
    });
    weekEntries.forEach(entry => {
      if (map[entry.date]) {
        map[entry.date].push(entry);
      }
    });
    return map;
  }, [daysOfWeek, weekEntries]);

  // Total gross for each of the 7 days
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    daysOfWeek.forEach(d => {
      const entries = entriesByDateMap[d.date] || [];
      totals[d.date] = entries.reduce((sum, entry) => sum + entry.total, 0);
    });
    return totals;
  }, [daysOfWeek, entriesByDateMap]);

  // Weekly aggregates
  const totalGross = useMemo(() => {
    return (Object.values(dailyTotals) as number[]).reduce((sum, val) => sum + val, 0);
  }, [dailyTotals]);

  const deduction = useMemo(() => {
    return totalGross * 0.19;
  }, [totalGross]);

  const totalNet = useMemo(() => {
    return totalGross - deduction;
  }, [totalGross, deduction]);

  // Aggregated products table for the week
  const productAggregates = useMemo(() => {
    const agg: Record<string, { quantity: number; total: number; price: number; name: string }> = {};
    weekEntries.forEach(entry => {
      const p = products.find(prod => prod.id === entry.productId) || { name: entry.productId, price: entry.rate };
      if (!agg[entry.productId]) {
        agg[entry.productId] = {
          quantity: 0,
          total: 0,
          price: entry.rate,
          name: p.name
        };
      }
      agg[entry.productId].quantity += entry.quantity;
      agg[entry.productId].total += entry.total;
    });
    return Object.values(agg).sort((a, b) => b.total - a.total);
  }, [weekEntries]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const currentEnd = parseDateString(currentWeekId);
    currentEnd.setDate(currentEnd.getDate() - 7);
    const prevWeekId = formatDateString(currentEnd);
    onSelectWeek(prevWeekId);
    
    // Select the first day (Thursday) of that week
    const firstDay = new Date(currentEnd);
    firstDay.setDate(currentEnd.getDate() - 6);
    onSelectDay(formatDateString(firstDay));
  };

  const handleNextWeek = () => {
    const currentEnd = parseDateString(currentWeekId);
    currentEnd.setDate(currentEnd.getDate() + 7);
    const nextWeekId = formatDateString(currentEnd);
    onSelectWeek(nextWeekId);

    // Select the first day (Thursday) of that week
    const firstDay = new Date(currentEnd);
    firstDay.setDate(currentEnd.getDate() - 6);
    onSelectDay(formatDateString(firstDay));
  };

  return (
    <div className="space-y-6">
      {/* Week Selector Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100 gap-4" id="week-selector-card">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="font-semibold text-slate-800 text-sm md:text-base">
              Semana Seleccionada: <span className="text-emerald-700">{formatPayWeekRange(currentWeekId)}</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Cierre de ciclo el Miércoles {formatToHumanDate(currentWeekId, false)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={handlePrevWeek}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-colors"
            id="btn-prev-week"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Semana Anterior</span>
          </button>
          
          <button
            onClick={handleNextWeek}
            className="flex items-center justify-center space-x-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-colors"
            id="btn-next-week"
          >
            <span>Semana Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="week-financials">
        {/* Card Gross */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ingresos Brutos
            </span>
            <div className="bg-slate-50 p-2 rounded-xl text-slate-500 border border-slate-100">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight" id="gross-sum-val">
              {formatCurrency(totalGross)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Antes de retenciones e impuestos
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 -z-10 opacity-30" />
        </div>

        {/* Card Deduction */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center">
              Descuento Semanal (19%)
            </span>
            <div className="bg-rose-50 p-2 rounded-xl text-rose-500 border border-rose-100">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight" id="tax-sum-val">
              -{formatCurrency(deduction)}
            </h3>
            <p className="text-[10px] text-rose-500 mt-1 font-medium">
              19% obligatorio deducido automáticamente
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 -z-10 opacity-30" />
        </div>

        {/* Card Net Liquid */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl border border-emerald-500/20 shadow-sm p-5 relative overflow-hidden text-white flex flex-col justify-between h-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Pago Neto Recibido
            </span>
            <div className="bg-emerald-500/30 p-2 rounded-xl text-emerald-100 border border-emerald-400/20 shadow-inner">
              <FileCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2.5xl sm:text-3xl font-black tracking-tight" id="net-sum-val">
              {formatCurrency(totalNet)}
            </h3>
            <p className="text-[10px] text-emerald-150 mt-1 font-semibold">
              Monto final líquido que recibirás
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-36 h-36 bg-emerald-500 rounded-full -mr-12 -mb-12 -z-10 opacity-10" />
        </div>
      </div>

      {/* 7-Day Week Strip */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
          Días de la Semana de Trabajo
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5" id="days-strip">
          {daysOfWeek.map((day) => {
            const isSelected = day.date === selectedDateStr;
            const gross = dailyTotals[day.date] || 0;
            const entriesCount = entriesByDateMap[day.date]?.length || 0;
            
            // Highlight color based on has work or selected
            const styleClass = isSelected
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : gross > 0
              ? "bg-emerald-50/75 border-emerald-100 text-slate-800 hover:bg-emerald-100/50"
              : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50";

            return (
              <button
                key={day.date}
                onClick={() => onSelectDay(day.date)}
                className={`flex flex-col items-center justify-between p-3.5 rounded-xl border text-center transition-all h-[105px] cursor-pointer ${styleClass}`}
                id={`day-strip-btn-${day.date}`}
              >
                <div>
                  <p className={`text-xs font-bold tracking-tight ${isSelected ? "text-white" : "text-slate-800"}`}>
                    {day.dayName}
                  </p>
                  <p className={`text-[10px] font-medium mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                    {day.date.split('-')[2]}/{MONTHS_ES[parseInt(day.date.split('-')[1]) - 1].substring(0,3)}
                  </p>
                </div>

                <div className="w-full mt-2">
                  <p className={`text-xs font-extrabold ${isSelected ? "text-white" : gross > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                    {gross > 0 ? formatCurrency(gross) : "$0"}
                  </p>
                  {entriesCount > 0 && (
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-1 ${
                      isSelected ? "bg-emerald-700 text-emerald-100" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {entriesCount} reg.
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Week aggregated products list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5" id="week-aggregated-table">
        <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-semibold text-slate-800 text-sm flex items-center">
            <ShoppingBag className="h-4 w-4 mr-2 text-emerald-600" />
            Resumen de Cosechas en la Semana
          </h3>
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600 self-start sm:self-auto">
            <button
              onClick={() => {
                setViewMode("grouped");
                handleCancelEdit();
              }}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "grouped"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="view-mode-grouped-btn"
            >
              Agrupado por Producto
            </button>
            <button
              onClick={() => setViewMode("detailed")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === "detailed"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              id="view-mode-detailed-btn"
            >
              Ver Todos los Registros ({weekEntries.length})
            </button>
          </div>
        </div>

        {weekEntries.length > 0 ? (
          viewMode === "grouped" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5">Producto</th>
                    <th className="py-2.5 text-center">Unidad de Pago</th>
                    <th className="py-2.5 text-center">Cantidad Total</th>
                    <th className="py-2.5 text-right">Monto Bruto</th>
                    <th className="py-2.5 text-right text-rose-500">Impuesto (19%)</th>
                    <th className="py-2.5 text-right text-emerald-750">Pago Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {productAggregates.map((item) => {
                    const itemDeduction = item.total * 0.19;
                    const itemNet = item.total - itemDeduction;
                    return (
                      <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-3 text-center text-slate-400 font-mono">{formatCurrency(item.price)}</td>
                        <td className="py-3 text-center font-bold text-slate-800">{item.quantity} un.</td>
                        <td className="py-3 text-right font-bold text-slate-700">{formatCurrency(item.total)}</td>
                        <td className="py-3 text-right text-rose-600 font-mono">-{formatCurrency(itemDeduction)}</td>
                        <td className="py-3 text-right text-emerald-700 font-bold">{formatCurrency(itemNet)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5">Día / Fecha</th>
                    <th className="py-2.5">Producto</th>
                    <th className="py-2.5 text-center">Precio Unitario</th>
                    <th className="py-2.5 text-center">Cantidad</th>
                    <th className="py-2.5 text-right">Monto Bruto</th>
                    <th className="py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {weekEntries.map((entry) => {
                    const product = products.find(p => p.id === entry.productId) || {
                      name: "Producto Desconocido",
                      price: entry.rate
                    };
                    const isEditing = editingEntryId === entry.id;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 text-slate-800 font-semibold">
                          {formatToHumanDate(entry.date, false)}
                        </td>
                        <td className="py-3 text-slate-700">{product.name}</td>
                        <td className="py-3 text-center text-slate-400 font-mono">{formatCurrency(entry.rate)}</td>
                        <td className="py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={editingQuantity}
                                onChange={(e) => setEditingQuantity(e.target.value)}
                                className="w-20 px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700 text-center"
                                id={`weekly-edit-qty-${entry.id}`}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className="font-bold text-slate-800">{entry.quantity} un.</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-700">
                          {isEditing ? (
                            formatCurrency((parseFloat(editingQuantity) || 0) * entry.rate)
                          ) : (
                            formatCurrency(entry.total)
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleSaveEdit(entry.id)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-100"
                                title="Guardar cambios"
                                id={`weekly-btn-save-${entry.id}`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors border border-slate-200"
                                title="Cancelar"
                                id={`weekly-btn-cancel-${entry.id}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleStartEdit(entry)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors border border-slate-200"
                                title="Editar cantidad"
                                id={`weekly-btn-edit-${entry.id}`}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              {onDeleteEntry && (
                                <button
                                  onClick={() => onDeleteEntry(entry.id)}
                                  className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors border border-rose-100"
                                  title="Eliminar registro"
                                  id={`weekly-btn-del-${entry.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold">
            No se han registrado trabajos en este período. Selecciona un día arriba y agrégalos en el formulario.
          </div>
        )}
      </div>
    </div>
  );
}
