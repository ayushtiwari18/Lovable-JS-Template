// components/ProductActions.jsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Zap,
  Heart,
  Share2,
  MessageCircle,
  Phone,
  Mail,
  Loader2,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";

const ProductActions = ({
  product,
  currentStock,
  isFavourite,
  onAddToCart,
  onBuyNow,
  onToggleFavourite,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  const minQuantity = product.min_order_qty || 1;
  const maxQuantity = product.max_order_qty || 50;

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= minQuantity && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await onAddToCart(quantity);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      await onBuyNow(quantity);
    } finally {
      setIsBuying(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You can add a toast notification here
    }
  };

  return (
    <div className="space-y-6">
      {/* Quantity Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-900">Quantity</label>
          {(minQuantity > 1 || maxQuantity < 50) && (
            <div className="text-xs text-gray-600">
              Min: {minQuantity}, Max: {maxQuantity}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= minQuantity}
              className="h-10 w-10 p-0 hover:bg-gray-100"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-center w-16 h-10 text-center font-medium border-x border-gray-300">
              {quantity}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= maxQuantity}
              className="h-10 w-10 p-0 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {quantity > 1 && (
            <div className="text-sm text-gray-600">
              Total: ₹
              {(((product.price || 0) * quantity) / 100).toLocaleString(
                "en-IN"
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock Warning */}
      {!currentStock && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <span className="font-medium">Out of Stock:</span>
            <span className="ml-1">This item is currently unavailable.</span>
          </div>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleAddToCart}
          disabled={!currentStock || isAddingToCart}
          className="h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>

        <Button
          onClick={handleBuyNow}
          disabled={!currentStock || isBuying}
          className="h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBuying ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isBuying ? "Processing..." : "Buy Now"}
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={onToggleFavourite}
          className={`h-12 ${
            isFavourite
              ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
              : "hover:border-red-300 hover:text-red-600 hover:bg-red-50"
          }`}
        >
          <Heart
            className={`h-4 w-4 mr-2 ${isFavourite ? "fill-current" : ""}`}
          />
          {isFavourite ? "Saved" : "Save"}
        </Button>

        <Button
          variant="outline"
          onClick={handleShare}
          className="h-12 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        <Button
          variant="outline"
          className="h-12 hover:border-green-300 hover:text-green-600 hover:bg-green-50"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Ask
        </Button>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3 text-sm">Need Help?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="tel:+919876543210"
            className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span className="text-sm">Call Us</span>
          </a>
          <a
            href="mailto:support@example.com"
            className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span className="text-sm">Email Us</span>
          </a>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Get personalized assistance for bulk orders, customization, or any
          questions.
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center space-x-4 pt-2">
        <Badge
          variant="outline"
          className="text-xs border-green-200 text-green-700 bg-green-50"
        >
          ✓ Authentic Products
        </Badge>
        <Badge
          variant="outline"
          className="text-xs border-blue-200 text-blue-700 bg-blue-50"
        >
          ✓ Secure Payment
        </Badge>
        {product.cod_allowed && (
          <Badge
            variant="outline"
            className="text-xs border-purple-200 text-purple-700 bg-purple-50"
          >
            ✓ COD Available
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ProductActions;
