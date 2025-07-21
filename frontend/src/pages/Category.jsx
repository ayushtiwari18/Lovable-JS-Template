import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Star, Heart, Loader2, ShoppingBag } from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

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
          alt={product.name}
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

const Category = () => {
  const { slug } = useParams(); // ✅ use slug instead of categoryId
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

        // Step 2: Fetch products for this category
        const { data: productsData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", categoryId);

        if (productError) {
          throw productError;
        }

        setProducts(productsData);
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
      name: product.name,
      price: product.price,
      image: product.image,
      category: categoryName,
      rating: product.rating,
    };

    if (isFavourite(product.id)) {
      removeFromFavourites(product.id);
      toast({
        title: "Removed from Favourites",
        description: `${product.name} has been removed from your favourites.`,
      });
    } else {
      addToFavourites(favouriteItem);
      toast({
        title: "Added to Favourites",
        description: `${product.name} has been added to your favourites.`,
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  if (products.length === 0) {
    return (
      <Layout>
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600 text-lg mb-4">
              No products found in this category yet.
            </p>
            <Link to="/">
              <Button>Browse All Categories</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {categoryName}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover-scale"
              >
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <ProductImage product={product} className="w-full h-full" />
                  <button
                    onClick={() => handleToggleFavourite(product)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isFavourite(product.id)
                          ? "text-red-500 fill-current"
                          : "text-gray-600"
                      }`}
                    />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-primary font-medium">
                      {categoryName}
                    </span>
                    {product.rating && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">
                          {Number(product.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {product.price
                        ? `$${Number(product.price).toFixed(2)}`
                        : "Price on request"}
                    </span>
                    <Link to={`/category/${slug}/products/${product.id}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Category;
