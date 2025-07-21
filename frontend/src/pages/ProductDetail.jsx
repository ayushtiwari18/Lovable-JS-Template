import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Upload,
  ShoppingCart,
  Heart,
  ArrowLeft,
  Package,
  ImageOff,
  Loader2,
} from "lucide-react";
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
        large: "c_fill,h_800,q_auto,w_800,f_auto",
        hero: "c_fill,h_600,q_auto,w_600,f_auto", // For main product image
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
const ProductImage = ({
  imageUrl,
  alt,
  className,
  fallbackTitle,
  transformation = "hero",
  onClick,
}) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  useEffect(() => {
    if (imageUrl) {
      const optimizedUrl = getCloudinaryImageUrl(imageUrl, transformation);
      setCurrentImageUrl(optimizedUrl);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [imageUrl, transformation]);

  const handleImageLoad = () => {
    setImageState("loaded");
  };

  const handleImageError = () => {
    // Try fallback to original URL if Cloudinary fails
    if (currentImageUrl !== imageUrl && imageUrl) {
      setCurrentImageUrl(imageUrl);
      setImageState("loading");
    } else {
      setImageState("error");
    }
  };

  // Show fallback icon if no image, loading, or error
  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center cursor-pointer hover:from-primary/15 hover:to-primary/10 transition-all duration-300`}
        onClick={onClick}
      >
        <Package className="h-20 w-20 text-primary mb-3" />
        <span className="text-sm text-primary/70 font-medium text-center px-4">
          {fallbackTitle || "Product Image"}
        </span>
        <span className="text-xs text-primary/50 mt-1">No image available</span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`} onClick={onClick}>
      {/* Loading skeleton */}
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
            <span className="text-xs text-gray-500">Loading...</span>
          </div>
        </div>
      )}

      {/* Actual image */}
      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 hover:scale-105 cursor-pointer ${
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

// Image gallery component with thumbnails
const ImageGallery = ({ product, productImages }) => {
  const [selectedImage, setSelectedImage] = useState(0);

  const allImages =
    productImages.length > 0
      ? productImages
      : [
          {
            id: "main",
            image_url: product?.image_url,
            alt_text: product?.title,
            display_order: 0,
          },
        ];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
        <ProductImage
          imageUrl={allImages[selectedImage]?.image_url}
          alt={allImages[selectedImage]?.alt_text || product?.title}
          className="w-full h-full"
          fallbackTitle={product?.title}
          transformation="hero"
        />
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.slice(0, 4).map((img, index) => (
            <div
              key={img.id || index}
              className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                selectedImage === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : "hover:opacity-75"
              }`}
              onClick={() => setSelectedImage(index)}
            >
              <ProductImage
                imageUrl={img.image_url}
                alt={img.alt_text || `${product?.title} ${index + 1}`}
                className="w-full h-full"
                fallbackTitle={`Image ${index + 1}`}
                transformation="thumbnail"
              />
            </div>
          ))}
        </div>
      )}

      {/* Image indicators if more than 4 images */}
      {allImages.length > 4 && (
        <div className="text-center">
          <span className="text-sm text-gray-500">
            +{allImages.length - 4} more images
          </span>
        </div>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [customization, setCustomization] = useState({
    text: "",
    color: "",
    size: "",
    uploadedImage: null,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (
              id,
              name,
              slug
            )
          `
          )
          .eq("id", productId);

        if (fetchError) throw fetchError;
        if (!data || data.length === 0) throw new Error("Product not found");

        const fetchedProduct = data[0];
        if (fetchedProduct.categories?.slug !== slug) {
          throw new Error("Product does not belong to this category");
        }

        setProduct(fetchedProduct);

        // Process images with Cloudinary optimization
        const allImages = [];
        if (fetchedProduct.image_url) {
          allImages.push({
            id: "main",
            image_url: fetchedProduct.image_url,
            alt_text: fetchedProduct.title,
            display_order: 0,
          });
        }

        (fetchedProduct.additional_images || []).forEach((url, idx) => {
          allImages.push({
            id: `additional-${idx}`,
            image_url: url,
            alt_text: `${fetchedProduct.title} ${idx + 2}`,
            display_order: idx + 1,
          });
        });

        setProductImages(allImages);

        const fields = fetchedProduct.customizable_fields || {};
        setCustomization((prev) => ({
          ...prev,
          color: fields.colors?.[0] || "",
          size: fields.sizes?.[0] || "",
        }));
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!productId || !slug) {
      setError("Missing route parameters");
      setLoading(false);
      return;
    }

    fetchProduct();
  }, [productId, slug]);

  const getCustomizationOptions = (type) => {
    if (!product?.customizable_fields) return [];
    const fields = product.customizable_fields;
    return type === "color" ? fields.colors || [] : fields.sizes || [];
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      name: product.title,
      price: product.price / 100,
      image: product.image_url,
      customization: {
        text: customization.text,
        color: customization.color,
        size: customization.size,
        uploadedImage: customization.uploadedImage?.name,
      },
    });
    toast({
      title: "Added to Cart!",
      description: `${product.title} has been added to your cart.`,
    });
  };

  const handleToggleFavourite = () => {
    if (!product) return;
    const action = isFavourite(product.id)
      ? removeFromFavourites
      : addToFavourites;
    action(product);
    toast({
      title: isFavourite(product.id)
        ? "Removed from Favourites"
        : "Added to Favourites",
      description: `${product.title} has been ${
        isFavourite(product.id) ? "removed from" : "added to"
      } your favourites.`,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setCustomization({ ...customization, uploadedImage: file });
  };

  const formatPrice = (cents) => (cents / 100).toFixed(2);

  const parseFeatures = (features) => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      return JSON.parse(features);
    } catch {
      return features.split(",").map((f) => f.trim());
    }
  };

  const colorOptions = getCustomizationOptions("color");
  const sizeOptions = getCustomizationOptions("size");
  const features = parseFeatures(product?.features);
  const rating = product?.rating || 0;
  const reviewCount = product?.review_count || 0;

  // Enhanced loading state
  if (loading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Image skeleton */}
              <div className="space-y-4">
                <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-pulse flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Content skeleton */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-red-100 to-red-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageOff className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Product Not Found
              </h3>
              <p className="text-red-600 mb-6">
                {error || "Product not found"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={() => navigate("/shop")}>
                  Browse Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <ImageGallery product={product} productImages={productImages} />

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <span className="text-primary font-medium bg-primary/10 px-3 py-1 rounded-full text-sm">
                  {product.categories?.name || "Uncategorized"}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-4">
                  {product.title}
                </h1>

                {/* Rating */}
                <div className="flex items-center mt-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {rating} ({reviewCount} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="text-3xl font-bold text-primary mt-4">
                  ${formatPrice(product.price)}
                </div>

                {/* Stock status */}
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      product.in_stock
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.in_stock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>

              {product.description && (
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {features.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Key Features:
                  </h3>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start text-gray-600"
                      >
                        <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Customization Options */}
              {(colorOptions.length > 0 || sizeOptions.length > 0) && (
                <div className="space-y-6 p-6 bg-gray-50 rounded-2xl">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Customize Your Product
                  </h3>

                  <div>
                    <Label htmlFor="customText" className="text-sm font-medium">
                      Custom Text (Optional)
                    </Label>
                    <Textarea
                      id="customText"
                      placeholder="Enter text for engraving or personalization..."
                      value={customization.text}
                      onChange={(e) =>
                        setCustomization({
                          ...customization,
                          text: e.target.value,
                        })
                      }
                      className="mt-2 resize-none"
                      rows={3}
                    />
                  </div>

                  {colorOptions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">
                        Color Options
                      </Label>
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            onClick={() =>
                              setCustomization({ ...customization, color })
                            }
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                              customization.color === color
                                ? "border-primary bg-primary text-white shadow-lg"
                                : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:shadow-md"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {sizeOptions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">
                        Size Options
                      </Label>
                      <div className="flex gap-3 mt-3 flex-wrap">
                        {sizeOptions.map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              setCustomization({ ...customization, size })
                            }
                            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                              customization.size === size
                                ? "border-primary bg-primary text-white shadow-lg"
                                : "border-gray-300 bg-white text-gray-700 hover:border-primary hover:shadow-md"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label
                      htmlFor="imageUpload"
                      className="text-sm font-medium"
                    >
                      Upload Custom Image (Optional)
                    </Label>
                    <div className="mt-3">
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
                        className="w-full h-12 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all duration-200"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {customization.uploadedImage
                          ? customization.uploadedImage.name
                          : "Choose Image File"}
                      </Button>
                      {customization.uploadedImage && (
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: {customization.uploadedImage.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleAddToCart}
                  className="flex-1 h-12 text-lg font-semibold"
                  disabled={!product.in_stock}
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.in_stock ? "Add to Cart" : "Out of Stock"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleFavourite}
                  className="h-12 px-6 border-2 hover:scale-105 transition-transform duration-200"
                  size="lg"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavourite(product.id) ? "text-red-500 fill-current" : ""
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
