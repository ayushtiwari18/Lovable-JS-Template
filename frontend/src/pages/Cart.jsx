import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { Minus, Plus, Trash2, ShoppingBag, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Cart = () => {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } =
    useCart();
  const { addToFavourites } = useFavourites();
  const { toast } = useToast();

  const getItemKey = (item) =>
    `${item.id}-${JSON.stringify(item.customization)}`;

  const handleRemoveFromCart = (item) => {
    const itemKey = getItemKey(item);
    removeItem(itemKey);
    toast({
      title: "Removed from Cart",
      description: `${item.name} has been removed from your cart.`,
    });
  };

  const handleMoveToWishlist = (item) => {
    const favouriteItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: "Product",
      rating: 4.5,
    };

    addToFavourites(favouriteItem);
    const itemKey = getItemKey(item);
    removeItem(itemKey);

    toast({
      title: "Moved to Wishlist",
      description: `${item.name} has been moved to your wishlist.`,
    });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="py-20">
          <div className="container mx-auto px-4 text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/shop">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Shopping Cart
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={getItemKey(item)}
                  className="bg-white rounded-lg shadow-sm border p-6"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-2xl font-bold text-primary">
                        ${item.price}
                      </p>

                      {/* Customization Details */}
                      {item.customization && (
                        <div className="mt-2 text-sm text-gray-600">
                          {item.customization.text && (
                            <p>Text: {item.customization.text}</p>
                          )}
                          {item.customization.color && (
                            <p>Color: {item.customization.color}</p>
                          )}
                          {item.customization.uploadedImage && (
                            <p>Image: {item.customization.uploadedImage}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoveToWishlist(item)}
                          className="text-pink-500 hover:text-pink-700 p-1 transition-colors"
                          title="Move to Wishlist"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(item)}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors"
                          title="Remove from Cart"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(getItemKey(item), item.quantity - 1)
                          }
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(getItemKey(item), item.quantity + 1)
                          }
                          className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Items ({getTotalItems()})
                  </span>
                  <span className="font-medium">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">
                    ${(getTotalPrice() * 0.08).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      ${(getTotalPrice() * 1.08).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button className="w-full mb-4">Proceed to Checkout</Button>
              </Link>

              <Link to="/shop" className="block">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
