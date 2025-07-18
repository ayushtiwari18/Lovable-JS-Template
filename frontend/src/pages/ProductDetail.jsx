import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { Star, Upload, ShoppingCart, Heart, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  // Product state
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customization state
  const [customization, setCustomization] = useState({
    text: "",
    color: "",
    size: "",
    uploadedImage: null,
  });

  // Fetch product data from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, let's try without .single() to see what we get
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (
              id,
              name
            )
          `
          )
          .eq("id", productId);

        if (productError) {
          console.error("Supabase error:", productError);
          throw productError;
        }

        // Check if we got any data
        if (!productData || productData.length === 0) {
          throw new Error("Product not found");
        }

        // Check if we got multiple rows (shouldn't happen with unique ID)
        if (productData.length > 1) {
          console.warn("Multiple products found for ID:", productId);
        }

        // Take the first product
        const product = productData[0];
        setProduct(product);

        // Handle additional images from the array field
        const additionalImages = product.additional_images || [];
        const allImages = [];

        // Add main image
        if (product.image_url) {
          allImages.push({
            id: "main",
            image_url: product.image_url,
            alt_text: product.title,
            display_order: 0,
          });
        }

        // Add additional images
        additionalImages.forEach((imageUrl, index) => {
          allImages.push({
            id: `additional-${index}`,
            image_url: imageUrl,
            alt_text: `${product.title} ${index + 2}`,
            display_order: index + 1,
          });
        });

        setProductImages(allImages);

        // Set default customization options from customizable_fields
        const customizableFields = product.customizable_fields || {};
        const defaultColor = customizableFields.colors?.[0] || "";
        const defaultSize = customizableFields.sizes?.[0] || "";

        setCustomization((prev) => ({
          ...prev,
          color: defaultColor,
          size: defaultSize,
        }));
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      // Validate that productId looks like a UUID
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        setError("Invalid product ID format");
        setLoading(false);
        return;
      }

      fetchProduct();
    } else {
      setError("No product ID provided");
      setLoading(false);
    }
  }, [productId]);

  // Get customization options from customizable_fields
  const getCustomizationOptions = (type) => {
    if (!product?.customizable_fields) return [];

    const fields = product.customizable_fields;
    switch (type) {
      case "color":
        return fields.colors || [];
      case "size":
        return fields.sizes || [];
      default:
        return [];
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.title,
      price: product.price / 100, // Convert from cents to dollars
      image: product.image_url,
      customization: {
        text: customization.text,
        color: customization.color,
        size: customization.size,
        uploadedImage: customization.uploadedImage?.name,
      },
    });

    toast({
      title: "Added to Cart!",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleToggleFavourite = () => {
    if (!product) return;

    if (isFavourite(product.id)) {
      removeFromFavourites(product.id);
      toast({
        title: "Removed from Favourites",
        description: `${product.title} has been removed from your favourites.`,
      });
    } else {
      addToFavourites(product);
      toast({
        title: "Added to Favourites",
        description: `${product.title} has been added to your favourites.`,
      });
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomization({ ...customization, uploadedImage: file });
    }
  };

  // Format price from cents to dollars
  const formatPrice = (priceInCents) => {
    return (priceInCents / 100).toFixed(2);
  };

  // Parse features - handle different data types
  const parseFeatures = (features) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === "string") {
      try {
        return JSON.parse(features);
      } catch {
        return features.split(",").map((f) => f.trim());
      }
    }
    return [];
  };

  // Get rating (default to 0 if not available)
  const getProductRating = () => {
    return product?.rating || 0;
  };

  // Get review count (default to 0 if not available)
  const getReviewCount = () => {
    return product?.review_count || 0;
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading product...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-red-600 mb-4">
                {error || "Product not found"}
              </p>
              <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const colorOptions = getCustomizationOptions("color");
  const sizeOptions = getCustomizationOptions("size");
  const features = parseFeatures(product.features);
  const rating = getProductRating();
  const reviewCount = getReviewCount();

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.slice(0, 4).map((img, index) => (
                    <div
                      key={img.id || index}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                    >
                      <img
                        src={img.image_url || "/placeholder.svg"}
                        alt={img.alt_text || `${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="text-primary font-medium">
                  {product.categories?.name || "Uncategorized"}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">
                  {product.title}
                </h1>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {rating} ({reviewCount} reviews)
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary mt-4">
                  ${formatPrice(product.price)}
                </div>
              </div>

              {product.description && (
                <p className="text-gray-600">{product.description}</p>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Features:
                  </h3>
                  <ul className="space-y-2">
                    {features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-gray-600"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Customization Options */}
              {(colorOptions.length > 0 || sizeOptions.length > 0) && (
                <div className="space-y-4 p-6 bg-gray-50 rounded-2xl">
                  <h3 className="font-semibold text-gray-900">
                    Customize Your Product
                  </h3>

                  {/* Custom Text */}
                  <div>
                    <Label htmlFor="customText">Custom Text (Optional)</Label>
                    <Textarea
                      id="customText"
                      placeholder="Enter text for engraving..."
                      value={customization.text}
                      onChange={(e) =>
                        setCustomization({
                          ...customization,
                          text: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>

                  {/* Color Selection */}
                  {colorOptions.length > 0 && (
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              setCustomization({ ...customization, color })
                            }
                            className={`px-4 py-2 rounded-lg border ${
                              customization.color === color
                                ? "border-primary bg-primary text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                            } transition-colors`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selection */}
                  {sizeOptions.length > 0 && (
                    <div>
                      <Label>Size</Label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {sizeOptions.map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              setCustomization({ ...customization, size })
                            }
                            className={`px-4 py-2 rounded-lg border ${
                              customization.size === size
                                ? "border-primary bg-primary text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                            } transition-colors`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="imageUpload">Upload Image (Optional)</Label>
                    <div className="mt-2">
                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() =>
                          document.getElementById("imageUpload")?.click()
                        }
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {customization.uploadedImage
                          ? customization.uploadedImage.name
                          : "Choose Image"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1"
                  disabled={!product.in_stock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.in_stock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button variant="outline" onClick={handleToggleFavourite}>
                  <Heart
                    className={`h-4 w-4 ${
                      isFavourite(product.id) ? "text-red-500 fill-current" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
