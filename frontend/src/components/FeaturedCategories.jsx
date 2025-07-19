import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Award, Image, Key, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient"; // Adjust import path as needed

// Icon mapping based on category slug
const iconMap = {
  trophies: Award,
  "photo-frames": Image,
  "key-holders": Key,
  calendars: Calendar,
};

// Default descriptions for categories (you can also add this to your database)
const defaultDescriptions = {
  trophies: "Championship trophies, awards, and recognition pieces",
  "photo-frames": "Custom photo frames for your precious memories",
  "key-holders": "Personalized key holders for home and office",
  calendars: "Custom calendars with your favorite photos",
};

export const FeaturedCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching featured categories...");

        // Test basic connection first
        const { data: testData, error: testError } = await supabase
          .from("categories")
          .select("count", { count: "exact", head: true });

        if (testError) {
          console.error("Connection test failed:", testError);
          throw new Error(`Database connection failed: ${testError.message}`);
        }

        console.log(
          "Database connection successful. Total categories:",
          testData
        );

        // Fetch only featured categories from Supabase
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, price, image, rating, featured")
          .eq("featured", true)
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching featured categories:", error);
          throw new Error(`Failed to fetch categories: ${error.message}`);
        }

        console.log("Featured categories fetched:", data);

        // If no featured categories, fetch all categories as fallback
        if (!data || data.length === 0) {
          console.log(
            "No featured categories found, fetching all categories..."
          );

          const { data: allData, error: allError } = await supabase
            .from("categories")
            .select("id, name, slug, price, image, rating, featured")
            .order("name", { ascending: true })
            .limit(4); // Limit to 4 for display

          if (allError) {
            console.error("Error fetching all categories:", allError);
            throw new Error(`Failed to fetch categories: ${allError.message}`);
          }

          console.log("All categories fetched:", allData);
          setCategories(allData || []);
        } else {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error in fetchFeaturedCategories:", err);
        setError(err.message || "Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCategories();
  }, []);

  // Get category count for each category (removed the problematic function)
  // This function was incorrectly trying to count categories by slug
  // Instead, you should count products in each category from a products table

  // Loading state
  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Product Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our wide range of customizable products, each crafted
              with attention to detail and designed to celebrate your unique
              moments.
            </p>
          </div>

          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading categories...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Product Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our wide range of customizable products, each crafted
              with attention to detail and designed to celebrate your unique
              moments.
            </p>
          </div>

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
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Product Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our wide range of customizable products, each crafted
              with attention to detail and designed to celebrate your unique
              moments.
            </p>
          </div>

          <div className="flex justify-center items-center min-h-64">
            <div className="text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-gray-600 text-lg mb-4">
                  No categories available at the moment.
                </p>
                <p className="text-gray-500 text-sm">
                  Please check back later or contact us for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Main content with categories
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Product Categories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our wide range of customizable products, each crafted with
            attention to detail and designed to celebrate your unique moments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const IconComponent = iconMap[category.slug] || Award;
            const description =
              defaultDescriptions[category.slug] ||
              "Customizable products for your needs";

            return (
              <div
                key={category.id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover-scale"
              >
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-yellow-100 border-2 border-yellow-700 rounded-xl overflow-hidden flex items-center justify-center">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                  ) : null}
                  <IconComponent
                    className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-300"
                    style={{ display: category.image ? "none" : "block" }}
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <span className="text-sm text-primary font-medium">
                      {category.featured ? "Featured" : "Available"}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{description}</p>
                  {category.price && (
                    <p className="text-lg font-semibold text-primary mb-4">
                      Starting at ₹{category.price}
                    </p>
                  )}
                  <Link to={`/category/${category.slug}/products`}>
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                    >
                      Explore {category.name}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
