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
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { CategoryForm } from "../forms/CategoryForm";
import { useToast } from "@/hooks/use-toast";

const initialCategories = [
  {
    id: 1,
    name: "Awards",
    description: "Premium awards and trophies",
    products: 25,
    status: "active",
  },
  {
    id: 2,
    name: "Medals",
    description: "Competition medals and ribbons",
    products: 18,
    status: "active",
  },
  {
    id: 3,
    name: "Plaques",
    description: "Recognition plaques and certificates",
    products: 12,
    status: "active",
  },
  {
    id: 4,
    name: "Cups",
    description: "Trophy cups and chalices",
    products: 8,
    status: "inactive",
  },
  {
    id: 5,
    name: "Figurines",
    description: "Sport and achievement figurines",
    products: 15,
    status: "active",
  },
];

export function CategoriesPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState();
  const [deleteCategory, setDeleteCategory] = useState();
  const { toast } = useToast();

  const handleCreate = (data) => {
    const newCategory = {
      ...data,
      id: Math.max(...categories.map((c) => c.id)) + 1,
      products: 0,
    };
    setCategories([...categories, newCategory]);
    setIsFormOpen(false);
    toast({ title: "Category created successfully" });
  };

  const handleEdit = (data) => {
    if (editingCategory) {
      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id ? { ...c, ...data } : c
        )
      );
      setEditingCategory(undefined);
      toast({ title: "Category updated successfully" });
    }
  };

  const handleDelete = () => {
    if (deleteCategory) {
      setCategories(categories.filter((c) => c.id !== deleteCategory.id));
      setDeleteCategory(undefined);
      toast({ title: "Category deleted successfully" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Categories List
          </CardTitle>
          <CardDescription>
            You have {categories.length} categories configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="bg-surface-light border-border"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Package className="h-8 w-8 text-primary" />
                    <Badge
                      variant={
                        category.status === "active" ? "default" : "secondary"
                      }
                      className={
                        category.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }
                    >
                      {category.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-foreground">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {category.products}
                      </p>
                      <p className="text-sm text-muted-foreground">Products</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen || !!editingCategory}
        onOpenChange={() => {
          setIsFormOpen(false);
          setEditingCategory(undefined);
        }}
      >
        <DialogContent>
          <CategoryForm
            category={editingCategory}
            onSubmit={editingCategory ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingCategory(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteCategory}
        onOpenChange={() => setDeleteCategory(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? This
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
