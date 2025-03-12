# Hydrogen upgrade guide: 2024.7.1 to 2025.1.2

----

## Features

### Enable Remix `v3_singleFetch` future flag [#2708](https://github.com/Shopify/hydrogen/pull/2708)

#### Step: 1. In your `vite.config.ts`, add the single fetch future flag [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
+  declare module "@remix-run/server-runtime" {
+    interface Future {
+     v3_singleFetch: true;
+    }
+  }

  export default defineConfig({
    plugins: [
      hydrogen(),
      oxygen(),
      remix({
        presets: [hydrogen.preset()],
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_lazyRouteDiscovery: true,
+         v3_singleFetch: true,
        },
      }),
      tsconfigPaths(),
    ],
```

#### Step: 2. In your `entry.server.tsx`, add `nonce` to the `<RemixServer>` [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
const body = await renderToReadableStream(
 <NonceProvider>
   <RemixServer
     context={remixContext}
     url={request.url}
+     nonce={nonce}
   />
 </NonceProvider>,
```

#### Step: 3. Update the shouldRevalidate function in root.tsx [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
-  defaultShouldRevalidate,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

-  return defaultShouldRevalidate;
+  return false;
};
```

#### Step: 4. Update `cart.tsx` to add a headers export and update to `data` import usage [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
    import {
  -  json,
  +  data,
      type LoaderFunctionArgs,
      type ActionFunctionArgs,
      type HeadersFunction
    } from '@shopify/remix-oxygen';
  + export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

    export async function action({request, context}: ActionFunctionArgs) {
      ...
  -   return json(
  +   return data(
        {
          cart: cartResult,
          errors,
          warnings,
          analytics: {
            cartId,
          },
        },
        {status, headers},
      );
    }

    export async function loader({context}: LoaderFunctionArgs) {
      const {cart} = context;
 -    return json(await cart.get());
 +    return await cart.get();
    }
 ```

#### Step: 5. Deprecate `json` and `defer` import usage from `@shopify/remix-oxygen` [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
- import {json} from "@shopify/remix-oxygen";

  export async function loader({}: LoaderFunctionArgs) {
    let tasks = await fetchTasks();
-   return json(tasks);
+   return tasks;
  }
```

```diff
- import {defer} from "@shopify/remix-oxygen";

  export async function loader({}: LoaderFunctionArgs) {
    let lazyStuff = fetchLazyStuff();
    let tasks = await fetchTasks();
-   return defer({ tasks, lazyStuff });
+   return { tasks, lazyStuff };
  }
```


#### Step: 6. If you were using the second parameter of json/defer to set a custom status or headers on your response, you can continue doing so via the new data API: [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
-  import {json} from "@shopify/remix-oxygen";
+  import {data, type HeadersFunction} from "@shopify/remix-oxygen";

+  /**
+   * If your loader or action is returning a response with headers,
+   * make sure to export a headers function that merges your headers
+   * on your route. Otherwise, your headers may be lost.
+   * Remix doc: https://remix.run/docs/en/main/route/headers
+   **/
+  export const headers: HeadersFunction = ({loaderHeaders}) => loaderHeaders;

  export async function loader({}: LoaderFunctionArgs) {
    let tasks = await fetchTasks();
-    return json(tasks, {
+    return data(tasks, {
      headers: {
        "Cache-Control": "public, max-age=604800"
      }
    });
  }
```


#### Step: 7. If you are using legacy customer account flow or multipass, there are a couple more files that requires updating: [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
+ export const headers: HeadersFunction = ({loaderHeaders}) => loaderHeaders;
```


#### Step: 8. In `routes/account_.register.tsx`, add a `headers` export for `actionHeaders` [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
+ export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;
```


#### Step: 9. If you are using multipass, in `routes/account_.login.multipass.tsx` [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
+ export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;
```


#### Step: 10. Update all `json` response wrapper to `remixData` [#2708](https://github.com/Shopify/hydrogen/pull/2708)

[docs](https://remix.run/docs/en/main/guides/single-fetch)
[#2708](https://github.com/Shopify/hydrogen/pull/2708)
```diff
import {
- json,
+ data as remixData,
} from '@shopify/remix-oxygen';

