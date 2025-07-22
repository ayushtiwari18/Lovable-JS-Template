import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Upload,
  ShoppingCart,
  Heart,
  ArrowLeft,
  Package,
  ImageOff,
  Loader2,
  ZoomIn,
  Truck,
  Shield,
  Weight,
  Ruler,
  CheckCircle,
  Clock,
  Tag,
  Box,
  Palette,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

// Cloudinary helper function
const getCloudinaryImageUrl = (imageUrl, transformation = "medium") => {
  if (!imageUrl) return null;

  if (imageUrl.includes("cloudinary.com")) {
    const publicIdMatch = imageUrl.match(
      /\/([^\/]+)\.(jpg|jpeg|png|webp|auto)$/i
    );
    if (publicIdMatch) {
      const publicId = publicIdMatch[1];
      const baseUrl =
        "https://res.cloudinary.com/Shrifal-Handicraft/image/upload";

      const transformations = {
        thumbnail: "c_fill,h_150,q_auto,w_150,f_auto",
        medium: "c_fill,h_400,q_auto,w_400,f_auto",
        large: "c_fill,h_800,q_auto,w_800,f_auto",
        hero: "c_fill,h_600,q_auto,w_600,f_auto",
        zoom: "c_fill,h_1200,q_auto,w_1200,f_auto",
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.medium
      }/${publicId}`;
    }
  }

  return imageUrl;
};

// Helper function to format dimensions
const formatDimensions = (dimensions) => {
  if (!dimensions) return null;

  if (typeof dimensions === "string") {
    return dimensions;
  }

  if (typeof dimensions === "object") {
    const { length, width, height, unit = "cm" } = dimensions;

    if (length && width && height) {
      return `${length}×${width}×${height} ${unit}`;
    } else if (length && width) {
      return `${length}×${width} ${unit}`;
    } else {
      // If the object structure is different, convert to string
      return JSON.stringify(dimensions);
    }
  }

  return null;
};

// Enhanced product image component with zoom functionality
const ProductImage = ({
  imageUrl,
  alt,
  className,
  fallbackTitle,
  transformation = "hero",
  onClick,
  enableZoom = false,
}) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageUrl) {
      const optimizedUrl = getCloudinaryImageUrl(imageUrl, transformation);
      setCurrentImageUrl(optimizedUrl);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [imageUrl, transformation]);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    if (currentImageUrl !== imageUrl && imageUrl) {
      setCurrentImageUrl(imageUrl);
      setImageState("loading");
    } else {
      setImageState("error");
    }
  };

  const handleMouseMove = (e) => {
    if (!enableZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center cursor-pointer hover:from-primary/15 hover:to-primary/10 transition-all duration-300`}
        onClick={onClick}
      >
        <Package className="h-20 w-20 text-primary mb-3" />
        <span className="text-sm text-primary/70 font-medium text-center px-4">
          {fallbackTitle || "Product Image"}
        </span>
        <span className="text-xs text-primary/50 mt-1">No image available</span>
      </div>
    );
  }

  return (
    <div
      className={`${className} relative overflow-hidden group`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => enableZoom && setIsZoomed(true)}
      onMouseLeave={() => enableZoom && setIsZoomed(false)}
    >
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

      {enableZoom && imageState === "loaded" && (
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <ZoomIn className="h-4 w-4" />
        </div>
      )}

      {currentImageUrl && (
        <img
          src={getCloudinaryImageUrl(
            imageUrl,
            isZoomed && enableZoom ? "zoom" : transformation
          )}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 cursor-pointer ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          } ${
            enableZoom && isZoomed
              ? "scale-150 transform-gpu"
              : "hover:scale-105"
          }`}
          style={
            enableZoom && isZoomed
              ? {
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                }
              : {}
          }
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Enhanced image gallery with zoom
const ImageGallery = ({ product, productImages }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const allImages =
    productImages.length > 0
      ? productImages
      : [
          {
            id: "main",
            image_url: product?.image_url,
            alt_text: product?.title,
            display_order: 0,
          },
        ];

  return (
    <div className="space-y-4">
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
        <ProductImage
          imageUrl={allImages[selectedImage]?.image_url}
          alt={allImages[selectedImage]?.alt_text || product?.title}
          className="w-full h-full"
          fallbackTitle={product?.title}
          transformation="hero"
          enableZoom={true}
        />
      </div>

      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.slice(0, 4).map((img, index) => (
            <div
              key={img.id || index}
              className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                selectedImage === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-gray-300"
              }`}
              onClick={() => setSelectedImage(index)}
            >
              <ProductImage
                imageUrl={img.image_url}
                alt={img.alt_text || `${product?.title} ${index + 1}`}
                className="w-full h-full"
                fallbackTitle={`Image ${index + 1}`}
                transformation="thumbnail"
              />
            </div>
          ))}
        </div>
      )}

      {allImages.length > 4 && (
        <div className="text-center">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            +{allImages.length - 4} more images
          </span>
        </div>
      )}
    </div>
  );
};

