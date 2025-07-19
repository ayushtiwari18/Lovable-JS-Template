import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { ProductForm } from "../forms/ProductForm";
import { useToast } from "@/hooks/use-toast";

const initialProducts = [
  {
    id: 1,
    name: "Premium Trophy",
    price: 199.99,
    stock: 45,
    status: "active",
    category: "Awards",
  },
  {
    id: 2,
    name: "Golden Medal",
    price: 89.99,
    stock: 23,
    status: "active",
    category: "Medals",
  },
  {
    id: 3,
    name: "Crystal Award",
    price: 149.99,
    stock: 12,
    status: "active",
    category: "Awards",
  },
  {
    id: 4,
    name: "Bronze Trophy",
    price: 79.99,
    stock: 67,
    status: "active",
    category: "Awards",
  },
  {
    id: 5,
    name: "Silver Medal",
    price: 69.99,
    stock: 0,
    status: "inactive",
    category: "Medals",
  },
];

export function ProductsPage() {
  const [products, setProducts] = useState(initialProducts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState();
  const [deleteProduct, setDeleteProduct] = useState();
  const { toast } = useToast();

  const handleCreate = (data) => {
    const newProduct = {
      ...data,
      id: Math.max(...products.map((p) => p.id)) + 1,
    };
    setProducts([...products, newProduct]);
    setIsFormOpen(false);
    toast({ title: "Product created successfully" });
  };

  const handleEdit = (data) => {
    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...data } : p
        )
      );
      setEditingProduct(undefined);
      toast({ title: "Product updated successfully" });
    }
  };

  const handleDelete = () => {
    if (deleteProduct) {
      setProducts(products.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(undefined);
      toast({ title: "Product deleted successfully" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Product List</CardTitle>
          <CardDescription>
            You have {products.length} products in your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-light"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-surface-medium rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {product.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      ${product.price}
                    </p>
                    <p className="text-sm text-muted-foreground">Price</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {product.stock}
                    </p>
                    <p className="text-sm text-muted-foreground">Stock</p>
                  </div>
                  <Badge
                    variant={
                      product.status === "active" ? "default" : "secondary"
                    }
                    className={
                      product.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }
                  >
                    {product.status}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteProduct(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen || !!editingProduct}
        onOpenChange={() => {
          setIsFormOpen(false);
          setEditingProduct(undefined);
        }}
      >
        <DialogContent>
          <ProductForm
            product={editingProduct}
            onSubmit={editingProduct ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingProduct(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This
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
