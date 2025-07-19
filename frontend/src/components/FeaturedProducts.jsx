import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Heart, ImageOff } from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (
              name,
              slug,
              rating
            )
          `
          )
          .eq("featured", true)
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;

        const transformedData = data.map((product) => ({
          ...product,
          category_name: product.categories?.name || "Uncategorized",
          category_slug: product.categories?.slug || "uncategorized",
          category_rating: product.categories?.rating || null,
        }));

        setFeaturedProducts(transformedData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleToggleFavourite = (product) => {
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

  const formatPrice = (priceInCents) => {
    return (priceInCents / 100).toFixed(2);
  };

  const isNewProduct = (createdAt) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(createdAt) > thirtyDaysAgo;
  };

  const handleImageError = (productId) => {
    setImageErrorMap((prev) => ({ ...prev, [productId]: true }));
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading featured products...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600">
              Error loading featured products: {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Check out our most popular items, loved by customers for their
            quality and personalization options.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover-scale"
            >
              <div className="relative aspect-square bg-gray-100 overflow-hidden flex items-center justify-center">
                {!imageErrorMap[product.id] && product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => handleImageError(product.id)}
                  />
                ) : (
                  <ImageOff className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
                )}
                {isNewProduct(product.created_at) && (
                  <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                    New
                  </span>
                )}
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
                    {product.category_name || "Uncategorized"}
                  </span>
                  {product.category_rating && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {product.category_rating}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {product.title}
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ${formatPrice(product.price)}
                  </span>
                  <Link
                    to={`/category/${product.category_slug}/products/${product.id}`}
                  >
                    <Button size="sm" disabled={!product.in_stock}>
                      {product.in_stock ? "View Details" : "Out of Stock"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/shop">
            <Button size="lg" variant="outline">
              View All Products
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
