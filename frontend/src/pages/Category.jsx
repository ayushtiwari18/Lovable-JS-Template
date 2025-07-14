import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Star, Heart } from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";

const mockProducts = {
  trophies: [
    {
      id: "1",
      name: "Golden Achievement Trophy",
      price: 29.99,
      image: "/placeholder.svg",
      rating: 4.8,
    },
    {
      id: "5",
      name: "Silver Star Trophy",
      price: 24.99,
      image: "/placeholder.svg",
      rating: 4.7,
    },
    {
      id: "6",
      name: "Crystal Excellence Award",
      price: 34.99,
      image: "/placeholder.svg",
      rating: 4.9,
    },
  ],
  "photo-frames": [
    {
      id: "2",
      name: "Elegant Photo Frame",
      price: 24.99,
      image: "/placeholder.svg",
      rating: 4.9,
    },
    {
      id: "7",
      name: "Wooden Family Frame",
      price: 19.99,
      image: "/placeholder.svg",
      rating: 4.6,
    },
    {
      id: "8",
      name: "Modern Digital Frame",
      price: 39.99,
      image: "/placeholder.svg",
      rating: 4.8,
    },
  ],
  "key-holders": [
    {
      id: "3",
      name: "Wooden Key Holder",
      price: 19.99,
      image: "/placeholder.svg",
      rating: 4.7,
    },
    {
      id: "9",
      name: "Metal Key Organizer",
      price: 16.99,
      image: "/placeholder.svg",
      rating: 4.5,
    },
    {
      id: "10",
      name: "Personalized Key Rack",
      price: 22.99,
      image: "/placeholder.svg",
      rating: 4.8,
    },
  ],
  calendars: [
    {
      id: "4",
      name: "Custom Photo Calendar",
      price: 15.99,
      image: "/placeholder.svg",
      rating: 4.6,
    },
    {
      id: "11",
      name: "Family Memory Calendar",
      price: 18.99,
      image: "/placeholder.svg",
      rating: 4.7,
    },
    {
      id: "12",
      name: "Business Desk Calendar",
      price: 12.99,
      image: "/placeholder.svg",
      rating: 4.4,
    },
  ],
};

const categoryNames = {
  trophies: "Trophies",
  "photo-frames": "Photo Frames",
  "key-holders": "Key Holders",
  calendars: "Calendars",
};

const Category = () => {
  const { categoryId } = useParams();
  const products = mockProducts[categoryId] || [];
  const categoryName = categoryNames[categoryId] || "Category";
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

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
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {product.rating}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
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
