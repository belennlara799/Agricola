/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Product, WorkEntry } from "../types";
import { formatCurrency, formatToHumanDate } from "../utils/dateHelpers";
import { Plus, Trash2, Search, Percent, Calculator, ChevronRight, Calendar, AlertTriangle, Edit, Check, X, ChevronDown } from "lucide-react";

interface WorkEntryFormProps {
  selectedDay: { date: string; dayName: string };
  dayEntries: WorkEntry[];
  products: Product[];
  onAddEntry: (productId: string, quantity: number) => void;
  onDeleteEntry: (entryId: string) => void;
  onUpdateEntry: (entryId: string, newQuantity: number) => void;
}

export default function WorkEntryForm({
  selectedDay,
  dayEntries,
  products,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
}: WorkEntryFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(() => products[0]?.id || "");
  const [quantityInput, setQuantityInput] = useState<string>("10");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (products.length > 0 && (!selectedProductId || !products.some(p => p.id === selectedProductId))) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    onUpdateEntry(entryId, qty);
    setEditingEntryId(null);
    setEditingQuantity("");
  };

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0] || { id: "", name: "Sin Productos", price: 0 };
  }, [products, selectedProductId]);

  // Handle adding an entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      alert("Por favor ingrese una cantidad válida mayor a 0.");
      return;
    }
    onAddEntry(selectedProductId, qty);
    // Reset inputs so the user can log a new item from scratch
    setQuantityInput("");
    setSearchTerm("");
    setSelectedProductId(products[0]?.id || "");
  };

  const handleQuickAddQty = (amount: number) => {
    const current = parseFloat(quantityInput) || 0;
    const nextVal = Math.max(0, current + amount);
    setQuantityInput(nextVal.toString());
  };

  const dayTotal = useMemo(() => {
    return dayEntries.reduce((sum, entry) => sum + entry.total, 0);
  }, [dayEntries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Logger Panel (Left Side - 5 columns on desktop) */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5" id="logging-box">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-base flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-emerald-600" />
              Ingresar Trabajo
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-55 text-emerald-700 rounded-lg border border-emerald-100">
              {selectedDay.dayName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {formatToHumanDate(selectedDay.date, true)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom Dropdown / Lista Desplegable Selection */}
          <div className="relative space-y-1.5" ref={dropdownRef}>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Seleccionar Producto
            </label>
            
            {/* Dropdown Trigger Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left cursor-pointer"
              id="product-dropdown-trigger"
            >
              <div className="flex-1 min-w-0 pr-2">
                <span className="block text-xs font-semibold text-slate-700 truncate">
                  {selectedProduct.name}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Precio unitario: {formatCurrency(selectedProduct.price)}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? "transform rotate-180" : ""}`} />
            </button>

            {/* Dropdown Listbox / Panel */}
            {isDropdownOpen && (
              <div 
                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 space-y-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                id="product-dropdown-panel"
              >
                {/* Search Input inside Dropdown */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por nombre..."
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                    id="product-dropdown-search"
                    autoFocus
                    onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on clicking input
                  />
                </div>

                {/* Filtered Products list */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const isSelected = product.id === selectedProductId;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setSelectedProductId(product.id);
                            setIsDropdownOpen(false);
                            setSearchTerm("");
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "hover:bg-slate-50 text-slate-700 bg-white border border-slate-100"
                          }`}
                          id={`product-opt-${product.id}`}
                        >
                          <span className="truncate pr-2">{product.name}</span>
                          <span className={`font-mono font-semibold shrink-0 ${isSelected ? "text-emerald-100" : "text-emerald-600"}`}>
                            {product.price > 0 ? formatCurrency(product.price) : "Sin precio"}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 font-medium">
                      No se encontraron productos.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quantity Input with Quick Tap Increments */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Cantidad Trabajada
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                className="flex-1 px-4 py-2.5 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold text-slate-700 text-center"
                placeholder="Cantidad"
                required
                id="quantity-number-input"
              />
            </div>
            
            {/* Quick Adjustments */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[-10, -1, 1, 10, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddQty(val)}
                  className={`py-1 text-center text-xs font-semibold rounded-lg border transition-all ${
                    val < 0
                      ? "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 active:bg-rose-200"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 active:bg-slate-200"
                  }`}
                  id={`btn-qty-${val}`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotal calculation simulation */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
              <span>Cálculo Estimado:</span>
              <span className="text-emerald-700">
                {quantityInput ? (
                  `${quantityInput} x ${formatCurrency(selectedProduct.price)} = ${formatCurrency((parseFloat(quantityInput) || 0) * selectedProduct.price)}`
                ) : (
                  "$ 0"
                )}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all border border-emerald-500 cursor-pointer"
            id="btn-add-harvest-item"
          >
            <Plus className="h-5 w-5" />
            <span>Agregar Registro del Día</span>
          </button>
        </form>
      </div>

      {/* Entries List for the Day (Right Side - 7 columns on desktop) */}
      <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between" id="day-entries-list">
        <div>
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-base">
              Registros de {selectedDay.dayName}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {dayEntries.length} {dayEntries.length === 1 ? "registro" : "registros"} ingresados
            </span>
          </div>

          {dayEntries.length > 0 ? (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {dayEntries.map((entry) => {
                const product = products.find(p => p.id === entry.productId) || {
                  name: "Producto Desconocido",
                  price: entry.rate
                };
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100/80 border border-slate-100 transition-all group"
                    id={`entry-card-${entry.id}`}
                  >
                    <div className="space-y-0.5 flex-1 mr-4">
                      <p className="font-semibold text-xs text-slate-800">{product.name}</p>
                      {editingEntryId === entry.id ? (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">Cant:</span>
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={editingQuantity}
                            onChange={(e) => setEditingQuantity(e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                            id={`edit-qty-input-${entry.id}`}
                            autoFocus
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            x {formatCurrency(entry.rate)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-mono">
                          {entry.quantity} un. x {formatCurrency(entry.rate)} c/u
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <p className="font-bold text-xs text-slate-700 text-right min-w-[65px]">
                        {editingEntryId === entry.id ? (
                          formatCurrency((parseFloat(editingQuantity) || 0) * entry.rate)
                        ) : (
                          formatCurrency(entry.total)
                        )}
                      </p>
                      {editingEntryId === entry.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleSaveEdit(entry.id)}
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-100"
                            title="Guardar"
                            id={`btn-save-edit-${entry.id}`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors border border-slate-200"
                            title="Cancelar"
                            id={`btn-cancel-edit-${entry.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors border border-slate-200"
                            title="Editar"
                            id={`btn-edit-entry-${entry.id}`}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors border border-rose-100"
                            title="Eliminar"
                            id={`btn-del-entry-${entry.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <div className="bg-slate-100 p-3 rounded-full text-slate-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-xs text-slate-600">No hay registros para este día</p>
                <p className="text-[10px] text-slate-400 max-w-[240px]">
                  Utiliza el formulario de la izquierda para agregar las unidades cosechadas de tus productos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Day Total Section */}
        <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between bg-slate-50 -mx-5 -mb-5 p-5 rounded-b-2xl border-b border-l border-r border-slate-50">
          <div>
            <p className="text-xs text-slate-400 font-medium">Subtotal del Día Bruto</p>
            <p className="text-xs font-semibold text-slate-600">Suma total de {selectedDay.dayName}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-extrabold text-slate-800" id="day-total-sum">
              {formatCurrency(dayTotal)}
            </p>
            {dayTotal > 0 && (
              <p className="text-[10px] text-rose-600 font-medium flex items-center justify-end mt-0.5">
                <Percent className="h-3 w-3 mr-0.5" />
                -19%: {formatCurrency(dayTotal * 0.19)} (Impto.)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
