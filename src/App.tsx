/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { WorkEntry, Product } from "./types";
import { PRODUCT_CATALOG } from "./data/products";
import { 
  getPayWeekEndingDate, 
  getPayWeekStartDate, 
  getDaysOfWeekForPayWeek, 
  formatDateString 
} from "./utils/dateHelpers";
import Header from "./components/Header";
import WeeklyDashboard from "./components/WeeklyDashboard";
import WorkEntryForm from "./components/WorkEntryForm";
import HistoryDashboard from "./components/HistoryDashboard";
import ProductsDashboard from "./components/ProductsDashboard";
import Login from "./components/Login";
import { ClipboardList, BarChart2, Coins, Receipt, Info, Sparkles, Tag } from "lucide-react";

/// Save entries automatically to localStorage
export default function App() {
  // 1a. User login state with persistence
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("agricola_pay_logged_in") === "true";
  });

  // 1. Initial State Loading starting completely empty
  const [allEntries, setAllEntries] = useState<WorkEntry[]>(() => {
    const saved = localStorage.getItem("agricola_pay_entries_clean_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
    return [];
  });

  // Current system date representation (initialized to today's date for real usage)
  const systemDate = useMemo(() => {
    return new Date();
  }, []);

  const [currentWeekId, setCurrentWeekId] = useState<string>(() => {
    const saved = localStorage.getItem("agricola_pay_week_id");
    return saved ? saved : getPayWeekEndingDate(systemDate);
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const saved = localStorage.getItem("agricola_pay_selected_date");
    return saved ? saved : formatDateString(systemDate);
  });

  const [activeTab, setActiveTab] = useState<"registro" | "comparativa" | "productos">(() => {
    const saved = localStorage.getItem("agricola_pay_active_tab");
    if (saved === "registro" || saved === "comparativa" || saved === "productos") {
      return saved;
    }
    return "registro";
  });

  // 1b. Products Catalog state loaded from localStorage, defaulting to PRODUCT_CATALOG
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("agricola_pay_products_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading saved products", e);
      }
    }
    return PRODUCT_CATALOG;
  });

  // Server Synchronization states
  const [isLoadedFromServer, setIsLoadedFromServer] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Load initial data from Express server on mount
  useEffect(() => {
    async function loadServerData() {
      try {
        const response = await fetch("/api/data");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.entries)) {
            setAllEntries(data.entries);
          }
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.warn("No server api detected or offline. Fallback to local storage.", err);
      } finally {
        setIsLoadedFromServer(true);
      }
    }
    loadServerData();
  }, []);

  // Save entries automatically to localStorage
  useEffect(() => {
    localStorage.setItem("agricola_pay_entries_clean_v1", JSON.stringify(allEntries));
  }, [allEntries]);

  // Save products automatically to localStorage
  useEffect(() => {
    localStorage.setItem("agricola_pay_products_v1", JSON.stringify(products));
  }, [products]);

  // Save login state automatically to localStorage
  useEffect(() => {
    localStorage.setItem("agricola_pay_logged_in", String(isLoggedIn));
  }, [isLoggedIn]);

  // Save navigation and active tab states to localStorage
  useEffect(() => {
    localStorage.setItem("agricola_pay_week_id", currentWeekId);
  }, [currentWeekId]);

  useEffect(() => {
    localStorage.setItem("agricola_pay_selected_date", selectedDateStr);
  }, [selectedDateStr]);

  useEffect(() => {
    localStorage.setItem("agricola_pay_active_tab", activeTab);
  }, [activeTab]);

  // Save to the server whenever entries or products change (only after initial server load succeeds!)
  useEffect(() => {
    if (!isLoadedFromServer) return;

    let active = true;
    async function saveServerData() {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const response = await fetch("/api/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ entries: allEntries, products }),
        });
        if (!response.ok) {
          throw new Error("Respuesta de red no satisfactoria");
        }
      } catch (err) {
        if (active) {
          console.warn("No se pudo guardar la información en el servidor:", err);
          setSyncError("Modo Local (Offline)");
        }
      } finally {
        if (active) {
          setIsSyncing(false);
        }
      }
    }

    const timeoutId = setTimeout(() => {
      saveServerData();
    }, 600);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [allEntries, products, isLoadedFromServer]);

  // Derive selected day details
  const selectedDay = useMemo(() => {
    const days = getDaysOfWeekForPayWeek(currentWeekId);
    const matched = days.find(d => d.date === selectedDateStr);
    if (matched) return matched;
    // Fallback to the first day of the week
    return days[0];
  }, [currentWeekId, selectedDateStr]);

  // Filter entries for the selected day
  const dayEntries = useMemo(() => {
    return allEntries.filter(entry => entry.date === selectedDateStr);
  }, [allEntries, selectedDateStr]);

  // Handlers for data alteration
  const handleAddEntry = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newEntry: WorkEntry = {
      id: "entry_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      productId,
      quantity,
      date: selectedDateStr,
      rate: product.price,
      total: quantity * product.price
    };

    setAllEntries(prev => [...prev, newEntry]);
  };

  // Product management handlers
  const handleAddProduct = (newProduct: { name: string; price: number }) => {
    const id = "prod_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
    const item: Product = {
      id,
      name: newProduct.name,
      price: newProduct.price
    };
    setProducts(prev => [...prev, item]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleResetProducts = () => {
    setProducts(PRODUCT_CATALOG);
  };

  const handleDeleteEntry = (entryId: string) => {
    setAllEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  const handleUpdateEntry = (entryId: string, newQuantity: number) => {
    setAllEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          quantity: newQuantity,
          total: newQuantity * entry.rate
        };
      }
      return entry;
    }));
  };

  const handleSelectWeek = (weekId: string) => {
    setCurrentWeekId(weekId);
  };

  const handleSelectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    // Automatically update the current week ID if selecting a day from another week
    const computedWeek = getPayWeekEndingDate(dateStr);
    if (computedWeek !== currentWeekId) {
      setCurrentWeekId(computedWeek);
    }
  };

  // Import / Export coping mechanisms
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allEntries, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `registro_pagos_agricolas_${formatDateString(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          // Verify keys of the first item roughly
          if (importedData.length === 0 || ('productId' in importedData[0] && 'quantity' in importedData[0])) {
            setAllEntries(importedData);
            alert("¡Copia de seguridad importada con éxito! Se cargaron " + importedData.length + " registros.");
          } else {
            alert("El archivo importado no tiene un formato válido.");
          }
        } else {
          alert("El archivo importado no contiene una lista válida de registros.");
        }
      } catch (err) {
        alert("Ocurrió un error al procesar el archivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    setAllEntries([]);
    setSelectedDateStr(formatDateString(systemDate));
    setCurrentWeekId(getPayWeekEndingDate(systemDate));
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      <div>
        {/* Navigation & Header */}
        <Header 
          onExportBackup={handleExportBackup} 
          onImportBackup={handleImportBackup} 
          onResetData={handleResetData} 
          onLogout={() => setIsLoggedIn(false)}
        />

        {/* Main Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Section Selector Tab Bar & Auto-save status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="tab-nav-bar-container">
            <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-full max-w-lg" id="tab-nav-bar">
              <button
                onClick={() => setActiveTab("registro")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "registro"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
                id="tab-btn-registro"
              >
                <ClipboardList className="h-4.5 w-4.5" />
                <span>Registro Semanal</span>
              </button>
              
              <button
                onClick={() => setActiveTab("comparativa")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "comparativa"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
                id="tab-btn-comparativa"
              >
                <BarChart2 className="h-4.5 w-4.5" />
                <span>Comparativa Histórica</span>
              </button>

              <button
                onClick={() => setActiveTab("productos")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "productos"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
                id="tab-btn-productos"
              >
                <Tag className="h-4.5 w-4.5" />
                <span>Productos</span>
              </button>
            </div>

            {isSyncing ? (
              <div className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-[11px] font-semibold self-start md:self-auto shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span>Sincronizando con el servidor...</span>
              </div>
            ) : syncError ? (
              <div className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100 text-[11px] font-semibold self-start md:self-auto shadow-xs">
                <span className="h-2 w-2 bg-amber-500 rounded-full"></span>
                <span>Guardado Localmente (Offline)</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[11px] font-semibold self-start md:self-auto shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Sincronizado con la Nube</span>
              </div>
            )}
          </div>

          {/* Interactive view container */}
          <div className="animate-fade-in">
            {activeTab === "registro" ? (
              <div className="space-y-6">
                {/* 7-Days Strip + Financial Cards */}
                <WeeklyDashboard 
                  currentWeekId={currentWeekId} 
                  selectedDateStr={selectedDateStr} 
                  allEntries={allEntries} 
                  products={products}
                  onSelectWeek={handleSelectWeek} 
                  onSelectDay={handleSelectDay} 
                  onUpdateEntry={handleUpdateEntry}
                  onDeleteEntry={handleDeleteEntry}
                />

                {/* Entry fields & Daily aggregate lists */}
                <WorkEntryForm 
                  selectedDay={selectedDay} 
                  dayEntries={dayEntries} 
                  products={products}
                  onAddEntry={handleAddEntry} 
                  onDeleteEntry={handleDeleteEntry} 
                  onUpdateEntry={handleUpdateEntry}
                />
              </div>
            ) : activeTab === "comparativa" ? (
              <HistoryDashboard 
                allEntries={allEntries} 
                currentWeekId={currentWeekId} 
                onSelectWeek={handleSelectWeek} 
                onSetTab={setActiveTab} 
              />
            ) : (
              <ProductsDashboard
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onResetProducts={handleResetProducts}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer disclaimer and metadata layout */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Control de cosechas y cobros diseñado para trabajadores agrícolas.
          </p>
          <div className="flex items-center space-x-4">
            <span>Cierre de semana: Miércoles 23:59</span>
            <span>Retención: 19%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
