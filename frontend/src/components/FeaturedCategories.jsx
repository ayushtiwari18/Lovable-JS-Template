import { Link } from "react-router-dom";
import { Award, Image, Key, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "trophies",
    name: "Trophies",
    description: "Championship trophies, awards, and recognition pieces",
    icon: Award,
    image: "/trophy/trophy-1.png",
    count: "50+ designs",
  },
  {
    id: "photo-frames",
    name: "Photo Frames",
    description: "Custom photo frames for your precious memories",
    icon: Image,
    image: "/photo-frames/PF-1.png",
    count: "30+ styles",
  },
  {
    id: "key-holders",
    name: "Key Holders",
    description: "Personalized key holders for home and office",
    icon: Key,
    image: "/key_holders/KH1.png",
    count: "25+ designs",
  },
  {
    id: "calendars",
    name: "Calendars",
    description: "Custom calendars with your favorite photos",
    icon: Calendar,
    image: "/mandir/Ram-mandir.png",
    count: "15+ templates",
  },
];

export const FeaturedCategories = () => {
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
            const IconComponent = category.icon;
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
                    />
                  ) : (
                    <IconComponent className="h-16 w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <span className="text-sm text-primary font-medium">
                      {category.count}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  <Link to={`/category/${category.id}`}>
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
