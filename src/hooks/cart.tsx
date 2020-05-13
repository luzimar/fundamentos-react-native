import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

function incrementState(oldState: Product[], id: string): Product[] {
  return oldState.map(product => {
    if (product.id === id) {
      return { ...product, quantity: product.quantity + 1 };
    }

    return product;
  });
}

function decrementState(oldState: Product[], id: string): Product[] {
  return oldState.map(product => {
    if (product.id === id && product.quantity > 1) {
      return { ...product, quantity: product.quantity - 1 };
    }
    return product;
  });
}

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketplace:cart');
      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    setProducts(oldState => {
      const existentProductIndex = oldState.findIndex(
        productItem => productItem.id === product.id,
      );

      if (existentProductIndex >= 0) {
        return incrementState(oldState, product.id);
      }
      return [...oldState, { ...product, quantity: 1 }];
    });
  }, []);

  const increment = useCallback(async id => {
    setProducts(oldState => incrementState(oldState, id));
  }, []);

  const decrement = useCallback(async id => {
    setProducts(oldState => decrementState(oldState, id));
  }, []);

  useEffect(() => {
    async function storeProductData(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    }

    storeProductData();
  }, [products]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
