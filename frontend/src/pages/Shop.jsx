import { Layout } from "@/components/Layout";
import { FeaturedCategories } from "@/components/FeaturedCategories";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

const Shop = () => {
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
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FeaturedCategories />
    </Layout>
  );
};

export default Shop;
