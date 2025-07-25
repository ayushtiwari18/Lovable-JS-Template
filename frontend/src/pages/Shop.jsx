import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { FeaturedCategories } from "@/components/FeaturedCategories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Star,
  Heart,
  Loader2,
  Grid3X3,
  List,
  ShoppingBag,
  Package,
  Shield,
  Eye,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

// Helper functions (same as before)
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

    if (length && width && height) {
      return `${length}×${width}×${height} ${unit}`;
    } else if (base_width && base_depth && height) {
      return `${base_width}×${base_depth}×${height} ${unit}`;
    } else if (length && width) {
      return `${length}×${width} ${unit}`;
    } else if (base_width && base_depth) {
      return `${base_width}×${base_depth} ${unit}`;
    } else {
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

const parseFeatures = (features) => {
  if (!features) return [];
  if (Array.isArray(features)) return features;

  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    if (typeof features === "string") {
      return features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    }
    return [];
  }
};

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
        large: "c_fill,h_600,q_auto,w_600,f_auto",
        original: "q_auto,f_auto",
      };

      return `${baseUrl}/${
        transformations[transformation] || transformations.medium
      }/${publicId}`;
    }
  }

  return imageUrl;
};

// Product Image Component
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
    if (currentImageUrl !== originalUrl && originalUrl) {
      setCurrentImageUrl(originalUrl);
      setImageState("loading");
    } else {
      setImageState("error");
    }
  };

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
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

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

// Product Card Component
const ProductCard = ({
  product,
  onToggleFavourite,
  isFavourite,
  viewMode = "grid",
}) => {
  const [showDescription, setShowDescription] = useState(false);

  const formattedDimensions = formatDimensions(product.dimensions);
  const features = parseFeatures(product.features);

  const formatPrice = (price) => {
    if (!price) return "Price on request";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice)
      ? "Price on request"
      : `₹${numPrice.toLocaleString("en-IN")}`;
  };

  const categorySlug = product.categories?.slug || "uncategorized";
  const categoryName = product.categories?.name || "Uncategorized";

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary/20">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="w-full sm:w-48 h-48 flex-shrink-0 relative group">
            <ProductImage product={product} className="w-full h-full" />
            <button
              onClick={() => onToggleFavourite(product)}
              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavourite(product.id)
                    ? "text-red-500 fill-current"
                    : "text-gray-600 hover:text-red-400"
                }`}
              />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 mb-4 sm:mb-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="text-primary border-primary/30 bg-primary/5"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {categoryName}
                  </Badge>
                  {product.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">
                        {Number(product.rating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {product.title || product.name}
                </h3>

                {product.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="space-y-1 mb-3">
                  {(product.material_type || product.material) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        Material: {product.material_type || product.material}
                      </span>
                    </div>
                  )}
                  {formattedDimensions && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📏</span>
                      <span>Size: {formattedDimensions}</span>
                    </div>
                  )}
                </div>

                {features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-left sm:text-right sm:ml-4">
                <div className="text-xl sm:text-2xl font-bold text-primary mb-2">
                  {formatPrice(product.price)}
                </div>
                <Link to={`/category/${categorySlug}/products/${product.id}`}>
                  <Button size="lg" className="w-full sm:w-auto shadow-lg">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group relative border border-gray-100 hover:border-primary/20">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <ProductImage product={product} className="w-full h-full" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

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

        <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Link
            to={`/category/${categorySlug}/products/${product.id}`}
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

      <div className="p-4 sm:p-6 space-y-4">
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

        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
            {product.title || product.name}
          </h3>

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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            {product.original_price &&
              product.original_price > product.price && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
            <span className="text-xl sm:text-2xl font-bold text-primary">
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

          <Link to={`/category/${categorySlug}/products/${product.id}`}>
            <Button
              size="lg"
              className="w-full sm:w-auto px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const Shop = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  // Fetch categories and all products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;

        setCategories(categoriesData || []);

        // Fetch all products for the shop page
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select(
            `
            *,
            categories!category_id (
              id,
              name,
              slug
            )
          `
          )
          .order("created_at", { ascending: false });

        if (productsError) throw productsError;

        setAllProducts(productsData || []);
        setFilteredProducts(productsData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load products. Please try again.");
        setAllProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and search products
  useEffect(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        const searchableFields = [
          product.title,
          product.name,
          product.description,
          product.material_type,
          product.material,
          product.categories?.name,
          ...(parseFeatures(product.features) || []),
        ];

        return searchableFields.some(
          (field) => field && field.toLowerCase().includes(query)
        );
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case "price-high":
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case "name-asc":
          return (a.title || a.name || "").localeCompare(
            b.title || b.name || ""
          );
        case "name-desc":
          return (b.title || b.name || "").localeCompare(
            a.title || a.name || ""
          );
        case "rating-high":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "newest":
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredProducts(filtered);
  }, [allProducts, searchQuery, sortBy]);

  const handleToggleFavourite = (product) => {
    const favouriteItem = {
      id: product.id,
      name: product.title || product.name,
      price: product.price,
      image: product.image || product.image_url,
      category: product.categories?.name || "Uncategorized",
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
                  Loading our amazing products...
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

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Shop
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Browse our collection of customizable trophies, frames, and gifts.
              Each item can be personalized to make it uniquely yours.
            </p>

            {/* Quick Search Bar */}
            <div className="max-w-lg mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search all products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      {/* <div className="py-8"> */}
        {/* <FeaturedCategories categories={categories} /> */}
      {/* </div> */}

      {/* Main Shop Content */}
      <div className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Controls Row */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-sm text-gray-600">
                  {filteredProducts.length} products found
                </span>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="rating-high">Highest Rated</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto">
                <div className="text-primary bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery.trim()
                    ? "No products match your search query."
                    : "No products are available at the moment."}
                </p>
                {searchQuery.trim() ? (
                  <Button onClick={() => setSearchQuery("")} className="w-full">
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Refresh Page
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onToggleFavourite={handleToggleFavourite}
                  isFavourite={isFavourite}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Shop;
