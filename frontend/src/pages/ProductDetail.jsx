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
  Zap,
  Plus,
  Minus,
  Share2,
  MessageCircle,
  Phone,
  Mail,
  AlertCircle,
  Award,
  Settings,
  Sparkles,
  CreditCard,
  MapPin,
  Calendar,
  Package2,
  Info,
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
          src={
            isZoomed && enableZoom
              ? getCloudinaryImageUrl(imageUrl, "zoom")
              : currentImageUrl
          }
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
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
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
                  ? "border-primary ring-2 ring-primary/20 shadow-lg"
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

// Enhanced Product Variants Component
const ProductVariants = ({ variants, selectedVariant, onVariantSelect }) => {
  if (!variants || variants.length === 0) return null;

  const formatPrice = (priceInPaise) =>
    ((priceInPaise || 0) / 100).toLocaleString("en-IN");

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
      <div className="flex items-center space-x-2">
        <Box className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900 text-lg">
          Available Sizes & Variants
        </h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {variants.map((variant) => {
          const formattedDimensions = formatDimensions(variant.dimensions);
          const isSelected = selectedVariant?.id === variant.id;
          const inStock = (variant.stock_quantity || 0) > 0;

          return (
            <div
              key={variant.id}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-blue-600 bg-blue-600/10 shadow-lg ring-2 ring-blue-200"
                  : inStock
                  ? "border-gray-200 hover:border-blue-400 hover:shadow-md bg-white"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
              onClick={() => inStock && onVariantSelect(variant)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  {/* Size Label */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-semibold ${
                        isSelected ? "text-blue-900" : "text-gray-900"
                      }`}
                    >
                      {variant.size_code || "Standard Size"}
                    </span>
                    {isSelected && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="space-y-1">
                    {formattedDimensions && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Ruler className="h-3 w-3 mr-1.5" />
                        <span>{formattedDimensions}</span>
                      </div>
                    )}

                    {variant.weight_grams && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Weight className="h-3 w-3 mr-1.5" />
                        <span>{variant.weight_grams}g</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Stock */}
                <div className="text-right ml-4">
                  <div
                    className={`text-lg font-bold ${
                      isSelected ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    ₹{formatPrice(variant.price)}
                  </div>
                  <div className="flex items-center justify-end text-sm mt-1">
                    <div
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        inStock ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        inStock ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {inStock
                        ? `${variant.stock_quantity} in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                </div>
              </div>

              {!inStock && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  This variant is currently unavailable
                </div>
              )}
            </div>
          );
        })}
      </div>

      {variants.length > 2 && (
        <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
          💡 <strong>Tip:</strong> Different sizes may have different prices and
          availability. Select your preferred size to see the exact price and
          stock status.
        </div>
      )}
    </div>
  );
};

// Product Features Component
const ProductFeatures = ({ product }) => {
  const features = [];

  // Add features based on product properties
  if (product.is_customizable) {
    features.push({
      icon: <Palette className="h-4 w-4" />,
      title: "Fully Customizable",
      description: "Personalize with your text, colors, and designs",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    });
  }

  if (product.foil_available) {
    features.push({
      icon: <Sparkles className="h-4 w-4" />,
      title: "Foil Options Available",
      description: "Premium foil finishing for elegant look",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    });
  }

  if (product.bulk_order_allowed) {
    features.push({
      icon: <Package2 className="h-4 w-4" />,
      title: "Bulk Orders Welcome",
      description: "Special pricing for large quantities",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    });
  }

  if (product.cod_allowed) {
    features.push({
      icon: <Shield className="h-4 w-4" />,
      title: "Cash on Delivery",
      description: "Pay when you receive your order",
      color: "text-green-600",
      bgColor: "bg-green-100",
    });
  }

  if (product.featured) {
    features.push({
      icon: <Award className="h-4 w-4" />,
      title: "Featured Product",
      description: "One of our most popular items",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    });
  }

  // Always add these standard features
  features.push(
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Quality Guaranteed",
      description: "Premium materials and craftsmanship",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Fast Processing",
      description: "Quick turnaround on all orders",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    }
  );

  if (features.length === 0) return null;

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
      <div className="flex items-center space-x-2">
        <Star className="h-5 w-5 text-gray-700" />
        <h3 className="font-semibold text-gray-900 text-lg">
          Product Features
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className={`${feature.bgColor} p-2 rounded-lg flex-shrink-0`}>
              <div className={feature.color}>{feature.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">
                {feature.title}
              </h4>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Product Specs */}
      {(product.material_type || product.base_type || product.thickness) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 text-sm mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Technical Specifications
          </h4>
          <div className="flex flex-wrap gap-2">
            {product.material_type && (
              <Badge variant="secondary" className="text-xs">
                Material: {product.material_type}
              </Badge>
            )}
            {product.base_type && (
              <Badge variant="secondary" className="text-xs">
                Base: {product.base_type}
              </Badge>
            )}
            {product.thickness && (
              <Badge variant="secondary" className="text-xs">
                Thickness: {product.thickness}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Order Limits */}
      {(product.min_order_qty > 1 || product.max_order_qty) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-sm text-blue-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="font-medium">Order Information:</span>
          </div>
          <div className="text-xs text-blue-700 mt-1 space-y-1">
            {product.min_order_qty > 1 && (
              <div>• Minimum order quantity: {product.min_order_qty} units</div>
            )}
            {product.max_order_qty && (
              <div>• Maximum order quantity: {product.max_order_qty} units</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Delivery Information Component
const DeliveryInfo = ({ product, estimatedDays = 7 }) => {
  const paymentMethods = [];

  if (product.cod_allowed) {
    paymentMethods.push({
      icon: <Package className="h-3 w-3" />,
      name: "Cash on Delivery",
      description: "Pay when you receive",
    });
  }

  paymentMethods.push({
    icon: <CreditCard className="h-3 w-3" />,
    name: "Online Payment",
    description: "UPI, Cards, Net Banking",
  });

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
      <div className="flex items-center space-x-2">
        <Truck className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-900 text-lg">
          Delivery Information
        </h3>
      </div>

      {/* Delivery Time */}
      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 text-sm">
            Delivery Time
          </span>
        </div>
        <p className="text-gray-700 text-sm">
          {estimatedDays}-{estimatedDays + 3} business days
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Delivery time may vary based on location
        </p>
      </div>

      {/* Processing Time */}
      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 text-sm">
            Processing Time
          </span>
        </div>
        <p className="text-gray-700 text-sm">
          {product.is_customizable ? "2-3 business days" : "1-2 business days"}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {product.is_customizable
            ? "For customized products"
            : "Standard processing"}
        </p>
      </div>

      {/* Coverage Area */}
      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 text-sm">
            Service Area
          </span>
        </div>
        <p className="text-gray-700 text-sm">India-wide delivery available</p>
        <p className="text-xs text-gray-600 mt-1">
          Remote areas may take additional time
        </p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <h4 className="font-medium text-green-900 text-sm flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Options
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {paymentMethods.map((method, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-green-200"
            >
              <div className="text-green-600">{method.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">
                  {method.name}
                </div>
                <div className="text-xs text-gray-600">
                  {method.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="space-y-2">
        {product.is_customizable && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-800">Custom Orders:</span>
              <span className="text-blue-700 ml-1">
                Customized products take additional processing time and cannot
                be cancelled once production starts.
              </span>
            </div>
          </div>
        )}

        {product.bulk_order_allowed && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-800">Bulk Orders:</span>
              <span className="text-blue-700 ml-1">
                Contact us for bulk pricing and delivery information.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const ProductDetail = () => {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  // State management
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const [customization, setCustomization] = useState({
    text: "",
    color: "",
    size: "",
    uploadedImage: null,
  });

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch main product
        const { data: productData, error: productError } = await supabase
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

        if (productError) throw productError;
        if (!productData) throw new Error("Product not found");

        // Verify category slug matches
        if (productData.categories?.slug !== slug) {
          throw new Error("Product does not belong to this category");
        }

        setProduct(productData);

        // Fetch product variants
        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("is_active", true)
          .order("price", { ascending: true });

        if (!variantError && variantData) {
          setProductVariants(variantData);
          if (variantData.length > 0) {
            setSelectedVariant(variantData[0]);
          }
        }

        // Process product images
        const images = [];
        if (productData.image_url) {
          images.push({
            id: "main",
            image_url: productData.image_url,
            alt_text: productData.title,
            display_order: 0,
          });
        }

        // Add additional images if they exist
        if (
          productData.additional_images &&
          Array.isArray(productData.additional_images)
        ) {
          productData.additional_images.forEach((url, idx) => {
            images.push({
              id: `additional-${idx}`,
              image_url: url,
              alt_text: `${productData.title} ${idx + 2}`,
              display_order: idx + 1,
            });
          });
        }

        setProductImages(images);

        // Set customization defaults
        if (productData.customizable_fields) {
          const fields = productData.customizable_fields;
          setCustomization((prev) => ({
            ...prev,
            color: fields.colors?.[0] || "",
            size: fields.sizes?.[0] || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (productId && slug) {
      fetchProductData();
    } else {
      setError("Missing route parameters");
      setLoading(false);
    }
  }, [productId, slug]);

  // Helper functions
  const getCurrentPrice = () => {
    return selectedVariant ? selectedVariant.price : product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) {
      return (selectedVariant.stock_quantity || 0) > 0;
    }
    return product?.in_stock || false;
  };

  const getStockQuantity = () => {
    if (selectedVariant) {
      return selectedVariant.stock_quantity || 0;
    }
    return product?.quantity || 0;
  };

  const minQuantity = product?.min_order_qty || 1;
  const maxQuantity = product?.max_order_qty || 50;

  // Action handlers
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= minQuantity && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleCustomizationChange = (field, value) => {
    setCustomization((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomization((prev) => ({
        ...prev,
        uploadedImage: file,
      }));
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      const cartItem = {
        id: selectedVariant
          ? `${product.id}-${selectedVariant.id}`
          : product.id,
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.title,
        price: getCurrentPrice() / 100,
        image: product.image_url,
        quantity: quantity,
        variant: selectedVariant
          ? {
              size: selectedVariant.size_code,
              weight: selectedVariant.weight_grams,
            }
          : null,
        customization: {
          text: customization.text,
          color: customization.color,
          size: customization.size,
          uploadedImage: customization.uploadedImage?.name,
        },
      };

      addItem(cartItem);
      toast({
        title: "Added to Cart!",
        description: `${product.title} (${quantity} ${
          quantity > 1 ? "items" : "item"
        }) has been added to your cart.`,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    setIsBuying(true);
    try {
      await clearCart();

      const cartItem = {
        id: selectedVariant
          ? `${product.id}-${selectedVariant.id}`
          : product.id,
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.title,
        price: getCurrentPrice() / 100,
        image: product.image_url,
        quantity: quantity,
        variant: selectedVariant
          ? {
              size: selectedVariant.size_code,
              weight: selectedVariant.weight_grams,
            }
          : null,
        customization: {
          text: customization.text,
          color: customization.color,
          size: customization.size,
          uploadedImage: customization.uploadedImage?.name,
        },
      };

      addItem(cartItem);
      toast({
        title: "Proceeding to Checkout",
        description: "Redirecting to checkout...",
      });

      setTimeout(() => navigate("/checkout"), 500);
    } catch (error) {
      console.error("Buy Now error:", error);
      toast({
        title: "Error",
        description: "Failed to proceed to checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBuying(false);
    }
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  const formatPrice = (priceInPaise) =>
    ((priceInPaise || 0) / 100).toLocaleString("en-IN");

  const getCustomizationOptions = (type) => {
    if (!product?.customizable_fields) return [];
    const fields = product.customizable_fields;
    const options = type === "color" ? fields.colors : fields.sizes;
    return Array.isArray(options) ? options : [];
  };

  const colorOptions = getCustomizationOptions("color");
  const sizeOptions = getCustomizationOptions("size");

  // Loading state
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

  // Error state
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
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <ImageGallery product={product} productImages={productImages} />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Header Section */}
              <div className="space-y-4">
                <div className="flex items-center flex-wrap gap-2">
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
                  {product.featured && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                      Featured
                    </Badge>
                  )}
                </div>

                <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                  {product.title}
                </h1>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold text-primary">
                      ₹{formatPrice(getCurrentPrice())}
                    </span>
                    {selectedVariant &&
                      selectedVariant.price !== product.price && (
                        <span className="text-lg text-gray-500 line-through">
                          ₹{formatPrice(product.price)}
                        </span>
                      )}
                  </div>

                  {selectedVariant && (
                    <p className="text-sm text-gray-600">
                      Price for{" "}
                      {selectedVariant.size_code || "selected variant"}
                    </p>
                  )}
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={getCurrentStock() ? "default" : "destructive"}
                    className={`${
                      getCurrentStock()
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}
                  >
                    {getCurrentStock() ? (
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
                    )}
                    {getCurrentStock()
                      ? `In Stock (${getStockQuantity()})`
                      : "Out of Stock"}
                  </Badge>

                  {product.min_order_qty && product.min_order_qty > 1 && (
                    <span className="text-sm text-gray-600">
                      Min. Order: {product.min_order_qty} units
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-gray max-w-none bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <p className="text-gray-700 leading-relaxed text-lg m-0">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.material_type && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Palette className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Material
                      </span>
                    </div>
                    <p className="text-gray-700">{product.material_type}</p>
                  </div>
                )}

                {(selectedVariant?.weight_grams || product.weight_grams) && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Weight className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Weight</span>
                    </div>
                    <p className="text-gray-700">
                      {selectedVariant?.weight_grams || product.weight_grams}g
                    </p>
                  </div>
                )}

                {formatDimensions(
                  selectedVariant?.dimensions || product.dimensions
                ) && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ruler className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Dimensions
                      </span>
                    </div>
                    <p className="text-gray-700">
                      {formatDimensions(
                        selectedVariant?.dimensions || product.dimensions
                      )}
                    </p>
                  </div>
                )}

                {product.thickness && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Ruler className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Thickness
                      </span>
                    </div>
                    <p className="text-gray-700">{product.thickness}</p>
                  </div>
                )}

                {product.base_type && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Base Type
                      </span>
                    </div>
                    <p className="text-gray-700">{product.base_type}</p>
                  </div>
                )}

                {product.foil_available && (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Foil Option
                      </span>
                    </div>
                    <p className="text-gray-700">Available</p>
                  </div>
                )}
              </div>

              {/* Product Variants */}
              {productVariants.length > 0 && (
                <ProductVariants
                  variants={productVariants}
                  selectedVariant={selectedVariant}
                  onVariantSelect={handleVariantSelect}
                />
              )}

              {/* Delivery Information */}
              <DeliveryInfo product={product} estimatedDays={7} />

              {/* Product Features */}
              <ProductFeatures product={product} />

              {/* Customization Options */}
              {(product.is_customizable ||
                colorOptions.length > 0 ||
                sizeOptions.length > 0) && (
                <div className="space-y-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                  <h3 className="font-semibold text-purple-900 text-lg flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Customize Your Product
                  </h3>

                  {/* Custom Text */}
                  {product.is_customizable && (
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
                          handleCustomizationChange("text", e.target.value)
                        }
                        className="mt-2 resize-none border-purple-200 focus:border-purple-400"
                        rows={3}
                      />
                      <p className="text-xs text-purple-600 mt-1">
                        Add custom text for engraving, embossing, or printing on
                        your product
                      </p>
                    </div>
                  )}

                  {/* Color Options */}
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
                              handleCustomizationChange("color", color)
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

                  {/* Size Options */}
                  {sizeOptions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-purple-900">
                        Customization Size Options
                      </Label>
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {sizeOptions.map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              handleCustomizationChange("size", size)
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
                      <p className="text-xs text-purple-600 mt-2">
                        Note: This is different from product size variants and
                        relates to customization options
                      </p>
                    </div>
                  )}

                  {/* Image Upload */}
                  {product.is_customizable && (
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
                      <p className="text-xs text-purple-600 mt-1">
                        Upload an image for printing, engraving, or custom
                        design work
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector & Actions */}
              <div className="space-y-6">
                {/* Quantity Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-gray-900">
                      Quantity
                    </label>
                    {(minQuantity > 1 || maxQuantity < 50) && (
                      <div className="text-xs text-gray-600">
                        Min: {minQuantity}, Max: {maxQuantity}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= minQuantity}
                        className="h-10 w-10 p-0 hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center justify-center w-16 h-10 text-center font-medium border-x border-gray-300">
                        {quantity}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= maxQuantity}
                        className="h-10 w-10 p-0 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {quantity > 1 && (
                      <div className="text-sm text-gray-600">
                        Total: ₹
                        {(
                          ((getCurrentPrice() || 0) * quantity) /
                          100
                        ).toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Warning */}
                {!getCurrentStock() && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Out of Stock:</span>
                      <span className="ml-1">
                        This item is currently unavailable.
                      </span>
                    </div>
                  </div>
                )}

                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!getCurrentStock() || isAddingToCart}
                    className="h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </Button>

                  <Button
                    onClick={handleBuyNow}
                    disabled={!getCurrentStock() || isBuying}
                    className="h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBuying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {isBuying ? "Processing..." : "Buy Now"}
                  </Button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={handleToggleFavourite}
                    className={`h-12 ${
                      isFavourite(product.id)
                        ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                        : "hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${
                        isFavourite(product.id) ? "fill-current" : ""
                      }`}
                    />
                    {isFavourite(product.id) ? "Saved" : "Save"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="h-12 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>

                  <Button
                    variant="outline"
                    className="h-12 hover:border-green-300 hover:text-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ask
                  </Button>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 text-sm">
                    Need Help?
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <a
                      href="tel:+919876543210"
                      className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">Call Us</span>
                    </a>
                    <a
                      href="mailto:support@example.com"
                      className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email Us</span>
                    </a>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Get personalized assistance for bulk orders, customization,
                    or any questions.
                  </p>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center space-x-4 pt-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-green-200 text-green-700 bg-green-50"
                  >
                    ✓ Authentic Products
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-200 text-blue-700 bg-blue-50"
                  >
                    ✓ Secure Payment
                  </Badge>
                  {product.cod_allowed && (
                    <Badge
                      variant="outline"
                      className="text-xs border-purple-200 text-purple-700 bg-purple-50"
                    >
                      ✓ COD Available
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
