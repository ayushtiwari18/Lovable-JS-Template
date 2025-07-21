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
          storedCart[existingItemIndex].quantity += quantity;
        } else {
          storedCart.push({
            id: product.id,
            name: product.title || product.name,
            price: product.price,
            image: product.image_url || product.image,
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

  // Update item quantity - Fixed function signature
  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(item);
      return;
    }

    try {
      if (user) {
        // For authenticated users, use cartId
        const { error } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.cartId);

        if (error) throw error;

        // Update local state
        setCartItems((prev) =>
          prev.map((cartItem) =>
            cartItem.cartId === item.cartId
              ? { ...cartItem, quantity: newQuantity }
              : cartItem
          )
        );
      } else {
        // Guest user - update localStorage
        const itemKey = `${item.id}-${JSON.stringify(
          item.customization || {}
        )}`;
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.map((cartItem) =>
          `${cartItem.id}-${JSON.stringify(cartItem.customization || {})}` ===
          itemKey
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        );

        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error; // Let calling component handle the error
    }
  };

  // Remove item from cart - Fixed function signature
  const removeFromCart = async (item) => {
    try {
      if (user) {
        // For authenticated users, use cartId
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", item.cartId);

        if (error) throw error;

        // Update local state
        setCartItems((prev) =>
          prev.filter((cartItem) => cartItem.cartId !== item.cartId)
        );
      } else {
        // Guest user - remove from localStorage
        const itemKey = `${item.id}-${JSON.stringify(
          item.customization || {}
        )}`;
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.filter(
          (cartItem) =>
            `${cartItem.id}-${JSON.stringify(cartItem.customization || {})}` !==
            itemKey
        );

        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
      throw error; // Let calling component handle the error
    }
  };

  // Clear entire cart - FIXED
  const clearCart = async () => {
    try {
      console.log("🧹 Clearing cart...");

      if (user) {
        // Clear cart from database
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          console.error("Database clear error:", error);
          throw error;
        }
        console.log("✅ Database cart cleared");
      } else {
        // Clear from localStorage
        localStorage.removeItem("cart_items");
        console.log("✅ LocalStorage cart cleared");
      }

      // Clear context state - FIXED: Use cartItems, not items
      setCartItems([]);
      console.log("✅ Context state cleared");

      toast({
        title: "Cart Cleared",
        description: "Your cart has been cleared successfully.",
      });
    } catch (error) {
      console.error("Failed to clear cart:", error);
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

        const transformedItems =
          cartData?.map((item) => ({
            id: item.product_id,
            name: item.products?.title,
            price: item.products?.price,
            image: item.products?.image_url,
            category: item.products?.categories?.name || "Product",
            quantity: item.quantity,
            cartId: item.id,
            customization: null,
          })) || [];

        setCartItems(transformedItems);
      } else {
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

      const { data: existingCart } = await supabase
        .from("cart_items")
        .select("product_id, quantity, id")
        .eq("user_id", user.id);

      const existingProductMap = new Map(
        existingCart?.map((item) => [item.product_id, item]) || []
      );

      for (const item of storedCart) {
        const existingItem = existingProductMap.get(item.id);

        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;
          await supabase
            .from("cart_items")
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);
        } else {
          await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: item.id,
            quantity: item.quantity,
          });
        }
      }

      localStorage.removeItem("cart_items");
      await fetchCartItems();

      if (storedCart.length > 0) {
        toast({
          title: "Cart Synced",
          description: `${storedCart.length} item(s) synced to your account.`,
        });
      }
    } catch (error) {
      console.error("Error syncing cart:", error);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

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

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  useEffect(() => {
    if (user) {
      syncCartToDatabase();
    }
  }, [user]);

  useEffect(() => {
    if (!user && cartItems.length > 0) {
      const hasNonDatabaseItems = cartItems.some((item) => !item.cartId);
      if (hasNonDatabaseItems) {
        localStorage.setItem("cart_items", JSON.stringify(cartItems));
      }
    }
  }, [cartItems, user]);

  const value = {
    items: cartItems, // Export as 'items' for consistency
    loading,
    addItem,
    updateQuantity,
    removeFromCart, // Export as 'removeFromCart'
    clearCart,
    getTotalPrice,
    getTotalItems,
    getCartForCheckout,
    fetchCartItems,
    syncCartToDatabase,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
