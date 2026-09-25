import StoreLayout from "./(store)/layout";
import StoreNotFound, { metadata } from "./(store)/not-found";

export { metadata };

// URLs that match no route still get the full store header, footer and cart.
export default function NotFound() {
  return (
    <StoreLayout params={Promise.resolve({})}>
      <StoreNotFound />
    </StoreLayout>
  );
}
