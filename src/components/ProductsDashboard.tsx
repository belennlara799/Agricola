/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Product } from "../types";
import { PRODUCT_CATALOG } from "../data/products";
import { formatCurrency } from "../utils/dateHelpers";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  RotateCcw, 
  Tag, 
  Sparkles, 
  ArrowUpDown, 
  DollarSign, 
  FileText 
} from "lucide-react";

interface ProductsDashboardProps {
  products: Product[];
  onAddProduct: (product: { name: string; price: number }) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onResetProducts: () => void;
}

export default function ProductsDashboard({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetProducts,
}: ProductsDashboardProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // New Product Form State
  const [newName, setNewName] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editError, setEditError] = useState<string>("");

  // Handle Form Submission for Adding
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const nameTrimmed = newName.trim();
    if (!nameTrimmed) {
      setFormError("El nombre del producto no puede estar vacío.");
      return;
    }

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Ingrese un precio unitario válido (mayor o igual a 0).");
      return;
    }

    // Check duplicate name
    const exists = products.some(
      (p) => p.name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (exists) {
      setFormError("Ya existe un producto con este nombre.");
      return;
    }

    onAddProduct({ name: nameTrimmed, price: priceNum });
    setNewName("");
    setNewPrice("");
  };

  // Start Inline Editing
  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditError("");
  };

  // Save Inline Editing
  const handleSaveEdit = (id: string) => {
    setEditError("");
    const nameTrimmed = editName.trim();
    if (!nameTrimmed) {
      setEditError("El nombre no puede estar vacío.");
      return;
    }

    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setEditError("Precio inválido.");
      return;
    }

    // Check duplicate name (excluding itself)
    const exists = products.some(
      (p) => p.id !== id && p.name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (exists) {
      setEditError("Otro producto ya tiene este nombre.");
      return;
    }

    onUpdateProduct({ id, name: nameTrimmed, price: priceNum });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Toggle Sorting
  const toggleSort = (field: "name" | "price") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filter & Sort Products
  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      } else {
        comparison = a.price - b.price;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, searchTerm, sortBy, sortOrder]);

  const handleResetToDefault = () => {
    if (
      window.confirm(
        "¿Está seguro de que desea restaurar la lista de productos por defecto? Se perderán todos los productos personalizados y cambios de precios."
      )
    ) {
      onResetProducts();
    }
  };

  return (
    <div className="space-y-6" id="products-dashboard">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="products-stats">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Productos</p>
            <p className="text-2xl font-bold text-slate-800">{products.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Productos Activos</p>
            <p className="text-2xl font-bold text-slate-800">
              {products.filter((p) => p.price > 0).length} con precio set
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Precio Promedio</p>
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(
                products.length > 0
                  ? products.reduce((acc, curr) => acc + curr.price, 0) / products.length
                  : 0
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Create / Restore Products */}
        <div className="lg:col-span-4 space-y-6">
          {/* Add Product Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4" id="add-product-card">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Agregar Nuevo Producto
            </h3>
            
            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ej. Apio Premium"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                  id="new-product-name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Precio Unitario ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="ej. 850"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                  id="new-product-price"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-500 font-semibold" id="new-product-error">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
                id="btn-add-product"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Producto</span>
              </button>
            </form>
          </div>

          {/* Reset / Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3" id="reset-products-card">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Acciones de Catálogo
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Si deseas deshacer todos tus cambios y volver a la lista original de 25 productos agrícolas de fábrica, puedes restaurarla aquí.
            </p>
            <button
              onClick={handleResetToDefault}
              className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              id="btn-restore-products"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restaurar Catálogo Original</span>
            </button>
          </div>
        </div>

        {/* Right Side: Product Catalog List */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4" id="products-list-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Catálogo de Productos
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Modifica los precios existentes o remueve productos personalizados.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:max-w-[240px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-8.5 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                id="catalog-search"
              />
            </div>
          </div>

          {/* Product list table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="products-table">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="flex items-center space-x-1 hover:text-slate-600 transition-colors font-bold cursor-pointer"
                    >
                      <span>Nombre del Producto</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="pb-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleSort("price")}
                      className="flex items-center space-x-1 hover:text-slate-600 transition-colors mx-auto font-bold cursor-pointer"
                    >
                      <span>Precio Unitario</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="pb-3 pl-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredAndSortedProducts.length > 0 ? (
                  filteredAndSortedProducts.map((product) => {
                    const isEditing = editingId === product.id;
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors" id={`product-row-${product.id}`}>
                        {/* Name Field */}
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                                id={`edit-prod-name-${product.id}`}
                              />
                              {editError && (
                                <p className="text-[10px] text-rose-500 font-semibold">{editError}</p>
                              )}
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-800 block">
                              {product.name}
                            </span>
                          )}
                        </td>

                        {/* Price Field */}
                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center space-x-1 max-w-[120px] mx-auto">
                              <span className="text-slate-400 font-semibold">$</span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-20 px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-center"
                                id={`edit-prod-price-${product.id}`}
                              />
                            </div>
                          ) : (
                            <span className="font-mono text-emerald-600 font-bold">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </td>

                        {/* Actions Field */}
                        <td className="py-3 pl-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleSaveEdit(product.id)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all cursor-pointer"
                                title="Guardar"
                                id={`btn-save-edit-${product.id}`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                                title="Cancelar"
                                id={`btn-cancel-edit-${product.id}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => startEdit(product)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg transition-all cursor-pointer"
                                title="Editar"
                                id={`btn-start-edit-${product.id}`}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `¿Está seguro de que desea eliminar "${product.name}"? Los registros de cosecha anteriores con este producto conservarán el precio guardado.`
                                    )
                                  ) {
                                    onDeleteProduct(product.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer"
                                title="Eliminar"
                                id={`btn-delete-prod-${product.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                      No se encontraron productos coincidentes en el catálogo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