// Fixed Product Variants Component
const ProductVariants = ({ variants, selectedVariant, onVariantSelect }) => {

  
  if (!variants || variants.length === 0) return null;

  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="flex items-center space-x-2">
        <Box className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-gray-900">Available Variants</h3>
      </div>

      <div className="space-y-3">
        {variants.map((variant) => {
          const formattedDimensions = formatDimensions(variant.dimensions);

          return (
            <div
              key={variant.id}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedVariant?.id === variant.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-gray-200 hover:border-primary/50 hover:shadow-sm"
              }`}
              onClick={() => onVariantSelect(variant)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {variant.size_label || "Standard Size"}
                    </span>
                    {variant.size_code && (
                      <Badge variant="outline" className="text-xs">
                        {variant.size_code}
                      </Badge>
                    )}
                  </div>

                  {formattedDimensions && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Ruler className="h-3 w-3 mr-1" />
                      <span>{formattedDimensions}</span>
                    </div>
                  )}

                  {variant.weight_grams && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Weight className="h-3 w-3 mr-1" />
                      <span>{variant.weight_grams}g</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    ₹{((variant.price || 0) / 100).toLocaleString("en-IN")}
                  </div>
                  <div className="flex items-center text-sm">
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${
                        (variant.stock_quantity || 0) > 0
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span
                      className={
                        (variant.stock_quantity || 0) > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {(variant.stock_quantity || 0) > 0
                        ? `${variant.stock_quantity} in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Delivery Information Component
const DeliveryInfo = ({ estimatedDays = 7, codAllowed, bulkOrderAllowed }) => {
  const currentDate = new Date();
  const deliveryDate = new Date(
    currentDate.getTime() + estimatedDays * 24 * 60 * 60 * 1000
  );

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Truck className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Delivery Information</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Estimated Delivery
            </span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-blue-900">
              {estimatedDays} days
            </div>
            <div className="text-xs text-blue-700">
              by{" "}
              {deliveryDate.toLocaleDateString("en-IN", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">Cash on Delivery</span>
          <span
            className={`font-medium ${
              codAllowed ? "text-green-600" : "text-red-600"
            }`}
          >
            {codAllowed ? "Available" : "Not Available"}
          </span>
        </div>

        {bulkOrderAllowed && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Bulk Orders</span>
            <span className="font-medium text-green-600">Available</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [customization, setCustomization] = useState({
    text: "",
    color: "",
    size: "",
    uploadedImage: null,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (
              id,
              name,
              slug
            )
          `
          )
          .eq("id", productId)
          .single();

        if (fetchError) {
          console.error("Fetch error:", fetchError);
          throw fetchError;
        }
        if (!data) throw new Error("Product not found");

        if (data.categories?.slug !== slug) {
          throw new Error("Product does not belong to this category");
        }

        setProduct(data);

        // Fetch product variants
        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("is_active", true)
          .order("price", { ascending: true });

        if (!variantError && variantData && variantData.length > 0) {
          setProductVariants(variantData);
          setSelectedVariant(variantData[0]);
        }

        // Process images
        const allImages = [];
        if (data.image_url) {
          allImages.push({
            id: "main",
            image_url: data.image_url,
            alt_text: data.title,
            display_order: 0,
          });
        }

        if (data.additional_images && Array.isArray(data.additional_images)) {
          data.additional_images.forEach((url, idx) => {
            allImages.push({
              id: `additional-${idx}`,
              image_url: url,
              alt_text: `${data.title} ${idx + 2}`,
              display_order: idx + 1,
            });
          });
        }

        setProductImages(allImages);

        // Set customization defaults
        const fields = data.customizable_fields || {};
        setCustomization((prev) => ({
          ...prev,
          color:
            fields.colors && Array.isArray(fields.colors)
              ? fields.colors[0] || ""
              : "",
          size:
            fields.sizes && Array.isArray(fields.sizes)
              ? fields.sizes[0] || ""
              : "",
        }));
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (!productId || !slug) {
      setError("Missing route parameters");
      setLoading(false);
      return;
    }

    fetchProduct();
  }, [productId, slug]);

  const getCurrentPrice = () => {
    return selectedVariant ? selectedVariant.price : product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) {
      return (selectedVariant.stock_quantity || 0) > 0;
    }
    return product?.in_stock || false;
  };

  const getCustomizationOptions = (type) => {
    if (!product?.customizable_fields) return [];
    const fields = product.customizable_fields;
    const options = type === "color" ? fields.colors : fields.sizes;
    return Array.isArray(options) ? options : [];
  };

  const handleAddToCart = () => {
    if (!product) return;

    const currentPrice = getCurrentPrice();
    addItem({
      id: selectedVariant ? selectedVariant.id : product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.title,
      price: currentPrice / 100,
      image: product.image_url,
      variant: selectedVariant
        ? {
            size: selectedVariant.size_label,
            dimensions: formatDimensions(selectedVariant.dimensions),
          }
        : null,
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
    const action = isFavourite(product.id)
      ? removeFromFavourites
      : addToFavourites;
    action(product);
    toast({
      title: isFavourite(product.id)
        ? "Removed from Favourites"
        : "Added to Favourites",
      description: `${product.title} has been ${
        isFavourite(product.id) ? "removed from" : "added to"
      } your favourites.`,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setCustomization({ ...customization, uploadedImage: file });
  };

  const formatPrice = (priceInPaise) =>
    ((priceInPaise || 0) / 100).toLocaleString("en-IN");

  const parseFeatures = (features) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return features
        .toString()
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    }
  };

  const colorOptions = getCustomizationOptions("color");
  const sizeOptions = getCustomizationOptions("size");
  const features = parseFeatures(product?.features);

  if (loading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-pulse flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
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
            <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-red-100 to-red-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageOff className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Product Not Found
              </h3>
              <p className="text-red-600 mb-6">
                {error || "Product not found"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={() => navigate("/shop")}>
                  Browse Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <ImageGallery product={product} productImages={productImages} />
            </div>

            <div className="space-y-6">
              {/* Header Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/30 bg-primary/5"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {product.categories?.name || "Uncategorized"}
                  </Badge>
                  {product.catalog_number && (
                    <Badge variant="secondary" className="text-xs">
                      #{product.catalog_number}
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                  {product.title}
                </h1>

                {/* Price */}
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">
                    ₹{formatPrice(getCurrentPrice())}
                  </div>
                  {selectedVariant &&
                    selectedVariant.price !== product.price && (
                      <div className="text-lg text-gray-500 line-through">
                        ₹{formatPrice(product.price)}
                      </div>
                    )}
                </div>

                {/* Stock status */}
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={getCurrentStock() ? "default" : "destructive"}
                    className={
                      getCurrentStock() ? "bg-green-100 text-green-800" : ""
                    }
                  >
                    <CheckCircle
                      className={`h-3 w-3 mr-1 ${
                        getCurrentStock() ? "text-green-600" : "text-red-600"
                      }`}
                    />
                    {getCurrentStock() ? "In Stock" : "Out of Stock"}
                  </Badge>

                  {product.min_order_qty && (
                    <span className="text-sm text-gray-600">
                      Min. Order: {product.min_order_qty} units
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-gray max-w-none bg-gray-50 p-6 rounded-2xl">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.material_type && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Palette className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Material
                      </span>
                    </div>
                    <p className="text-gray-700">{product.material_type}</p>
                  </div>
                )}

                {product.weight_grams && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Weight className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Weight</span>
                    </div>
                    <p className="text-gray-700">{product.weight_grams}g</p>
                  </div>
                )}

                {product.thickness && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ruler className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Thickness
                      </span>
                    </div>
                    <p className="text-gray-700">{product.thickness}</p>
                  </div>
                )}

                {product.foil_available && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Foil Option
                      </span>
                    </div>
                    <p className="text-gray-700">Available</p>
                  </div>
                )}
              </div>

              {/* Product Variants */}
              <ProductVariants
                variants={productVariants}
                selectedVariant={selectedVariant}
                onVariantSelect={setSelectedVariant}
              />

              {/* Delivery Information */}
              <DeliveryInfo
                estimatedDays={7}
                codAllowed={product.cod_allowed}
                bulkOrderAllowed={product.bulk_order_allowed}
              />

              {/* Features */}
              {features.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 text-lg">
                    Key Features
                  </h3>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start text-blue-800"
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Customization Options
              {(colorOptions.length > 0 ||
                sizeOptions.length > 0 ||
                product.is_customizable) && (
                <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                  <h3 className="font-semibold text-purple-900 text-lg flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Customize Your Product
                  </h3>

                  <div>
                    <Label
                      htmlFor="customText"
                      className="text-sm font-medium text-purple-900"
                    >
                      Custom Text (Optional)
                    </Label>
                    <Textarea
                      id="customText"
                      placeholder="Enter text for engraving or personalization..."
                      value={customization.text}
                      onChange={(e) =>
                        setCustomization({
                          ...customization,
                          text: e.target.value,
                        })
                      }
                      className="mt-2 resize-none border-purple-200 focus:border-purple-400"
                      rows={3}
                    />
                  </div>

                  {colorOptions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-purple-900">
                        Color Options
                      </Label>
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              setCustomization({ ...customization, color })
                            }
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                              customization.color === color
                                ? "border-purple-600 bg-purple-600 text-white shadow-lg"
                                : "border-purple-300 bg-white text-purple-700 hover:border-purple-500 hover:shadow-md"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {sizeOptions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-purple-900">
                        Size Options
                      </Label>
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {sizeOptions.map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              setCustomization({ ...customization, size })
                            }
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                              customization.size === size
                                ? "border-purple-600 bg-purple-600 text-white shadow-lg"
                                : "border-purple-300 bg-white text-purple-700 hover:border-purple-500 hover:shadow-md"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label
                      htmlFor="imageUpload"
                      className="text-sm font-medium text-purple-900"
                    >
                      Upload Custom Image (Optional)
                    </Label>
                    <div className="mt-3">
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
                        className="w-full h-12 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {customization.uploadedImage
                          ? customization.uploadedImage.name
                          : "Choose Image File"}
                      </Button>
                      {customization.uploadedImage && (
                        <p className="text-xs text-purple-600 mt-2">
                          Selected: {customization.uploadedImage.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )} */}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={!getCurrentStock()}
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {getCurrentStock() ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleFavourite}
                  className="h-14 px-6 border-2 hover:scale-105 transition-transform duration-200"
                  size="lg"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavourite(product.id) ? "text-red-500 fill-current" : ""
                    }`}
                  />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center space-x-6 pt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-1" />
                  Authentic Product
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Package className="h-4 w-4 mr-1" />
                  Secure Packaging
                </div>
                {product.cod_allowed && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="h-4 w-4 mr-1" />
                    COD Available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
