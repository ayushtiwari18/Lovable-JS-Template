import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Heart,
  Loader2,
  ShoppingBag,
  Eye,
  Tag,
  Package,
  Shield,
} from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

// Helper function to format dimensions
const formatDimensions = (dimensions) => {
  if (!dimensions) return null;

  if (typeof dimensions === "string") {
    return dimensions;
  }

  if (typeof dimensions === "object") {
    const {
      length,
      width,
      height,
      base_width,
      base_depth,
      unit = "cm",
    } = dimensions;

    // Try different dimension combinations
    if (length && width && height) {
      return `${length}×${width}×${height} ${unit}`;
    } else if (base_width && base_depth && height) {
      return `${base_width}×${base_depth}×${height} ${unit}`;
    } else if (length && width) {
      return `${length}×${width} ${unit}`;
    } else if (base_width && base_depth) {
      return `${base_width}×${base_depth} ${unit}`;
    } else {
      // Fallback: just show available dimensions
      const dims = [];
      if (length) dims.push(`L:${length}`);
      if (width) dims.push(`W:${width}`);
      if (height) dims.push(`H:${height}`);
      if (base_width) dims.push(`W:${base_width}`);
      if (base_depth) dims.push(`D:${base_depth}`);
      return dims.length > 0 ? `${dims.join(" × ")} ${unit}` : null;
    }
  }

  return null;
};

// Helper function to safely parse features
const parseFeatures = (features) => {
  if (!features) return [];
  if (Array.isArray(features)) return features;

  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // If it's a string, try to split by commas
    if (typeof features === "string") {
      return features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    }
    return [];
  }
};

// Cloudinary helper function
const getCloudinaryImageUrl = (imageUrl, transformation = "medium") => {
  if (!imageUrl) return null;

  // If it's already a Cloudinary URL, apply transformations
  if (imageUrl.includes("cloudinary.com")) {
    // Extract public_id from existing Cloudinary URL
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
        large: "c_fill,h_600,q_auto,w_600,f_auto",
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.medium
      }/${publicId}`;
    }
  }

  return imageUrl; // Return original if not Cloudinary
};

// Enhanced product image component with fallback
const ProductImage = ({ product, className }) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  useEffect(() => {
    if (product.image_url || product.image) {
      const imageUrl = product.image_url || product.image;
      const optimizedUrl = getCloudinaryImageUrl(imageUrl, "medium");
      setCurrentImageUrl(optimizedUrl);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [product.image_url, product.image]);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    const originalUrl = product.image_url || product.image;
    // Try fallback to original URL if Cloudinary fails
    if (currentImageUrl !== originalUrl && originalUrl) {
      setCurrentImageUrl(originalUrl);
      setImageState("loading");
    } else {
      setImageState("error");
    }
  };

  // Show fallback icon if no image, loading, or error
  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center group-hover:from-primary/15 group-hover:to-primary/10 transition-all duration-300`}
      >
        <ShoppingBag className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-xs text-primary/70 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-2">
          {(product.name || product.title)?.slice(0, 15) || "Product"}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Loading skeleton */}
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

      {/* Actual image */}
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={product.name || product.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
    </div>
  );
};

