import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, ShoppingBag, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const Cart = () => {
  const { user } = useAuth();
  const { addToFavourites } = useFavourites();
  const { toast } = useToast();

  // State for cart items and loading
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Fetch cart items from Supabase or localStorage
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      if (user) {
        // Authenticated user - fetch from Supabase with correct column names
        const { data: cartData, error } = await supabase
          .from("cart_items")
          .select(
            `
            id,
            product_id,
            quantity,
            created_at,
            products!product_id (
              id,
              title,
              price,
              image_url,
              category_id,
              categories!category_id (
                name
              )
            )
          `
          )
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching cart:", error);
          toast({
            title: "Error",
            description: "Failed to load cart items.",
            variant: "destructive",
          });
          return;
        }

        // Transform data to match expected format
        const transformedItems =
          cartData?.map((item) => ({
            id: item.product_id,
            name: item.products?.title,
            price: item.products?.price,
            image: item.products?.image_url,
            category: item.products?.categories?.name || "Product",
            quantity: item.quantity,
            cartId: item.id, // Store cart table ID for updates
            customization: null, // Add customization logic if needed
          })) || [];

        setCartItems(transformedItems);
      } else {
        // Guest user - fetch from localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        setCartItems(storedCart);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update quantity in database or localStorage
  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    const itemKey = user ? item.cartId : getItemKey(item);
    setUpdatingItems((prev) => new Set(prev).add(itemKey));

    try {
      if (user) {
        // Update in Supabase
        const { error } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.cartId);

        if (error) {
          console.error("Error updating quantity:", error);
          toast({
            title: "Error",
            description: "Failed to update quantity.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Update in localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.map((cartItem) =>
          getItemKey(cartItem) === getItemKey(item)
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        );
        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
      }

      // Update local state
      setCartItems((prev) =>
        prev.map((cartItem) =>
          (
            user
              ? cartItem.cartId === item.cartId
              : getItemKey(cartItem) === getItemKey(item)
          )
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      });
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // Remove item from cart
  const removeItem = async (item) => {
    const itemKey = user ? item.cartId : getItemKey(item);
    setUpdatingItems((prev) => new Set(prev).add(itemKey));

    try {
      if (user) {
        // Remove from Supabase
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", item.cartId);

        if (error) {
          console.error("Error removing item:", error);
          toast({
            title: "Error",
            description: "Failed to remove item.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Remove from localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.filter(
          (cartItem) => getItemKey(cartItem) !== getItemKey(item)
        );
        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
      }

      // Update local state
      setCartItems((prev) =>
        prev.filter((cartItem) =>
          user
            ? cartItem.cartId !== item.cartId
            : getItemKey(cartItem) !== getItemKey(item)
        )
      );

      toast({
        title: "Removed from Cart",
        description: `${item.name} has been removed from your cart.`,
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // Move item to wishlist
  const handleMoveToWishlist = async (item) => {
    const favouriteItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category || "Product",
      rating: 4.5,
    };

    try {
      await addToFavourites(favouriteItem);
      await removeItem(item);

      toast({
        title: "Moved to Wishlist",
        description: `${item.name} has been moved to your wishlist.`,
      });
    } catch (error) {
      console.error("Error moving to wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to move item to wishlist.",
        variant: "destructive",
      });
    }
  };

  // Helper function for guest cart item keys
  const getItemKey = (item) =>
    `${item.id}-${JSON.stringify(item.customization || {})}`;

  // Calculate totals
  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Sync localStorage cart to database when user logs in
  const syncCartToDatabase = async () => {
    if (!user) return;

    try {
      const storedCart = JSON.parse(localStorage.getItem("cart_items") || "[]");
      if (storedCart.length === 0) return;

      // Get existing cart items from database
      const { data: existingCart } = await supabase
        .from("cart_items")
        .select("product_id, quantity")
        .eq("user_id", user.id);

      const existingProductIds = new Set(
        existingCart?.map((item) => item.product_id) || []
      );

      // Prepare items to insert/update
      const itemsToProcess = [];

      for (const item of storedCart) {
        if (existingProductIds.has(item.id)) {
          // Update existing item quantity
          const existingItem = existingCart.find(
            (cart) => cart.product_id === item.id
          );
          const newQuantity = existingItem.quantity + item.quantity;

          itemsToProcess.push({
            type: "update",
            product_id: item.id,
            quantity: newQuantity,
          });
        } else {
          // Insert new item
          itemsToProcess.push({
            type: "insert",
            user_id: user.id,
            product_id: item.id,
            quantity: item.quantity,
          });
        }
      }

      // Process updates
      for (const item of itemsToProcess) {
        if (item.type === "update") {
          await supabase
            .from("cart_items")
            .update({
              quantity: item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .eq("product_id", item.product_id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: item.user_id,
            product_id: item.product_id,
            quantity: item.quantity,
          });
        }
      }

      // Clear localStorage after sync
      localStorage.removeItem("cart_items");

      // Refresh cart items
      await fetchCartItems();

      if (storedCart.length > 0) {
        toast({
          title: "Cart Synced",
          description: "Your cart items have been synced to your account.",
        });
      }
    } catch (error) {
      console.error("Error syncing cart:", error);
    }
  };

  // Load cart items on component mount and user change
  useEffect(() => {
    fetchCartItems();
  }, [user]);

  // Sync cart when user logs in
  useEffect(() => {
    if (user) {
      syncCartToDatabase();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading cart...</span>
        </div>
      </Layout>
    );
  }

  if (cartItems.length === 0) {
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
              {cartItems.map((item) => {
                const itemKey = user ? item.cartId : getItemKey(item);
                const isUpdating = updatingItems.has(itemKey);

                return (
                  <div
                    key={itemKey}
                    className={`bg-white rounded-lg shadow-sm border p-6 ${
                      isUpdating ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/80x80?text=No+Image";
                        }}
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>
                        <p className="text-2xl font-bold text-primary">
                          ₹{item.price}
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
                            disabled={isUpdating}
                            className="text-pink-500 hover:text-pink-700 p-1 transition-colors disabled:opacity-50"
                            title="Move to Wishlist"
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item)}
                            disabled={isUpdating}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors disabled:opacity-50"
                            title="Remove from Cart"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item, item.quantity - 1)
                            }
                            disabled={isUpdating || item.quantity <= 1}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    ₹{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">
                    ₹{(getTotalPrice() * 0.18).toFixed(2)}
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

              <Link to={user ? "/checkout" : "/login"} className="block">
                <Button className="w-full mb-4">
                  {user ? "Proceed to Checkout" : "Login to Checkout"}
                </Button>
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
