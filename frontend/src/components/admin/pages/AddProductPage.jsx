import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload.jsx";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

export default function AddProductPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [customizableFields, setCustomizableFields] = useState({
    text_input: false,
    image_upload: false,
  });
  const [catalogNumber, setCatalogNumber] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) {
        toast({ title: "Failed to load categories", variant: "destructive" });
      } else {
        setCategories(data || []);
      }
    }

    async function fetchFeaturedCount() {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("featured", true);

      if (!error) setFeaturedCount(count);
    }

    fetchCategories();
    fetchFeaturedCount();
  }, [toast]);

  const onUploadSuccess = (imgData) => {
    setImageUrl(imgData.url || imgData.cloudinary_url || "");
    toast({ title: "Image uploaded successfully" });
    setUploading(false);
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const validateAndSubmit = async (e) => {
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
          "Maximum 4 featured products allowed. Unfeature one before adding.",
        variant: "destructive",
      });
      return;
    }

    const newProduct = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category_id: categoryId,
      image_url: imageUrl,
      in_stock: inStock,
      customizable_fields: customizableFields,
      featured,
      catalog_number: catalogNumber.trim(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("products").insert([newProduct]);

    if (error) {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Product added successfully" });
      navigate("/admin/products");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">
        Add New Product
      </h1>
      <form onSubmit={validateAndSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Product title"
            required
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="font-medium text-gray-700">
            Description
          </Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description"
            rows={5}
            className="mt-1 w-full border border-gray-300 rounded-md p-3 resize-y
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
        </div>

        {/* Price and Category in Two Columns on medium+ screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="price" className="font-medium text-gray-700">
              Price <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 19.99"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category" className="font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full mt-1 p-3 border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <Label className="font-medium text-gray-700 mb-2 block">
            Product Image
          </Label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Product"
              className="w-32 h-32 object-cover rounded-md border border-gray-300 mb-3"
            />
          )}
          <ImageUpload
            onUploadStart={handleUploadStart}
            onUploadSuccess={onUploadSuccess}
            maxFiles={1}
            accept="image/*"
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
          )}
        </div>

        {/* In Stock and Featured checkboxes */}
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center">
            <input
              id="in_stock"
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <Label
              htmlFor="in_stock"
              className="ml-2 text-gray-700 cursor-pointer"
            >
              In Stock
            </Label>
          </div>
          <div className="flex items-center">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              disabled={featuredCount >= 4}
              onChange={(e) => setFeatured(e.target.checked)}
              className={`h-5 w-5 focus:ring-primary border-gray-300 rounded cursor-pointer ${
                featuredCount >= 4 ? "cursor-not-allowed opacity-50" : ""
              }`}
            />
            <Label
              htmlFor="featured"
              className="ml-2 text-gray-700 cursor-pointer"
            >
              Feature this product{" "}
              {featuredCount >= 4 && (
                <span className="text-red-500 font-medium">
                  {" "}
                  (Limit reached: 4)
                </span>
              )}
            </Label>
          </div>
        </div>

        {/* Customizable Fields - checkboxes */}
        <fieldset className="border border-gray-300 rounded-md p-4 mt-6">
          <legend className="text-gray-700 font-semibold px-2">
            Customizable Fields
          </legend>
          <div className="flex flex-wrap gap-6 mt-2">
            <div className="flex items-center">
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
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
              />
              <Label
                htmlFor="custom_text_input"
                className="ml-2 text-gray-700 cursor-pointer"
              >
                Text Input
              </Label>
            </div>
            <div className="flex items-center">
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
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
              />
              <Label
                htmlFor="custom_image_upload"
                className="ml-2 text-gray-700 cursor-pointer"
              >
                Image Upload
              </Label>
            </div>
          </div>
        </fieldset>

        {/* Catalog Number */}
        <div>
          <Label htmlFor="catalog_number" className="font-medium text-gray-700">
            Catalog Number
          </Label>
          <Input
            id="catalog_number"
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value)}
            placeholder="Optional catalog number"
            className="mt-1"
          />
        </div>

        {/* Form actions */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/products")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
