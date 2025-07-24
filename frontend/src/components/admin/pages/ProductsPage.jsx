import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2 } from "lucide-react";

import { EditProductForm } from "../forms/ProductForm";

import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(""); // New state for filtering
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch categories and products
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [{ data: cats, error: catErr }, { data: prods, error: prodErr }] =
        await Promise.all([
          supabase.from("categories").select("id, name").order("name"),
          supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (catErr) {
        toast({ title: "Failed to fetch categories", variant: "destructive" });
      } else {
        setCategories(cats || []);
      }

      if (prodErr) {
        toast({ title: "Failed to fetch products", variant: "destructive" });
      } else {
        setProducts(prods || []);
      }

      setLoading(false);
    }

    fetchData();
  }, [toast]);

  // Helper to count currently featured products except the one being edited
  const getFeaturedCountExcluding = (excludeProductId = null) =>
    products.filter((p) => p.featured && p.id !== excludeProductId).length;

  // Edit product handler
  const handleEdit = async (data) => {
    if (!editingProduct) return;

    // Check featured limit if enabling featured flag
    const featuredCount = getFeaturedCountExcluding(editingProduct.id);
    if (data.featured && !editingProduct.featured && featuredCount >= 4) {
      toast({
        title: "Featured Products Limit Reached",
        description: "Only 4 products can be featured at a time.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("products")
      .update(data)
      .eq("id", editingProduct.id);

    if (error) {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProducts(
      products.map((p) => (p.id === editingProduct.id ? { ...p, ...data } : p))
    );
    setEditingProduct(null);
    setIsFormOpen(false);
    toast({ title: "Product updated successfully" });
  };

  // Delete product handler
  const handleDelete = async () => {
    if (!deleteProduct) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteProduct.id);

    if (error) {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProducts(products.filter((p) => p.id !== deleteProduct.id));
    setDeleteProduct(null);
    toast({ title: "Product deleted successfully" });
  };

  // Filter products by selected category if any selected
  const filteredProducts = selectedCategoryId
    ? products.filter((p) => p.category_id === selectedCategoryId)
    : products;

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Products</h1>
        {/* Navigate to separate Add Product page */}
        <Button
          onClick={() => navigate("/admin/products/add-product")}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Category Filter Dropdown */}
      <div className="mb-4 max-w-xs">
        <label
          htmlFor="category-filter"
          className="block mb-1 font-medium text-gray-700"
        >
          Filter by Category
        </label>
        <select
          id="category-filter"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product list */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>
            Showing {filteredProducts.length}{" "}
            {selectedCategoryId
              ? `product${filteredProducts.length !== 1 ? "s" : ""} in ${
                  categories.find((c) => c.id === selectedCategoryId)?.name ||
                  ""
                }`
              : `product${
                  filteredProducts.length !== 1 ? "s" : ""
                } in all categories`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-10">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">
              No products found.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="bg-surface-light border-border"
                >
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <CardTitle>{product.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Category:{" "}
                        {categories.find(
                          (cat) => cat.id === product.category_id
                        )?.name || "Uncategorized"}
                      </CardDescription>
                    </div>
                    {product.featured && (
                      <Badge variant="secondary" className="text-yellow-600">
                        Featured
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-lg font-semibold">
                          ${product.price.toFixed(2)}
                        </p>
                        <p className="text-sm">
                          {product.in_stock ? "In Stock" : "Out of Stock"}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Edit Product only */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingProduct(null);
          }
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto p-6">
          {editingProduct && (
            <EditProductForm
              product={editingProduct}
              categories={categories}
              onSubmit={handleEdit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingProduct(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog for Delete Confirmation */}
      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