const ProductCard = ({
  product,
  categoryName,
  slug,
  onToggleFavourite,
  isFavourite,
}) => {
  const [showDescription, setShowDescription] = useState(false);

  // Safely format dimensions
  const formattedDimensions = formatDimensions(product.dimensions);

  // Safely parse features
  const features = parseFeatures(product.features);

  // Safe price formatting
  const formatPrice = (price) => {
    if (!price) return "Price on request";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice)
      ? "Price on request"
      : `₹${numPrice.toLocaleString("en-IN")}`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group relative border border-gray-100 hover:border-primary/20">
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <ProductImage product={product} className="w-full h-full" />

        {/* Image Overlay with Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

        {/* Favourite Button */}
        <button
          onClick={() => onToggleFavourite(product)}
          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavourite(product.id)
                ? "text-red-500 fill-current"
                : "text-gray-600 hover:text-red-400"
            }`}
          />
        </button>

        {/* Stock/Availability Badge */}
        {product.stock_quantity !== undefined && (
          <div className="absolute top-4 left-4">
            <Badge
              variant={product.stock_quantity > 0 ? "secondary" : "destructive"}
              className={`${
                product.stock_quantity > 0
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-red-100 text-red-700 border-red-200"
              } backdrop-blur-sm font-medium`}
            >
              {product.stock_quantity > 0
                ? `${product.stock_quantity} in stock`
                : "Out of stock"}
            </Badge>
          </div>
        )}

        {/* Quick View Button (appears on hover) */}
        <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Link
            to={`/category/${slug}/products/${product.id}`}
            className="block"
          >
            <Button
              size="sm"
              className="w-full bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white shadow-lg border-0"
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-6 space-y-4">
        {/* Category & Rating Row */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className="text-primary border-primary/30 bg-primary/5 font-medium"
          >
            <Tag className="h-3 w-3 mr-1" />
            {categoryName}
          </Badge>
          {product.rating && (
            <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {Number(product.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {product.title || product.name}
          </h3>

          {/* Short Description */}
          {product.description && (
            <p
              className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${
                showDescription ? "" : "line-clamp-2"
              }`}
            >
              {product.description}
            </p>
          )}

          {product.description && product.description.length > 120 && (
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="text-primary text-xs font-medium mt-1 hover:underline"
            >
              {showDescription ? "Show Less" : "Read More"}
            </button>
          )}
        </div>

        {/* Product Specifications */}
        <div className="space-y-2">
          {(product.material_type || product.material) && (
            <div className="flex items-center text-sm text-gray-600">
              <Package className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Material:</span>
              <span>{product.material_type || product.material}</span>
            </div>
          )}

          {formattedDimensions && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="h-4 w-4 mr-2 text-gray-400 flex items-center justify-center">
                📏
              </div>
              <span className="font-medium mr-2">Size:</span>
              <span>{formattedDimensions}</span>
            </div>
          )}

          {(product.weight_grams || product.weight) && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="h-4 w-4 mr-2 text-gray-400 flex items-center justify-center">
                ⚖️
              </div>
              <span className="font-medium mr-2">Weight:</span>
              <span>
                {product.weight_grams
                  ? `${product.weight_grams}g`
                  : product.weight}
              </span>
            </div>
          )}
        </div>

        {/* Features/Benefits */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {features.slice(0, 3).map((feature, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-700 border-0"
              >
                {feature}
              </Badge>
            ))}
            {features.length > 3 && (
              <Badge
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-700 border-0"
              >
                +{features.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Trust Signals */}
        <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <Shield className="h-3 w-3 mr-1" />
            Authentic
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Package className="h-3 w-3 mr-1" />
            Quality Assured
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            {product.original_price &&
              product.original_price > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.original_price &&
              product.original_price > product.price && (
                <span className="text-xs text-green-600 font-medium">
                  Save ₹
                  {(product.original_price - product.price).toLocaleString(
                    "en-IN"
                  )}
                </span>
              )}
          </div>

          <Link to={`/category/${slug}/products/${product.id}`}>
            <Button
              size="lg"
              className="px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const Category = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("Category");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Get the category by slug
        const { data: categories, error: categoryError } = await supabase
          .from("categories")
          .select("id, name")
          .eq("slug", slug)
          .single();

        if (categoryError || !categories) {
          throw new Error("Category not found");
        }

        const categoryId = categories.id;
        setCategoryName(categories.name);

        // Step 2: Fetch products for this category with all details
        const { data: productsData, error: productError } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (name)
          `
          )
          .eq("category_id", categoryId)
          .order("created_at", { ascending: false });

        if (productError) {
          throw productError;
        }

        setProducts(productsData || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProducts();
    }
  }, [slug]);

  const handleToggleFavourite = (product) => {
    const favouriteItem = {
      id: product.id,
      name: product.title || product.name,
      price: product.price,
      image: product.image || product.image_url,
      category: categoryName,
      rating: product.rating,
    };

    if (isFavourite(product.id)) {
      removeFromFavourites(product.id);
      toast({
        title: "Removed from Favourites",
        description: `${
          product.title || product.name
        } has been removed from your favourites.`,
      });
    } else {
      addToFavourites(favouriteItem);
      toast({
        title: "Added to Favourites",
        description: `${
          product.title || product.name
        } has been added to your favourites.`,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <div className="space-y-2">
                <p className="text-gray-700 text-xl font-medium">
                  Loading products...
                </p>
                <p className="text-gray-500 text-sm">
                  Fetching the best handicrafts for you
                </p>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
              <div className="text-red-100 bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  if (products.length === 0) {
    return (
      <Layout>
        <section className="py-16 bg-gradient-to-br from-gray-50 to-white min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
              <div className="text-primary bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Products Found
              </h3>
              <p className="text-gray-600 mb-6">
                No products are available in{" "}
                <span className="font-medium text-primary">{categoryName}</span>{" "}
                category yet.
              </p>
              <Link to="/">
                <Button className="w-full">Browse All Categories</Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="container mx-auto px-4">
          {/* Category Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Tag className="h-4 w-4 text-primary mr-2" />
              <span className="text-primary font-medium text-sm">Category</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {categoryName}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our handcrafted collection of{" "}
              {categoryName.toLowerCase()} - each piece tells a unique story
            </p>
            <div className="flex items-center justify-center mt-6 space-x-2 text-sm text-gray-500">
              <span>{products.length} products</span>
              <span>•</span>
              <span>Handcrafted with love</span>
              <span>•</span>
              <span>Authentic quality</span>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={categoryName}
                slug={slug}
                onToggleFavourite={handleToggleFavourite}
                isFavourite={isFavourite}
              />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Category;
