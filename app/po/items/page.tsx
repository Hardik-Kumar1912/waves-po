import { redirect } from 'next/navigation';

// Items catalogue has moved to the shared /items route (accessible from both modules).
export default function POItemsRedirect() {
  redirect('/items');
}
