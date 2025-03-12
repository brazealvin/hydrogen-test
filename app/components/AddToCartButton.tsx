import {type FetcherWithComponents} from '@remix-run/react';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import { useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import * as braze from "@braze/web-sdk"; // add this to the top of root.jsx file

export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
}) {

  const fetcher = useFetcher({ key: "add-to-cart-fetcher" });

  useEffect(() => {
    console.log("fetcher")
    console.log(fetcher)
    if(fetcher.state === "idle" && fetcher.data) {
      //trackCartUpdated(fetcher.data.cart, fetcher.data.storefrontUrl)
      setCartToken(fetcher.data.cart);
    }
  }, [fetcher.state, fetcher.data])

  return (
    <CartForm route="/cart" inputs={{lines}} fetcherKey="add-to-cart-fetcher" action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}


export function trackCartUpdated(cart, storefrontUrl) {
  console.log(cart)

  const eventData = {
    cart_id: cart.id,
    total_value: cart.cost.totalAmount.amount,
    currency: cart.cost.totalAmount.currencyCode,
    products: cart.lines.nodes.map((line) => {
      return {
        product_id: line.merchandise.product.id.toString(),
        product_name: line.merchandise.product.title,
        variant_id: line.merchandise.id.toString(),
        image_url: line.merchandise.image?.url,
        product_url: `${storefrontUrl}/products/${line.merchandise.product.handle}`,
        quantity: Number(line.quantity),
        price: Number(line.cost.totalAmount.amount / Number(line.quantity))
      }
    }),
    source: storefrontUrl,
    metadata: {},
  };
  
  braze.logCustomEvent(
    "ecommerce.cart_updated",
    eventData 
  )
}

export function setCartToken(cart) {
  const cartId = cart.id.substring(cart.id.lastIndexOf('/') + 1) 
  const cartToken = cartId.substring(0, cartId.indexOf("?key="));
  if (cartToken) {
    const cartSessionKey = `ab.shopify.shopify_cart_${cartToken}`;
    const alreadySetCartToken = sessionStorage.getItem(cartSessionKey);

    if (!alreadySetCartToken) {
      braze.getUser().addAlias("shopify_cart_token", `shopify_cart_${cartToken}`)
      braze.requestImmediateDataFlush();
      sessionStorage.setItem(cartSessionKey, cartToken);
    }
  }
}