-  return json(
+  return remixData(
    ...
  );
```

### B2B methods and props are now stable [#2736](https://github.com/Shopify/hydrogen/pull/2736)

#### Step: 1. Search for anywhere using `UNSTABLE_getBuyer` and `UNSTABLE_setBuyer` is update accordingly [#2736](https://github.com/Shopify/hydrogen/pull/2736)

[#2736](https://github.com/Shopify/hydrogen/pull/2736)
```diff
- customerAccount.UNSTABLE_getBuyer();
+ customerAccount.getBuyer()

- customerAccount.UNSTABLE_setBuyer({
+ customerAccount.setBuyer({
    companyLocationId,
  });
```

#### Step: 2. Update `createHydrogenContext` to remove the `unstableB2b` option [#2736](https://github.com/Shopify/hydrogen/pull/2736)

[#2736](https://github.com/Shopify/hydrogen/pull/2736)
```diff
  const hydrogenContext = createHydrogenContext({
    env,
    request,
    cache,
    waitUntil,
    session,
    i18n: {language: 'EN', country: 'US'},
-    customerAccount: {
-      unstableB2b: true,
-    },
    cart: {
      queryFragment: CART_QUERY_FRAGMENT,
    },
  });
```

### Add `language` support to `createCustomerAccountClient` and `createHydrogenContext` [#2746](https://github.com/Shopify/hydrogen/pull/2746)

#### Step: 1. If present, the provided `language` will be used to set the `uilocales` property in the Customer Account API request. This will allow the API to return localized data for the provided language. [#2746](https://github.com/Shopify/hydrogen/pull/2746)

[#2746](https://github.com/Shopify/hydrogen/pull/2746)
```ts
// Optional: provide language data to the constructor
const customerAccount = createCustomerAccountClient({
  // ...
  language,
});
```

#### Step: 2. Calls to `login()` will use the provided `language` without having to pass it explicitly via `uiLocales`; however, if the `login()` method is already using its `uilocales` property, the `language` parameter coming from the context/constructor will be ignored. If nothing is explicitly passed, `login()` will default to `context.i18n.language`. [#2746](https://github.com/Shopify/hydrogen/pull/2746)

[#2746](https://github.com/Shopify/hydrogen/pull/2746)
```ts
export async function loader({request, context}: LoaderFunctionArgs) {
  return context.customerAccount.login({
    uiLocales: 'FR', // will be used instead of the one coming from the context
  });
}
```

### Turn on Remix future flag v3_lazyRouteDiscovery [#2702](https://github.com/Shopify/hydrogen/pull/2702)

#### Add the following line to your vite.config.ts and test your app.
[#2702](https://github.com/Shopify/hydrogen/pull/2702)
```diff
export default defineConfig({
  plugins: [
    hydrogen(),
    oxygen(),
    remix({
      presets: [hydrogen.preset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
+        v3_lazyRouteDiscovery: true,
      },
    }),
    tsconfigPaths(),
  ],
```

### Stabilize getSitemap, getSitemapIndex and implement on skeleton [#2589](https://github.com/Shopify/hydrogen/pull/2589)

#### Step: 1. Update the getSitemapIndex at /app/routes/[sitemap.xml].tsx [#2589](https://github.com/Shopify/hydrogen/pull/2589)

[#2589](https://github.com/Shopify/hydrogen/pull/2589)
```diff
- import {unstable__getSitemapIndex as getSitemapIndex} from '@shopify/hydrogen';
+ import {getSitemapIndex} from '@shopify/hydrogen';
```


#### Step: 2. Update the getSitemap at /app/routes/sitemap.$type.$page[.xml].tsx [#2589](https://github.com/Shopify/hydrogen/pull/2589)

[#2589](https://github.com/Shopify/hydrogen/pull/2589)
```diff
- import {unstable__getSitemap as getSitemap} from '@shopify/hydrogen';
+ import {getSitemap} from '@shopify/hydrogen';
```


### H2O compatibility date [#2380](https://github.com/Shopify/hydrogen/pull/2380)

#### Check your project is working properly in an Oxygen deployment
[#2380](https://github.com/Shopify/hydrogen/pull/2380)

### Simplified creation of app context. [#2333](https://github.com/Shopify/hydrogen/pull/2333)

#### Step: 1. Create a app/lib/context file and use `createHydrogenContext` in it. [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```.ts
// in app/lib/context

import {createHydrogenContext} from '@shopify/hydrogen';

export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
    const hydrogenContext = createHydrogenContext({
      env,
      request,
      cache,
      waitUntil,
      session,
      i18n: {language: 'EN', country: 'US'},
      cart: {
        queryFragment: CART_QUERY_FRAGMENT,
      },
      // ensure to overwrite any options that is not using the default values from your server.ts
    });

  return {
    ...hydrogenContext,
    // declare additional Remix loader context
  };
}

```

#### Step: 2. Use `createAppLoadContext` method in server.ts Ensure to overwrite any options that is not using the default values in `createHydrogenContext` [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```diff
// in server.ts

- import {
-   createCartHandler,
-   createStorefrontClient,
-   createCustomerAccountClient,
- } from '@shopify/hydrogen';
+ import {createAppLoadContext} from '~/lib/context';

export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {

-   const {storefront} = createStorefrontClient(
-     ...
-   );

-   const customerAccount = createCustomerAccountClient(
-     ...
-   );

-   const cart = createCartHandler(
-     ...
-   );

+   const appLoadContext = await createAppLoadContext(
+      request,
+      env,
+      executionContext,
+   );

    /**
      * Create a Remix request handler and pass
      * Hydrogen's Storefront client to the loader context.
      */
    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
-      getLoadContext: (): AppLoadContext => ({
-        session,
-        storefront,
-        customerAccount,
-        cart,
-        env,
-        waitUntil,
-      }),
+      getLoadContext: () => appLoadContext,
    });
  }
```

#### Step: 3. Use infer type for AppLoadContext in env.d.ts [#2333](https://github.com/Shopify/hydrogen/pull/2333)

[#2333](https://github.com/Shopify/hydrogen/pull/2333)
```diff
// in env.d.ts

+ import type {createAppLoadContext} from '~/lib/context';

+ interface AppLoadContext extends Awaited<ReturnType<typeof createAppLoadContext>> {
- interface AppLoadContext {
-  env: Env;
-  cart: HydrogenCart;
-  storefront: Storefront;
-  customerAccount: CustomerAccount;
-  session: AppSession;
-  waitUntil: ExecutionContext['waitUntil'];
}

```

----

----

## Fixes

### Workaround for "Error: failed to execute 'insertBefore' on 'Node'" that sometimes happen during development. [#2710](https://github.com/Shopify/hydrogen/pull/2710)

#### Update your root.tsx so that your style link tags are actual html link tags
[#2710](https://github.com/Shopify/hydrogen/pull/2710)
```diff
// root.tsx

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
-    {rel: 'stylesheet', href: resetStyles},
-    {rel: 'stylesheet', href: appStyles},
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

...

export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
+        <link rel="stylesheet" href={resetStyles}></link>
+        <link rel="stylesheet" href={appStyles}></link>

```

### Make set up cookie banner by default to false [#2588](https://github.com/Shopify/hydrogen/pull/2588)

#### If you are using Shopify's cookie banner to handle user consent in your app, you need to set `withPrivacyBanner: true` to the consent config. Without this update, the Shopify cookie banner will not appear.
[#2588](https://github.com/Shopify/hydrogen/pull/2588)
```diff
  return defer({
    ...
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
+      withPrivacyBanner: true,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  });
```


### Deprecate usages of product.options.values and use product.options.optionValues instead [#2585](https://github.com/Shopify/hydrogen/pull/2585)

#### Step: 1. Update your product graphql query to use the new `optionValues` field [#2585](https://github.com/Shopify/hydrogen/pull/2585)

[#2585](https://github.com/Shopify/hydrogen/pull/2585)
```diff
  const PRODUCT_FRAGMENT = `#graphql
    fragment Product on Product {
      id
      title
      options {
        name
-        values
+        optionValues {
+          name
+        }
      }
```


#### Step: 2. Update your `<VariantSelector>` to use the new `optionValues` field [#2585](https://github.com/Shopify/hydrogen/pull/2585)

[#2585](https://github.com/Shopify/hydrogen/pull/2585)
```diff
  <VariantSelector
    handle={product.handle}
-    options={product.options.filter((option) => option.values.length > 1)}
+    options={product.options.filter((option) => option.optionValues.length > 1)}
    variants={variants}
  >
```


### Update all cart mutation methods from createCartHandler to return cart warnings [#2572](https://github.com/Shopify/hydrogen/pull/2572)

#### Check warnings for stock levels
[#2572](https://github.com/Shopify/hydrogen/pull/2572)

### Update createWithCache to make it harder to accidentally cache undesired results [#2546](https://github.com/Shopify/hydrogen/pull/2546)

#### Step: 1. request is now a mandatory prop when initializing createWithCache. [#2546](https://github.com/Shopify/hydrogen/pull/2546)

[#2546](https://github.com/Shopify/hydrogen/pull/2546)
```diff
// server.ts
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      // ...
-     const withCache = createWithCache({cache, waitUntil});
+     const withCache = createWithCache({cache, waitUntil, request});
```


#### Step: 2. New `withCache.fetch` is for caching simple fetch requests. This method caches the responses if they are OK responses, and you can pass `shouldCacheResponse`, `cacheKey`, etc. to modify behavior. `data` is the consumed body of the response (we need to consume to cache it). [#2546](https://github.com/Shopify/hydrogen/pull/2546)

[#2546](https://github.com/Shopify/hydrogen/pull/2546)
```ts
  const withCache = createWithCache({cache, waitUntil, request});

  const {data, response} = await withCache.fetch<{data: T; error: string}>(
    'my-cms.com/api',
    {
      method: 'POST',
      headers: {'Content-type': 'application/json'},
      body,
    },
    {
      cacheStrategy: CacheLong(),
      // Cache if there are no data errors or a specific data that make this result not suited for caching
      shouldCacheResponse: (result) => !result?.error,
      cacheKey: ['my-cms', body],
      displayName: 'My CMS query',
    },
  );
```


#### Step: 3. The original `withCache` callback function is now `withCache.run`. This is useful to run *multiple* fetch calls and merge their responses, or run any arbitrary code. It caches anything you return, but you can throw if you don't want to cache anything. [#2546](https://github.com/Shopify/hydrogen/pull/2546)

[#2546](https://github.com/Shopify/hydrogen/pull/2546)
```diff
  const withCache = createWithCache({cache, waitUntil, request});

  const fetchMyCMS = (query) => {
-    return withCache(['my-cms', query], CacheLong(), async (params) => {
+    return withCache.run({
+      cacheKey: ['my-cms', query],
+      cacheStrategy: CacheLong(),
+      // Cache if there are no data errors or a specific data that make this result not suited for caching
+      shouldCacheResult: (result) => !result?.errors,
+    }, async(params) => {
      const response = await fetch('my-cms.com/api', {
        method: 'POST',
        body: query,
      });
      if (!response.ok) throw new Error(response.statusText);
      const {data, error} = await response.json();
      if (error || !data) throw new Error(error ?? 'Missing data');
      params.addDebugData({displayName: 'My CMS query', response});
      return data;
    });
  };
```


### Fix an infinite redirect when viewing the cached version of a Hydrogen site on Google Web Cache [#2334](https://github.com/Shopify/hydrogen/pull/2334)

#### Update your entry.client.jsx file to include this check
[#2334](https://github.com/Shopify/hydrogen/pull/2334)
```diff
+ if (!window.location.origin.includes("webcache.googleusercontent.com")) {
   startTransition(() => {
     hydrateRoot(
       document,
       <StrictMode>
         <RemixBrowser />
       </StrictMode>
     );
   });
+ }
```
