import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { Star, Upload, ShoppingCart, Heart, ArrowLeft } from "lucide-react";

const mockProduct = {
  id: "1",
  name: "Golden Achievement Trophy",
  price: 29.99,
  image: "/placeholder.svg",
  rating: 4.8,
  reviews: 124,
  category: "Trophies",
  description:
    "Beautiful golden trophy perfect for recognizing achievements and victories. Made from high-quality materials with a premium finish.",
  features: [
    "Premium gold-plated finish",
    "Customizable engraving plate",
    "Stable marble base",
    "Multiple size options",
    "Gift box included",
  ],
  customizationOptions: {
    colors: ["Gold", "Silver", "Bronze"],
    sizes: ['Small (6")', 'Medium (8")', 'Large (10")'],
  },
};

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  const [customization, setCustomization] = useState({
    text: "",
    color: "Gold",
    size: 'Medium (8")',
    uploadedImage: null,
  });

  const handleAddToCart = () => {
    addItem({
      id: mockProduct.id,
      name: mockProduct.name,
      price: mockProduct.price,
      image: mockProduct.image,
      customization: {
        text: customization.text,
        color: customization.color,
        uploadedImage: customization.uploadedImage?.name,
      },
    });

    toast({
      title: "Added to Cart!",
      description: `${mockProduct.name} has been added to your cart.`,
    });
  };

  const handleToggleFavourite = () => {
    if (isFavourite(mockProduct.id)) {
      removeFromFavourites(mockProduct.id);
      toast({
        title: "Removed from Favourites",
        description: `${mockProduct.name} has been removed from your favourites.`,
      });
    } else {
      addToFavourites(mockProduct);
      toast({
        title: "Added to Favourites",
        description: `${mockProduct.name} has been added to your favourites.`,
      });
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomization({ ...customization, uploadedImage: file });
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <img
                  src={mockProduct.image}
                  alt={mockProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <img
                      src={mockProduct.image}
                      alt={`${mockProduct.name} ${i}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="text-primary font-medium">
                  {mockProduct.category}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">
                  {mockProduct.name}
                </h1>
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(mockProduct.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {mockProduct.rating} ({mockProduct.reviews} reviews)
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary mt-4">
                  ${mockProduct.price}
                </div>
              </div>

              <p className="text-gray-600">{mockProduct.description}</p>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Features:</h3>
                <ul className="space-y-2">
                  {mockProduct.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Customization Options */}
              <div className="space-y-4 p-6 bg-gray-50 rounded-2xl">
                <h3 className="font-semibold text-gray-900">
                  Customize Your Product
                </h3>

                {/* Custom Text */}
                <div>
                  <Label htmlFor="customText">Custom Text (Optional)</Label>
                  <Textarea
                    id="customText"
                    placeholder="Enter text for engraving..."
                    value={customization.text}
                    onChange={(e) =>
                      setCustomization({
                        ...customization,
                        text: e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                {/* Color Selection */}
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {mockProduct.customizationOptions.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setCustomization({ ...customization, color })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          customization.color === color
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                        } transition-colors`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <Label>Size</Label>
                  <div className="flex gap-2 mt-2">
                    {mockProduct.customizationOptions.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() =>
                          setCustomization({ ...customization, size })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          customization.size === size
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-primary"
                        } transition-colors`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <Label htmlFor="imageUpload">Upload Image (Optional)</Label>
                  <div className="mt-2">
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("imageUpload")?.click()
                      }
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {customization.uploadedImage
                        ? customization.uploadedImage.name
                        : "Choose Image"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button onClick={handleAddToCart} className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={handleToggleFavourite}>
                  <Heart
                    className={`h-4 w-4 ${
                      isFavourite(mockProduct.id)
                        ? "text-red-500 fill-current"
                        : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
