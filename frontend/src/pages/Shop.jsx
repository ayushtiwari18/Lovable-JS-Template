import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { FeaturedCategories } from "@/components/FeaturedCategories";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Star, Heart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { FeaturedProducts } from "../components/FeaturedProducts";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  // Fetch all products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all products with category information
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
          .eq("in_stock", true)
          .order("title", { ascending: true });

        if (productsError) throw productsError;

        // Fetch all categories for filter dropdown
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;

        setProducts(productsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        (product.categories && product.categories.slug === selectedCategory);
      const matchesPrice =
        (!priceRange.min || product.price >= parseFloat(priceRange.min)) &&
        (!priceRange.max || product.price <= parseFloat(priceRange.max));

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "created_at":
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  const handleToggleFavourite = (product) => {
    const favouriteItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      category: product.categories?.name || "Uncategorized",
      description: product.description,
    };

    if (isFavourite(product.id)) {
      removeFromFavourites(product.id);
      toast({
        title: "Removed from Favourites",
        description: `${product.title} has been removed from your favourites.`,
      });
    } else {
      addToFavourites(favouriteItem);
      toast({
        title: "Added to Favourites",
        description: `${product.title} has been added to your favourites.`,
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setPriceRange({ min: "", max: "" });
    setSortBy("title");
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategory ||
    priceRange.min ||
    priceRange.max ||
    sortBy !== "title";

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-br from-primary/5 to-yellow-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Shop
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Browse our collection of customizable trophies, frames, and gifts.
              Each item can be personalized to make it uniquely yours.
            </p>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-primary text-white" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price
                    </label>
                    <input
                      type="number"
                      placeholder="$0"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          min: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price
                    </label>
                    <input
                      type="number"
                      placeholder="$999"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          max: e.target.value,
                        }))
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="title">Name</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="created_at">Newest First</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Products Grid */}
      <FeaturedProducts/>
    </Layout>
  );
};

export default Shop;
