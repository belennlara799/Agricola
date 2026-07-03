/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { WorkEntry, FilterState } from "../types";
import { PRODUCT_CATALOG } from "../data/products";
import { 
  formatCurrency, 
  formatPayWeekRange, 
  getPayWeekEndingDate, 
  getPayWeekStartDate, 
  parseDateString, 
  MONTHS_ES 
} from "../utils/dateHelpers";
import { 
  BarChart2, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  ArrowRight, 
  Trophy, 
  Sparkles,
  Percent,
  Calculator
} from "lucide-react";

interface HistoryDashboardProps {
  allEntries: WorkEntry[];
  currentWeekId: string;
  onSelectWeek: (weekId: string) => void;
  onSetTab: (tab: "registro" | "comparativa") => void;
}

export default function HistoryDashboard({
  allEntries,
  currentWeekId,
  onSelectWeek,
  onSetTab,
}: HistoryDashboardProps) {
  
  // 1. Group all entries by pay week (Wednesday end date)
  const weeksDataMap = useMemo(() => {
    const map: Record<string, { weekId: string; totalGross: number; entriesCount: number }> = {};
    
    allEntries.forEach(entry => {
      const weekId = getPayWeekEndingDate(entry.date);
      if (!map[weekId]) {
        map[weekId] = {
          weekId,
          totalGross: 0,
          entriesCount: 0
        };
      }
      map[weekId].totalGross += entry.total;
      map[weekId].entriesCount += 1;
    });

    return map;
  }, [allEntries]);

  // Convert to an array of weeks with complete financial data
  const allWeeks = useMemo(() => {
    return (Object.values(weeksDataMap) as { weekId: string; totalGross: number; entriesCount: number }[])
      .map(w => {
        const gross = w.totalGross;
        const ded = gross * 0.19;
        const net = gross - ded;
        const start = getPayWeekStartDate(w.weekId);
        
        // Parse end date to extract Year and Month index
        const endDateObj = parseDateString(w.weekId);
        const year = endDateObj.getFullYear().toString();
        const monthIndex = endDateObj.getMonth().toString(); // "0" = Enero

        return {
          weekId: w.weekId,
          startDate: start,
          totalGross: gross,
          deduction: ded,
          totalNet: net,
          entriesCount: w.entriesCount,
          year,
          monthIndex,
          rangeLabel: formatPayWeekRange(w.weekId)
        };
      })
      .sort((a, b) => b.weekId.localeCompare(a.weekId)); // Newest first
  }, [weeksDataMap]);

  // 2. State for filters
  const [filter, setFilter] = useState<FilterState>({
    year: "all",
    month: "all",
    week: "all"
  });

  // Selected bar for details in the interactive chart
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);

  // Get available years for filtering
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allWeeks.forEach(w => years.add(w.year));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allWeeks]);

  // Filter weeks based on selected Year & Month
  const filteredWeeksForWeekFilter = useMemo(() => {
    return allWeeks.filter(w => {
      const matchesYear = filter.year === "all" || w.year === filter.year;
      const matchesMonth = filter.month === "all" || w.monthIndex === filter.month;
      return matchesYear && matchesMonth;
    });
  }, [allWeeks, filter.year, filter.month]);

  // Final filtered list of weeks (applying all 3 filters: Year, Month, specific Week)
  const filteredWeeks = useMemo(() => {
    return allWeeks.filter(w => {
      const matchesYear = filter.year === "all" || w.year === filter.year;
      const matchesMonth = filter.month === "all" || w.monthIndex === filter.month;
      const matchesWeek = filter.week === "all" || w.weekId === filter.week;
      return matchesYear && matchesMonth && matchesWeek;
    });
  }, [allWeeks, filter.year, filter.month, filter.week]);

  // Reset month/week filters when parent filters change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextYear = e.target.value;
    setFilter({
      year: nextYear,
      month: "all",
      week: "all"
    });
    setActiveChartIndex(null);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMonth = e.target.value;
    setFilter(prev => ({
      ...prev,
      month: nextMonth,
      week: "all"
    }));
    setActiveChartIndex(null);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(prev => ({
      ...prev,
      week: e.target.value
    }));
    setActiveChartIndex(null);
  };

  // 3. Comparison Stats for the currently selected week (when a single week is selected or matched)
  const singleWeekStats = useMemo(() => {
    if (filteredWeeks.length !== 1) return null;
    
    const selectedWeek = filteredWeeks[0];
    
    // Find the previous week sequentially in the entire dataset
    const selectedIndex = allWeeks.findIndex(w => w.weekId === selectedWeek.weekId);
    
    // If we have a previous week in the array (which is sorted newest first, so previous is at index + 1)
    const prevWeek = selectedIndex !== -1 && selectedIndex < allWeeks.length - 1 
      ? allWeeks[selectedIndex + 1] 
      : null;

    const diffGross = prevWeek ? selectedWeek.totalGross - prevWeek.totalGross : 0;
    const diffNet = prevWeek ? selectedWeek.totalNet - prevWeek.totalNet : 0;
    
    const pctChangeGross = prevWeek && prevWeek.totalGross > 0 
      ? (diffGross / prevWeek.totalGross) * 100 
      : 0;
      
    const pctChangeNet = prevWeek && prevWeek.totalNet > 0 
      ? (diffNet / prevWeek.totalNet) * 100 
      : 0;

    return {
      selectedWeek,
      prevWeek,
      diffGross,
      diffNet,
      pctChangeGross,
      pctChangeNet
    };
  }, [filteredWeeks, allWeeks]);

  // 4. Multi-week Aggregates (when looking at a filtered list of multiple weeks)
  const periodAggregates = useMemo(() => {
    if (filteredWeeks.length === 0) return null;

    const count = filteredWeeks.length;
    const totalGross = filteredWeeks.reduce((sum, w) => sum + w.totalGross, 0);
    const totalNet = filteredWeeks.reduce((sum, w) => sum + w.totalNet, 0);
    const avgGross = totalGross / count;
    const avgNet = totalNet / count;
    
    // Find best week
    const bestWeek = [...filteredWeeks].sort((a, b) => b.totalGross - a.totalGross)[0];

    return {
      count,
      totalGross,
      totalNet,
      avgGross,
      avgNet,
      bestWeek
    };
  }, [filteredWeeks]);

  // 5. Build SVG Chart coordinates dynamically
  const chartData = useMemo(() => {
    // Take up to 10 weeks to show on the chart, sorted chronologically (oldest to newest)
    const weeksToChart = [...filteredWeeks].slice(0, 10).reverse();
    if (weeksToChart.length === 0) return null;

    const maxVal = Math.max(...weeksToChart.map(w => w.totalGross), 50000); // minimum scale limit
    
    return {
      weeks: weeksToChart,
      maxVal
    };
  }, [filteredWeeks]);

  return (
    <div className="space-y-6" id="history-box">
      {/* Search & Filter Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5" id="filters-card">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <Filter className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="font-semibold text-slate-800 text-sm md:text-base">
              Filtros de Búsqueda Comparativa
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Filtra por Año, Mes o selecciona una semana específica para contrastar ingresos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Year Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Año
            </label>
            <select
              value={filter.year}
              onChange={handleYearChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              id="select-year-filter"
            >
              <option value="all">📅 Todos los años</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Año {yr}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Mes
            </label>
            <select
              value={filter.month}
              onChange={handleMonthChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              id="select-month-filter"
            >
              <option value="all">🗓️ Todos los meses</option>
              {MONTHS_ES.map((monthName, index) => {
                // Only show month if it contains any weeks in the currently selected year (or all years)
                const hasWeeksInMonth = allWeeks.some(w => 
                  w.monthIndex === index.toString() && (filter.year === "all" || w.year === filter.year)
                );
                return (
                  <option 
                    key={index} 
                    value={index.toString()}
                    disabled={!hasWeeksInMonth && allWeeks.length > 0}
                  >
                    {monthName} {!hasWeeksInMonth && allWeeks.length > 0 ? "(Sin registros)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Week Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Semana de Pago
            </label>
            <select
              value={filter.week}
              onChange={handleWeekChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              id="select-week-filter"
            >
              <option value="all">🌾 Todas las semanas</option>
              {filteredWeeksForWeekFilter.map(w => (
                <option key={w.weekId} value={w.weekId}>
                  Semana {w.rangeLabel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main content conditional based on records exist */}
      {allWeeks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center space-y-4 shadow-sm" id="empty-history">
          <div className="bg-emerald-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-700">No hay datos para comparar</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ingresa al menos un registro en la sección <strong className="text-emerald-700">"Registro Semanal"</strong> para poder ver las estadísticas y comparar tus pagos.
            </p>
          </div>
          <button
            onClick={() => onSetTab("registro")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors border border-emerald-500 shadow-sm cursor-pointer"
          >
            Ir a Registrar Cosechas
          </button>
        </div>
      ) : filteredWeeks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center space-y-3 shadow-sm" id="no-filtered-data">
          <p className="text-xs text-slate-500 font-medium">Ninguna semana coincide con los filtros aplicados.</p>
          <button
            onClick={() => setFilter({ year: "all", month: "all", week: "all" })}
            className="text-xs text-emerald-600 font-bold hover:underline"
          >
            Limpiar filtros de búsqueda
          </button>
        </div>
      ) : (
        <>
          {/* STATS OVERVIEW CARDS */}
          {periodAggregates && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="filtered-stats">
              {/* Period Total */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-4 flex items-center space-x-3">
                <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600 border border-emerald-100">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Líquido</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{formatCurrency(periodAggregates.totalNet)}</p>
                  <p className="text-[9px] text-slate-400">Bruto: {formatCurrency(periodAggregates.totalGross)}</p>
                </div>
              </div>

              {/* Weekly Average */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-4 flex items-center space-x-3">
                <div className="bg-teal-50 p-2.5 rounded-lg text-teal-600 border border-teal-100">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Promedio Líquido</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{formatCurrency(periodAggregates.avgNet)}</p>
                  <p className="text-[9px] text-slate-400">En {periodAggregates.count} {periodAggregates.count === 1 ? 'semana' : 'semanas'}</p>
                </div>
              </div>

              {/* Best Week */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-4 flex items-center space-x-3">
                <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600 border border-amber-100">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mejor Semana</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{formatCurrency(periodAggregates.bestWeek.totalNet)}</p>
                  <p className="text-[9px] text-slate-400 truncate max-w-[150px]">{periodAggregates.bestWeek.rangeLabel}</p>
                </div>
              </div>

              {/* Saved Weeks Count */}
              <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-4 flex items-center space-x-3">
                <div className="bg-slate-50 p-2.5 rounded-lg text-slate-600 border border-slate-100">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semanas Guardadas</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{periodAggregates.count} semanas</p>
                  <p className="text-[9px] text-slate-400">Filtradas del historial</p>
                </div>
              </div>
            </div>
          )}

          {/* SINGLE WEEK DETAILED COMPARISON PANEL */}
          {singleWeekStats && (
            <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm" id="single-week-comparison-panel">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center">
                  <Sparkles className="h-4.5 w-4.5 mr-2 text-emerald-600" />
                  Comparativa de la Semana vs Período Anterior
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Análisis detallado de variaciones de sueldo con respecto a la semana inmediatamente anterior
                </p>
              </div>

              {singleWeekStats.prevWeek ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gross Comparison */}
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comparativa de Pago Bruto</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400">Semana Seleccionada</p>
                        <p className="text-lg font-bold text-slate-700">
                          {formatCurrency(singleWeekStats.selectedWeek.totalGross)}
                        </p>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Semana Anterior</p>
                        <p className="text-base font-semibold text-slate-500">
                          {formatCurrency(singleWeekStats.prevWeek.totalGross)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Diferencia Bruta:</span>
                      <div className="flex items-center space-x-1">
                        {singleWeekStats.diffGross >= 0 ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{formatCurrency(singleWeekStats.diffGross)} (+{singleWeekStats.pctChangeGross.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {formatCurrency(singleWeekStats.diffGross)} ({singleWeekStats.pctChangeGross.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Net Comparison */}
                  <div className="p-4 bg-emerald-50/20 rounded-xl border border-emerald-100/50 space-y-3">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Comparativa de Pago Líquido</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-emerald-600">Semana Seleccionada</p>
                        <p className="text-lg font-bold text-emerald-900">
                          {formatCurrency(singleWeekStats.selectedWeek.totalNet)}
                        </p>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-emerald-500" />
                      
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Semana Anterior</p>
                        <p className="text-base font-semibold text-slate-500">
                          {formatCurrency(singleWeekStats.prevWeek.totalNet)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-emerald-100/30 pt-2.5 flex items-center justify-between">
                      <span className="text-xs text-emerald-800 font-semibold">Diferencia Líquida:</span>
                      <div className="flex items-center space-x-1">
                        {singleWeekStats.diffNet >= 0 ? (
                          <span className="inline-flex items-center text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{formatCurrency(singleWeekStats.diffNet)} (+{singleWeekStats.pctChangeNet.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {formatCurrency(singleWeekStats.diffNet)} ({singleWeekStats.pctChangeNet.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 text-slate-500 text-xs font-semibold text-center rounded-xl border border-slate-200">
                  Esta es la primera semana registrada. No hay registros anteriores en el sistema para realizar el contraste de ingresos.
                </div>
              )}
            </div>
          )}

          {/* GRAPHICS SECTION */}
          {chartData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SVG Interactive Chart (8 columns) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4" id="chart-card">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center">
                    <BarChart2 className="h-4.5 w-4.5 mr-2 text-emerald-600" />
                    Comparativa Gráfica de Ingresos Semanales
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Últimas {chartData.weeks.length} semanas</span>
                </div>

                {/* SVG Chart Drawing */}
                <div className="relative pt-2">
                  <svg
                    viewBox="0 0 600 300"
                    className="w-full h-auto overflow-visible select-none"
                    id="svg-income-chart"
                  >
                    {/* Background grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = 20 + ratio * 220;
                      const val = chartData.maxVal * (1 - ratio);
                      return (
                        <g key={idx}>
                          <line
                            x1="50"
                            y1={y}
                            x2="580"
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1.5"
                          />
                          <text
                            x="42"
                            y={y + 4}
                            textAnchor="end"
                            className="fill-slate-400 font-mono text-[9px] font-bold"
                          >
                            {formatCurrency(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bars rendering */}
                    {chartData.weeks.map((week, index) => {
                      const barCount = chartData.weeks.length;
                      const paddingX = 40;
                      const chartWidth = 530;
                      const stepX = chartWidth / barCount;
                      const xBase = 50 + index * stepX + (stepX - 32) / 2; // Center bars in slot

                      // Height calculation
                      const heightGross = (week.totalGross / chartData.maxVal) * 220;
                      const heightNet = (week.totalNet / chartData.maxVal) * 220;

                      const yGross = 240 - heightGross;
                      const yNet = 240 - heightNet;

                      const isHovered = activeChartIndex === index;

                      return (
                        <g
                          key={week.weekId}
                          className="cursor-pointer group"
                          onMouseEnter={() => setActiveChartIndex(index)}
                          onMouseLeave={() => setActiveChartIndex(null)}
                        >
                          {/* Invisible hover trigger area for the entire vertical slice */}
                          <rect
                            x={50 + index * stepX}
                            y="10"
                            width={stepX}
                            height="240"
                            fill="transparent"
                          />

                          {/* Gross Bar */}
                          <rect
                            x={xBase}
                            y={yGross}
                            width="14"
                            height={Math.max(2, heightGross)}
                            rx="3"
                            fill={isHovered ? "#34d399" : "#a7f3d0"}
                            className="transition-all duration-250"
                          />

                          {/* Net Bar */}
                          <rect
                            x={xBase + 16}
                            y={yNet}
                            width="14"
                            height={Math.max(2, heightNet)}
                            rx="3"
                            fill={isHovered ? "#047857" : "#10b981"}
                            className="transition-all duration-250"
                          />

                          {/* X-Axis labels */}
                          <text
                            x={xBase + 14}
                            y="258"
                            textAnchor="middle"
                            className={`font-sans text-[9px] font-bold transition-colors ${
                              isHovered ? "fill-emerald-800 font-extrabold" : "fill-slate-400"
                            }`}
                          >
                            {week.startDate.split('-')[2]}/{MONTHS_ES[parseInt(week.startDate.split('-')[1]) - 1].substring(0, 3)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Bottom axis line */}
                    <line
                      x1="50"
                      y1="240"
                      x2="580"
                      y2="240"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                    />

                    {/* Tooltip implementation inside SVG */}
                    {activeChartIndex !== null && chartData.weeks[activeChartIndex] && (() => {
                      const week = chartData.weeks[activeChartIndex];
                      const barCount = chartData.weeks.length;
                      const chartWidth = 530;
                      const stepX = chartWidth / barCount;
                      const tooltipX = Math.min(
                        450,
                        Math.max(60, 50 + activeChartIndex * stepX + stepX / 2)
                      );

                      return (
                        <g className="pointer-events-none drop-shadow-md">
                          {/* Background tooltip card */}
                          <rect
                            x={tooltipX - 80}
                            y="15"
                            width="160"
                            height="65"
                            rx="8"
                            fill="#1e293b"
                            opacity="0.95"
                          />
                          <text
                            x={tooltipX}
                            y="30"
                            textAnchor="middle"
                            className="fill-slate-100 font-sans text-[8.5px] font-bold"
                          >
                            Sueldo: {week.rangeLabel}
                          </text>
                          <text
                            x={tooltipX - 70}
                            y="48"
                            className="fill-emerald-300 font-mono text-[9px] font-semibold"
                          >
                            • Neto: {formatCurrency(week.totalNet)}
                          </text>
                          <text
                            x={tooltipX - 70}
                            y="62"
                            className="fill-emerald-100 font-mono text-[8.5px]"
                          >
                            • Bruto: {formatCurrency(week.totalGross)}
                          </text>
                        </g>
                      );
                    })()}
                  </svg>

                  {/* Legends */}
                  <div className="flex items-center justify-center space-x-6 text-xs pt-1.5 border-t border-slate-50">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 bg-emerald-200 border border-emerald-300 rounded-sm" />
                      <span className="text-slate-500 font-medium text-[11px]">Sueldo Bruto</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 bg-emerald-600 rounded-sm" />
                      <span className="text-slate-500 font-medium text-[11px]">Sueldo Líquido (-19%)</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[10px]">
                      * Desplaza el cursor sobre las barras para ver detalles
                    </div>
                  </div>
                </div>
              </div>

              {/* History list breakdown (4 columns) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4" id="history-sidebar">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-semibold text-slate-800 text-sm">Semanas Registradas</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Listado de ingresos filtrados en orden</p>
                </div>

                <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                  {filteredWeeks.map((week) => {
                    const isCurrentActive = week.weekId === currentWeekId;
                    return (
                      <div
                        key={week.weekId}
                        onClick={() => {
                          onSelectWeek(week.weekId);
                          onSetTab("registro");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isCurrentActive
                            ? "bg-emerald-55 border-emerald-400 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 border-slate-100"
                        }`}
                        id={`history-item-${week.weekId}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-800">
                            Semana {week.rangeLabel}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isCurrentActive ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}>
                            {isCurrentActive ? "Activa" : "Ver"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Sueldo Líquido</p>
                            <p className="text-sm font-black text-emerald-800">{formatCurrency(week.totalNet)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider">Sueldo Bruto</p>
                            <p className="text-xs font-bold text-slate-600">{formatCurrency(week.totalGross)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
