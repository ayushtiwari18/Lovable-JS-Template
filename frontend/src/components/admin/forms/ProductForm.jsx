import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUpload from "@/components/ImageUpload.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export function EditProductForm({ product, onSubmit, onCancel }) {
  const { toast } = useToast();

  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [categories, setCategories] = useState([]);

  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [uploading, setUploading] = useState(false);

  const [inStock, setInStock] = useState(product?.in_stock || false);
  const [featured, setFeatured] = useState(product?.featured || false);
  const [featuredCount, setFeaturedCount] = useState(0);

  const [customizableFields, setCustomizableFields] = useState({
    text_input: product?.customizable_fields?.text_input || false,
    image_upload: product?.customizable_fields?.image_upload || false,
  });

  const [catalogNumber, setCatalogNumber] = useState(
    product?.catalog_number || ""
  );

  useEffect(() => {
    if (product) {
      setTitle(product.title || "");
      setDescription(product.description || "");
      setPrice(product.price || "");
      setCategoryId(product.category_id || "");
      setImageUrl(product.image_url || "");
      setInStock(product.in_stock || false);
      setFeatured(product.featured || false);
      setCustomizableFields({
        text_input: product.customizable_fields?.text_input || false,
        image_upload: product.customizable_fields?.image_upload || false,
      });
      setCatalogNumber(product.catalog_number || "");
    }
  }, [product]);

  useEffect(() => {
    async function fetchCategories() {
      let { data, error } = await supabase
        .from("categories")
        .select("id, name");
      if (!error) setCategories(data);
    }
    fetchCategories();

    async function fetchFeaturedCount() {
      let query = supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("featured", true);
      // exclude this product to avoid blocking editing if it is featured
      if (product?.id) query = query.neq("id", product.id);
      let { count, error } = await query;
      if (!error) setFeaturedCount(count);
    }
    fetchFeaturedCount();
  }, [product]);

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required.",
        variant: "destructive",
      });
      return;
    }
    if (!price || Number(price) < 0) {
      toast({
        title: "Validation Error",
        description: "Price must be a positive number.",
        variant: "destructive",
      });
      return;
    }
    if (!categoryId) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      });
      return;
    }
    if (featured && featuredCount >= 4) {
      toast({
        title: "Featured limit reached",
        description:
          "Maximum 4 featured products allowed. Unfeature one before updating.",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      id: product.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category_id: categoryId,
      image_url: imageUrl,
      in_stock: inStock,
      customizable_fields: customizableFields,
      featured,
      catalog_number: catalogNumber.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Product</DialogTitle>
      </DialogHeader>
      <form onSubmit={validateAndSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Product title"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description"
            rows={4}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Current Image</Label>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                borderRadius: 6,
                border: "1px solid #ccc",
                marginBottom: 8,
              }}
            />
          ) : (
            <p>No image uploaded yet</p>
          )}
          <ImageUpload
            onUploadStart={handleUploadStart}
            onUploadSuccess={onUploadSuccess}
            maxFiles={1}
            accept="image/*"
          />
          {uploading && <p>Uploading image...</p>}
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="in_stock"
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="cursor-pointer"
          />
          <Label htmlFor="in_stock">In Stock</Label>
        </div>

        <fieldset className="border p-3 rounded space-y-2">
          <legend className="font-semibold">Customizable Fields</legend>
          <div className="flex items-center space-x-2">
            <input
              id="custom_text_input"
              type="checkbox"
              checked={customizableFields.text_input}
              onChange={(e) =>
                setCustomizableFields((prev) => ({
                  ...prev,
                  text_input: e.target.checked,
                }))
              }
            />
            <Label htmlFor="custom_text_input">Text Input</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="custom_image_upload"
              type="checkbox"
              checked={customizableFields.image_upload}
              onChange={(e) =>
                setCustomizableFields((prev) => ({
                  ...prev,
                  image_upload: e.target.checked,
                }))
              }
            />
            <Label htmlFor="custom_image_upload">Image Upload</Label>
          </div>
        </fieldset>

        <div>
          <Label htmlFor="catalog_number">Catalog Number</Label>
          <Input
            id="catalog_number"
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value)}
            placeholder="Optional catalog number"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="featured"
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            disabled={featuredCount >= 4 && !featured} // allow unchecking
            className="cursor-pointer"
          />
          <Label htmlFor="featured">
            Feature this product{" "}
            {featuredCount >= 4 && !featured && "(Limit reached: 4)"}
          </Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            Update
          </Button>
        </div>
      </form>
    </div>
  );
}
