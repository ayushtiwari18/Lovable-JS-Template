import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const getItemKey = (item) =>
    `${item.id}-${JSON.stringify(item.customization)}`;

  const addItem = (newItem) => {
    setItems((prev) => {
      const newItemKey = getItemKey({ ...newItem, quantity: 1 });
      const existingItemIndex = prev.findIndex(
        (item) => getItemKey(item) === newItemKey
      );

      if (existingItemIndex >= 0) {
        const updated = [...prev];
        updated[existingItemIndex].quantity += 1;
        return updated;
      } else {
        return [...prev, { ...newItem, quantity: 1 }];
      }
    });
  };

  const removeItem = (itemKey) => {
    setItems((prev) => prev.filter((item) => getItemKey(item) !== itemKey));
  };

  const updateQuantity = (itemKey, quantity) => {
    if (quantity <= 0) {
      removeItem(itemKey);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        getItemKey(item) === itemKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
