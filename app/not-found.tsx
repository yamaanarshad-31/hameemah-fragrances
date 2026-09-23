import StoreLayout from "./(store)/layout";
import StoreNotFound from "./(store)/not-found";

// URLs that match no route still get the full store header, footer and cart.
export default function NotFound() {
  return (
    <StoreLayout params={Promise.resolve({})}>
      <StoreNotFound />
    </StoreLayout>
  );
}
