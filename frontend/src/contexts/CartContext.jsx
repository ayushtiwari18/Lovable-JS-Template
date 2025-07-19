import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add item to cart (either Supabase or localStorage)
  const addItem = async (product, quantity = 1, customization = null) => {
    try {
      if (user) {
        // Authenticated user - add to Supabase
        const { data: existingItem, error: fetchError } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", product.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116 is "not found" error, which is fine
          throw fetchError;
        }

        if (existingItem) {
          // Update existing item
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({
              quantity: existingItem.quantity + quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);

          if (updateError) throw updateError;
        } else {
          // Insert new item
          const { error: insertError } = await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: product.id,
              quantity: quantity,
            });

          if (insertError) throw insertError;
        }

        // Refresh cart items
        await fetchCartItems();
      } else {
        // Guest user - add to localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const itemKey = `${product.id}-${JSON.stringify(customization || {})}`;

        const existingItemIndex = storedCart.findIndex(
          (item) =>
            `${item.id}-${JSON.stringify(item.customization || {})}` === itemKey
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          storedCart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          storedCart.push({
            id: product.id,
            name: product.title || product.name, // Handle both title and name
            price: product.price,
            image: product.image_url || product.image, // Handle both image_url and image
            category: product.category,
            quantity: quantity,
            customization: customization,
          });
        }

        localStorage.setItem("cart_items", JSON.stringify(storedCart));
        setCartItems(storedCart);
      }

      toast({
        title: "Added to Cart",
        description: `${
          product.title || product.name
        } has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  // Update item quantity
  const updateQuantity = async (itemKey, newQuantity) => {
    if (newQuantity < 1) {
      await removeItem(itemKey);
      return;
    }

    try {
      if (user) {
        // For authenticated users, itemKey is the cart ID
        const { error } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemKey);

        if (error) throw error;

        // Update local state
        setCartItems((prev) =>
          prev.map((item) =>
            item.cartId === itemKey ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        // Guest user - update localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.map((item) =>
          `${item.id}-${JSON.stringify(item.customization || {})}` === itemKey
            ? { ...item, quantity: newQuantity }
            : item
        );

        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      });
    }
  };

  // Remove item from cart
  const removeItem = async (itemKey) => {
    try {
      if (user) {
        // For authenticated users, itemKey is the cart ID
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemKey);

        if (error) throw error;

        // Update local state
        setCartItems((prev) => prev.filter((item) => item.cartId !== itemKey));
      } else {
        // Guest user - remove from localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.filter(
          (item) =>
            `${item.id}-${JSON.stringify(item.customization || {})}` !== itemKey
        );

        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      if (user) {
        // Clear from Supabase
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Clear from localStorage
        localStorage.removeItem("cart_items");
      }

      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  };

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
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

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
      console.error("Error fetching cart items:", error);
      toast({
        title: "Error",
        description: "Failed to load cart items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
        .select("product_id, quantity, id")
        .eq("user_id", user.id);

      const existingProductMap = new Map(
        existingCart?.map((item) => [item.product_id, item]) || []
      );

      // Process each item from localStorage
      for (const item of storedCart) {
        const existingItem = existingProductMap.get(item.id);

        if (existingItem) {
          // Update existing item quantity
          const newQuantity = existingItem.quantity + item.quantity;
          await supabase
            .from("cart_items")
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);
        } else {
          // Insert new item
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: item.id,
            quantity: item.quantity,
          });
        }
      }

      // Clear localStorage after successful sync
      localStorage.removeItem("cart_items");

      // Refresh cart items from database
      await fetchCartItems();

      if (storedCart.length > 0) {
        toast({
          title: "Cart Synced",
          description: `${storedCart.length} item(s) synced to your account.`,
        });
      }
    } catch (error) {
      console.error("Error syncing cart:", error);
      // Don't show error to user as this is background operation
    }
  };

  // Get total price
  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Get total items count
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Get cart for checkout (with proper format for orders table)
  const getCartForCheckout = () => {
    return cartItems.map((item) => ({
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization,
      image: item.image,
    }));
  };

  // Load cart items when component mounts or user changes
  useEffect(() => {
    fetchCartItems();
  }, [user]);

  // Sync cart when user logs in (but not on logout)
  useEffect(() => {
    if (user) {
      syncCartToDatabase();
    }
  }, [user]);

  // For guest users, persist to localStorage whenever cartItems change
  useEffect(() => {
    if (!user && cartItems.length > 0) {
      // Only update localStorage for guest users and when items exist
      const hasNonDatabaseItems = cartItems.some((item) => !item.cartId);
      if (hasNonDatabaseItems) {
        localStorage.setItem("cart_items", JSON.stringify(cartItems));
      }
    }
  }, [cartItems, user]);

  const value = {
    items: cartItems,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getCartForCheckout,
    fetchCartItems,
    syncCartToDatabase,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
