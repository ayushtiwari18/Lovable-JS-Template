import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Star, Heart, Loader2 } from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient"; // Adjust import path as needed

const categoryNames = {
  trophies: "Trophies",
  "photo-frames": "Photo Frames",
  "key-holders": "Key Holders",
  calendars: "Calendars",
};

const Category = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categoryName = categoryNames[categoryId] || "Category";
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products from categories table where slug matches categoryId
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", categoryId);

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          setProducts([]);
          setError("No products found in this category");
          return;
        }

        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchProducts();
    }
  }, [categoryId]);

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

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {categoryName}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore our collection of high-quality{" "}
                {categoryName.toLowerCase()} with full customization options.
              </p>
            </div>
          </div>
        </div>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center min-h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Loading products...</p>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {categoryName}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore our collection of high-quality{" "}
                {categoryName.toLowerCase()} with full customization options.
              </p>
            </div>
          </div>
        </div>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center min-h-64">
              <div className="text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-red-700 font-medium">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <Layout>
        <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {categoryName}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore our collection of high-quality{" "}
                {categoryName.toLowerCase()} with full customization options.
              </p>
            </div>
          </div>
        </div>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center min-h-64">
              <div className="text-center">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                  <p className="text-gray-600 text-lg mb-4">
                    No products found in this category yet.
                  </p>
                  <Link to="/">
                    <Button>Browse All Categories</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  // Main content with products
  return (
    <Layout>
      <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {categoryName}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our collection of high-quality{" "}
              {categoryName.toLowerCase()} with full customization options.
            </p>
          </div>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover-scale"
              >
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = "/placeholder.svg";
                    }}
                  />
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
                    {product.price && (
                      <span className="text-2xl font-bold text-primary">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    )}
                    {!product.price && (
                      <span className="text-lg text-gray-500">
                        Price on request
                      </span>
                    )}
                    <Link to={`/product/${product.id}`}>
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
